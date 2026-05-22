const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const crypto = require('crypto');

const Team = mongoose.model('Team');
const TeamMember = mongoose.model('TeamMember');
const User = mongoose.model('User');
const Event = mongoose.model('Event');
const Track = mongoose.model('Track');
const GithubRepository = mongoose.model('GithubRepository');

const emailService = require('../services/emailService');
const githubService = require('../services/githubService');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/teams/register
 * @desc    Register a team and invite members
 * @access  Private (Participants)
 */
router.post('/register', authenticateToken, async (req, res) => {
  const { eventId, trackId, teamName, membersList } = req.body;

  if (!eventId || !trackId || !teamName || !membersList || !Array.isArray(membersList)) {
    return res.status(400).json({ message: 'Missing required registration parameters.' });
  }

  try {
    // 1. Verify Event is active & open for registration
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    if (event.status !== 'draft' && event.status !== 'registration') {
      return res.status(400).json({ message: 'Registration for this event is closed.' });
    }

    // Check overall event capacity
    const confirmedTeamsCount = await Team.countDocuments({ eventId, status: 'confirmed' });
    if (event.maxTeams && confirmedTeamsCount >= event.maxTeams) {
      return res.status(400).json({ message: 'This event has reached its maximum team capacity.' });
    }

    // Check track capacity
    const track = await Track.findById(trackId);
    if (!track) return res.status(404).json({ message: 'Track not found.' });
    
    const trackConfirmedCount = await Team.countDocuments({ trackId, status: 'confirmed' });
    if (track.maxTeams && trackConfirmedCount >= track.maxTeams) {
      return res.status(400).json({ message: 'This track has reached its maximum team capacity.' });
    }

    // 2. Validate that team name is unique inside the event track
    const existingTeam = await Team.findOne({ eventId, trackId, name: teamName });
    if (existingTeam) {
      return res.status(400).json({ message: 'A team with this name already exists in this track.' });
    }

    // 3. Create the Team record
    const team = new Team({
      eventId,
      trackId,
      leaderId: req.user._id,
      name: teamName,
      status: 'pending_confirm'
    });
    await team.save();

    // 4. Register/Handle Leader as TeamMember
    const leaderMember = new TeamMember({
      teamId: team._id,
      userId: req.user._id,
      role: 'leader',
      confirmStatus: 'confirmed',
      confirmedAt: new Date()
    });
    await leaderMember.save();

    // 5. Loop through and invite other members
    for (const memberData of membersList) {
      const { email, fullName, githubUsername, studentId } = memberData;
      if (!email) continue;

      // Find or create User record for member
      let memberUser = await User.findOne({ email: email.toLowerCase() });
      if (!memberUser) {
        // Create user placeholder with random password (must set later)
        const placeholderPass = crypto.randomBytes(8).toString('hex');
        memberUser = new User({
          email: email.toLowerCase(),
          passwordHash: crypto.createHash('sha256').update(placeholderPass).digest('hex'), // temp hash
          fullName: fullName || email.split('@')[0],
          studentId: studentId || '',
          githubUsername: githubUsername || '',
          isApproved: true
        });
        await memberUser.save();
      } else if (githubUsername && !memberUser.githubUsername) {
        // Update user github if not filled
        memberUser.githubUsername = githubUsername;
        await memberUser.save();
      }

      // Generate verification token
      const token = crypto.randomBytes(32).toString('hex');
      const confirmTokenExpiry = new Date(Date.now() + 3600000 * 48); // 48h expiry

      const teamMember = new TeamMember({
        teamId: team._id,
        userId: memberUser._id,
        role: 'member',
        confirmStatus: 'pending',
        confirmTokenHash: token,
        confirmTokenExpiry
      });
      await teamMember.save();

      // Send email invitation
      // In production, point to real client domain.
      const inviteLink = `${req.protocol}://${req.get('host')}/api/teams/confirm-invite?token=${token}`;
      await emailService.sendTeamInvitation(memberUser.email, teamName, inviteLink);
    }

    res.status(201).json({
      message: 'Team registered! Invitation emails have been sent. The team is pending confirmation from all members.',
      teamId: team._id,
      status: team.status
    });

  } catch (error) {
    console.error('Team Registration Error:', error.message);
    res.status(500).json({ message: 'Server error during team registration.' });
  }
});

/**
 * @route   GET /api/teams/confirm-invite
 * @desc    Confirm team participation link
 * @access  Public
 */
router.get('/confirm-invite', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('<h1>Error</h1><p>Confirmation token is missing.</p>');
  }

  try {
    const member = await TeamMember.findOne({
      confirmTokenHash: token,
      confirmTokenExpiry: { $gt: new Date() }
    });

    if (!member) {
      return res.status(400).send('<h1>Link Expired or Invalid</h1><p>Your team confirmation token is invalid or has expired.</p>');
    }

    // Confirm member
    member.confirmStatus = 'confirmed';
    member.confirmTokenHash = undefined;
    member.confirmTokenExpiry = undefined;
    member.confirmedAt = new Date();
    await member.save();

    // Check if ALL team members are now confirmed
    const team = await Team.findById(member.teamId);
    const totalMembers = await TeamMember.find({ teamId: team._id });
    const pendingCount = totalMembers.filter(m => m.confirmStatus !== 'confirmed').length;

    if (pendingCount === 0) {
      // All confirmed! Promote team status
      team.status = 'confirmed';
      await team.save();

      console.log(`[TEAM] Team "${team.name}" is now FULLY CONFIRMED! Creating repo...`);

      // 1. Automatically create Github Repository
      // Slugify name
      const slugRepoName = team.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const gitResult = await githubService.createTeamRepository(slugRepoName, 'private');
      
      const newRepo = new GithubRepository({
        eventId: team.eventId,
        trackId: team.trackId,
        teamId: team._id,
        repoName: slugRepoName,
        repoUrl: gitResult.repoUrl,
        githubRepoId: gitResult.githubRepoId,
        syncStatus: 'not_synced'
      });
      await newRepo.save();

      // 2. Add collaborators
      const populatedMembers = await TeamMember.find({ teamId: team._id }).populate('userId');
      for (const tm of populatedMembers) {
        if (tm.userId && tm.userId.githubUsername) {
          await githubService.addCollaborator(slugRepoName, tm.userId.githubUsername);
        }
      }

      // 3. Auto capacity checking and close form logic
      const event = await Event.findById(team.eventId);
      const confirmedTeams = await Team.countDocuments({ eventId: team.eventId, status: 'confirmed' });
      
      if (event.maxTeams && confirmedTeams >= event.maxTeams) {
        event.status = 'ongoing'; // Auto-close registration, lock event
        await event.save();
        console.log(`[EVENT] Event "${event.name}" registration automatically CLOSED as it hit max team limit (${event.maxTeams}).`);
      }
    }

    // Send successful response page (HTML mockup or redirect)
    res.send(`
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #10b981;">Participation Confirmed!</h1>
        <p>You have successfully joined the team. You may close this tab and return to the dashboard.</p>
        <a href="http://localhost:5173" style="color: #4f46e5; text-decoration: none; font-weight: bold;">Go to Dashboard</a>
      </div>
    `);

  } catch (error) {
    console.error('Invite Confirmation Error:', error.message);
    res.status(500).send('<h1>Server Error</h1><p>An error occurred verifying your invitation.</p>');
  }
});

/**
 * @route   GET /api/teams/my-team
 * @desc    Get logged in user's team details
 * @access  Private
 */
router.get('/my-team', authenticateToken, async (req, res) => {
  try {
    const memberRecord = await TeamMember.findOne({ userId: req.user._id, confirmStatus: 'confirmed' });
    if (!memberRecord) {
      return res.status(404).json({ message: 'You are not currently in any confirmed team.' });
    }

    const team = await Team.findById(memberRecord.teamId)
      .populate('eventId', 'name semester year status')
      .populate('trackId', 'name description');

    const members = await TeamMember.find({ teamId: team._id })
      .populate('userId', 'fullName email studentId githubUsername avatarUrl');

    const repo = await GithubRepository.findOne({ teamId: team._id });

    res.json({
      team,
      members,
      repository: repo
    });

  } catch (error) {
    console.error('Fetch My Team Error:', error.message);
    res.status(500).json({ message: 'Server error retrieving team.' });
  }
});

/**
 * @route   POST /api/teams/submit-topic
 * @desc    Submit project topic details (Team Leader only)
 * @access  Private (Team Leader)
 */
router.post('/submit-topic', authenticateToken, async (req, res) => {
  const { teamId, title, description, documentationLink } = req.body;

  if (!teamId || !title) {
    return res.status(400).json({ message: 'Team ID and topic title are required.' });
  }

  try {
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    // Validate that user is the leader
    if (team.leaderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the team leader can submit topic files.' });
    }

    team.topicSubmission = {
      title,
      description,
      documentationLink,
      submittedAt: new Date(),
      updatedAt: new Date()
    };

    await team.save();
    res.json({
      message: 'Topic details and link saved successfully!',
      submission: team.topicSubmission
    });

  } catch (error) {
    console.error('Submit Topic Error:', error.message);
    res.status(500).json({ message: 'Server error saving submission.' });
  }
});

/**
 * @route   GET /api/teams/all
 * @desc    Get all teams in an event
 * @access  Private (Coordinator or Admin)
 */
router.get('/all/:eventId', authenticateToken, async (req, res) => {
  try {
    const teams = await Team.find({ eventId: req.params.eventId })
      .populate('trackId', 'name')
      .populate('leaderId', 'fullName email');

    const detailedTeams = await Promise.all(teams.map(async (t) => {
      const members = await TeamMember.find({ teamId: t._id }).populate('userId', 'fullName email githubUsername confirmStatus');
      const repo = await GithubRepository.findOne({ teamId: t._id });
      return {
        ...t.toObject(),
        members,
        repository: repo
      };
    }));

    res.json(detailedTeams);
  } catch (error) {
    console.error('Get All Teams Error:', error.message);
    res.status(500).json({ message: 'Server error retrieving teams.' });
  }
});

module.exports = router;
