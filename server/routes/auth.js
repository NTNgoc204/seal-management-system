const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

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

module.exports = router;
