const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const crypto = require('crypto');

const User = mongoose.model('User');
const EventRole = mongoose.model('EventRole');
const { authenticateToken, requireSystemAdmin } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'seal_hackathon_secret_key_2026';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  const { email, password, fullName, studentId, university, githubUsername } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ message: 'Email, password, and full name are required.' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user. First user registered is auto system admin for testing ease.
    const isFirstUser = (await User.countDocuments({})) === 0;

    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      studentId,
      university,
      githubUsername,
      isSystemAdmin: isFirstUser,
      isApproved: true // Auto-approve for demo
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        isSystemAdmin: user.isSystemAdmin,
        githubUsername: user.githubUsername
      }
    });

  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user & return token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide both email and password.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Get event roles
    const roles = await EventRole.find({ userId: user._id, status: 'active' }).populate('eventId', 'name semester year');

    // Generate JWT
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        isSystemAdmin: user.isSystemAdmin,
        githubUsername: user.githubUsername,
        avatarUrl: user.avatarUrl
      },
      roles: roles.map(r => ({
        id: r._id,
        eventId: r.eventId ? r.eventId._id : null,
        eventName: r.eventId ? `${r.eventId.name} (${r.eventId.semester} ${r.eventId.year})` : 'System',
        role: r.role,
        trackId: r.trackId
      }))
    });

  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user details & context-specific roles
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const roles = await EventRole.find({ userId: req.user._id, status: 'active' }).populate('eventId', 'name semester year');
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        fullName: req.user.fullName,
        studentId: req.user.studentId,
        university: req.user.university,
        githubUsername: req.user.githubUsername,
        isSystemAdmin: req.user.isSystemAdmin
      },
      roles: roles.map(r => ({
        id: r._id,
        eventId: r.eventId ? r.eventId._id : null,
        eventName: r.eventId ? `${r.eventId.name} (${r.eventId.semester} ${r.eventId.year})` : 'System',
        role: r.role,
        trackId: r.trackId
      }))
    });
  } catch (error) {
    console.error('Fetch Profile Error:', error.message);
    res.status(500).json({ message: 'Server error retrieving profile.' });
  }
});

/**
 * @route   POST /api/auth/assign-role
 * @desc    Assign event role to a user (System Admin only)
 * @access  Private (System Admin)
 */
router.post('/assign-role', authenticateToken, requireSystemAdmin, async (req, res) => {
  const { userEmail, eventId, trackId, role } = req.body;

  if (!userEmail || !eventId || !role) {
    return res.status(400).json({ message: 'User email, event ID, and role are required.' });
  }

  try {
    const targetUser = await User.findOne({ email: userEmail.toLowerCase() });
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found.' });
    }

    // Delete existing role for same user/event to prevent duplicate key error
    await EventRole.deleteMany({ userId: targetUser._id, eventId });

    const newRole = new EventRole({
      userId: targetUser._id,
      eventId,
      trackId: trackId || undefined,
      role,
      assignedBy: req.user._id
    });

    await newRole.save();
    res.status(201).json({ message: `Successfully assigned role ${role} to ${userEmail}.` });

  } catch (error) {
    console.error('Assign Role Error:', error.message);
    res.status(500).json({ message: 'Server error assigning role.' });
  }
});

/**
 * @route   POST /api/auth/google
 * @desc    Login or Register with Google Account
 * @access  Public
 */
router.post('/google', async (req, res) => {
  const { idToken, email, fullName, isMock } = req.body;

  let userEmail = email;
  let userName = fullName;
  let userAvatar = '';

  if (isMock || !idToken) {
    // Mock simulation flow
    if (!userEmail) {
      return res.status(400).json({ message: 'Email is required for Google Sign-in.' });
    }
    userName = userName || userEmail.split('@')[0];
  } else {
    try {
      // Real flow: verify token with Google API
      const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!googleRes.ok) {
        return res.status(400).json({ message: 'Invalid Google token.' });
      }
      const payload = await googleRes.json();
      userEmail = payload.email;
      userName = payload.name || payload.email.split('@')[0];
      userAvatar = payload.picture;
    } catch (err) {
      console.error('Google Auth Error:', err.message);
      return res.status(500).json({ message: 'Error verifying Google account.' });
    }
  }

  try {
    let user = await User.findOne({ email: userEmail.toLowerCase() });
    const isNewUser = !user;

    if (!user) {
      // Register new user via Google
      const salt = await bcrypt.genSalt(10);
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, salt);
      
      const isFirstUser = (await User.countDocuments({})) === 0;

      user = new User({
        email: userEmail.toLowerCase(),
        passwordHash,
        fullName: userName,
        avatarUrl: userAvatar,
        isSystemAdmin: isFirstUser,
        isApproved: true
      });
      await user.save();
    } else if (userAvatar && !user.avatarUrl) {
      user.avatarUrl = userAvatar;
      await user.save();
    }

    const roles = await EventRole.find({ userId: user._id, status: 'active' }).populate('eventId', 'name semester year');
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      isNewUser,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        isSystemAdmin: user.isSystemAdmin,
        githubUsername: user.githubUsername,
        avatarUrl: user.avatarUrl
      },
      roles: roles.map(r => ({
        id: r._id,
        eventId: r.eventId ? r.eventId._id : null,
        eventName: r.eventId ? `${r.eventId.name} (${r.eventId.semester} ${r.eventId.year})` : 'System',
        role: r.role,
        trackId: r.trackId
      }))
    });

  } catch (error) {
    console.error('Google Login DB Error:', error.message);
    res.status(500).json({ message: 'Server error processing Google account.' });
  }
});

/**
 * @route   POST /api/auth/github
 * @desc    Login or Register with GitHub Account
 * @access  Public
 */
router.post('/github', async (req, res) => {
  const { accessToken, code, email, fullName, githubUsername, isMock } = req.body;

  let userEmail = email;
  let userName = fullName;
  let userGithub = githubUsername;
  let userAvatar = '';
  let currentToken = accessToken;

  if (!isMock && code) {
    try {
      const clientId = process.env.GITHUB_CLIENT_ID || 'Ov23liz8uHIFRtgdwDwE';
      const clientSecret = process.env.GITHUB_CLIENT_SECRET || 'eb9a526811f9bc9b70b5ec1042974aa5e3c55df9';

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code
        })
      });

      if (!tokenRes.ok) {
        return res.status(400).json({ message: 'Failed to exchange GitHub authorization code.' });
      }

      const tokenData = await tokenRes.json();
      if (tokenData.error) {
        return res.status(400).json({ message: tokenData.error_description || 'GitHub OAuth authorization failed.' });
      }

      currentToken = tokenData.access_token;
    } catch (err) {
      console.error('GitHub Code Exchange Error:', err.message);
      return res.status(500).json({ message: 'Server error during GitHub code exchange.' });
    }
  }

  if (isMock || !currentToken) {
    // Mock simulation flow
    if (!userEmail) {
      return res.status(400).json({ message: 'Email is required for GitHub Sign-in.' });
    }
    userName = userName || userEmail.split('@')[0];
    userGithub = userGithub || userName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  } else {
    try {
      // Real flow: fetch user profile from GitHub API using currentToken
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${currentToken}`,
          'Accept': 'application/json',
          'User-Agent': 'SEAL-Hackathon'
        }
      });
      if (!userRes.ok) {
        return res.status(400).json({ message: 'Invalid GitHub access token.' });
      }
      const profile = await userRes.json();
      
      // Fetch primary email if public email is not set
      let emailRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `token ${currentToken}`,
          'Accept': 'application/json',
          'User-Agent': 'SEAL-Hackathon'
        }
      });
      let primaryEmail = profile.email;
      if (emailRes.ok) {
        const emails = await emailRes.json();
        const primary = emails.find(e => e.primary);
        if (primary) primaryEmail = primary.email;
      }

      userEmail = primaryEmail || profile.email;
      if (!userEmail) {
        return res.status(400).json({ message: 'Could not retrieve email from GitHub. Please set a public email on GitHub.' });
      }

      userName = profile.name || profile.login;
      userGithub = profile.login;
      userAvatar = profile.avatar_url;
    } catch (err) {
      console.error('GitHub Auth Error:', err.message);
      return res.status(500).json({ message: 'Error verifying GitHub account.' });
    }
  }

  try {
    let user = await User.findOne({ email: userEmail.toLowerCase() });
    const isNewUser = !user;

    if (!user) {
      // Register new user via GitHub
      const salt = await bcrypt.genSalt(10);
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      const isFirstUser = (await User.countDocuments({})) === 0;

      user = new User({
        email: userEmail.toLowerCase(),
        passwordHash,
        fullName: userName,
        githubUsername: userGithub,
        avatarUrl: userAvatar,
        isSystemAdmin: isFirstUser,
        isApproved: true
      });
      await user.save();
    } else {
      let updated = false;
      if (!user.githubUsername) {
        user.githubUsername = userGithub;
        updated = true;
      }
      if (userAvatar && !user.avatarUrl) {
        user.avatarUrl = userAvatar;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    const roles = await EventRole.find({ userId: user._id, status: 'active' }).populate('eventId', 'name semester year');
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      isNewUser,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        isSystemAdmin: user.isSystemAdmin,
        githubUsername: user.githubUsername,
        avatarUrl: user.avatarUrl
      },
      roles: roles.map(r => ({
        id: r._id,
        eventId: r.eventId ? r.eventId._id : null,
        eventName: r.eventId ? `${r.eventId.name} (${r.eventId.semester} ${r.eventId.year})` : 'System',
        role: r.role,
        trackId: r.trackId
      }))
    });

  } catch (error) {
    console.error('GitHub Login DB Error:', error.message);
    res.status(500).json({ message: 'Server error processing GitHub account.' });
  }
});

module.exports = router;
