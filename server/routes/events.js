const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Event = mongoose.model('Event');
const Track = mongoose.model('Track');
const Round = mongoose.model('Round');
const EventRole = mongoose.model('EventRole');
const { authenticateToken, requireSystemAdmin, requireEventRole } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/events
 * @desc    Get all events (filtered by semester/year/status)
 * @access  Public
 */
router.get('/', async (req, res) => {
  const { semester, year, status } = req.query;
  const filter = {};
  
  if (semester) filter.semester = semester;
  if (year) filter.year = parseInt(year);
  if (status) filter.status = status;

  try {
    const events = await Event.find(filter).sort({ year: -1, semester: 1 });
    res.json(events);
  } catch (error) {
    console.error('Fetch Events Error:', error.message);
    res.status(500).json({ message: 'Server error retrieving events.' });
  }
});

/**
 * @route   POST /api/events
 * @desc    Create a new event (System Admin only)
 * @access  Private (System Admin)
 */
router.post('/', authenticateToken, requireSystemAdmin, async (req, res) => {
  const { name, semester, year, description, bannerUrl, maxTeams, githubOrgName } = req.body;

  if (!name || !semester || !year) {
    return res.status(400).json({ message: 'Event name, semester, and year are required.' });
  }

  try {
    // Check if event already exists for this semester and year
    const existing = await Event.findOne({ semester, year });
    if (existing) {
      return res.status(400).json({ 
        message: `An event already exists for semester "${semester}" and year "${year}".` 
      });
    }

    const newEvent = new Event({
      name,
      semester,
      year: parseInt(year),
      description,
      bannerUrl,
      maxTeams: maxTeams ? parseInt(maxTeams) : 20,
      githubOrgName: githubOrgName || 'seal-hackathon-2026',
      status: 'draft',
      registrationOpen: new Date(),
      registrationClose: new Date(Date.now() + 3600000 * 24 * 14) // 2 weeks default
    });

    await newEvent.save();

    // Create a default coordinator EventRole for the creator
    const creatorRole = new EventRole({
      userId: req.user._id,
      eventId: newEvent._id,
      role: 'coordinator',
      assignedBy: req.user._id
    });
    await creatorRole.save();

    res.status(201).json({
      message: 'Event created successfully!',
      event: newEvent
    });

  } catch (error) {
    console.error('Create Event Error:', error.message);
    res.status(500).json({ message: 'Server error creating event.' });
  }
});

/**
 * @route   GET /api/events/:id
 * @desc    Get detailed event info including tracks & rounds
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const tracks = await Track.find({ eventId: event._id });
    const rounds = await Round.find({ eventId: event._id }).sort({ order: 1 });

    res.json({
      event,
      tracks,
      rounds
    });
  } catch (error) {
    console.error('Fetch Event Details Error:', error.message);
    res.status(500).json({ message: 'Server error retrieving event details.' });
  }
});

/**
 * @route   POST /api/events/:eventId/tracks
 * @desc    Create a Track in an event
 * @access  Private (Coordinator or Admin)
 */
router.post('/:eventId/tracks', authenticateToken, async (req, res) => {
  const { eventId } = req.params;
  const { name, description, maxTeams } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Track name is required.' });
  }

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Auth check: System Admin or has coordinator role
    if (!req.user.isSystemAdmin) {
      const coordinatorRole = await EventRole.findOne({
        userId: req.user._id,
        eventId,
        role: 'coordinator',
        status: 'active'
      });
      if (!coordinatorRole) {
        return res.status(403).json({ message: 'Only coordinators or system administrators can create tracks.' });
      }
    }

    const newTrack = new Track({
      eventId,
      name,
      description,
      maxTeams: maxTeams ? parseInt(maxTeams) : 10,
      topicSubmissionOpen: true
    });

    await newTrack.save();
    res.status(201).json(newTrack);

  } catch (error) {
    console.error('Create Track Error:', error.message);
    res.status(500).json({ message: 'Server error creating track.' });
  }
});

/**
 * @route   POST /api/events/:eventId/tracks/:trackId/rounds
 * @desc    Add a Round to a track
 * @access  Private (Coordinator or Admin)
 */
router.post('/:eventId/tracks/:trackId/rounds', authenticateToken, async (req, res) => {
  const { eventId, trackId } = req.params;
  const { name, order, submissionDeadline, advanceTopN } = req.body;

  if (!name || order === undefined) {
    return res.status(400).json({ message: 'Round name and order sequence are required.' });
  }

  try {
    // Auth Check
    if (!req.user.isSystemAdmin) {
      const coordinatorRole = await EventRole.findOne({
        userId: req.user._id,
        eventId,
        role: 'coordinator',
        status: 'active'
      });
      if (!coordinatorRole) {
        return res.status(403).json({ message: 'Unauthorized.' });
      }
    }

    const newRound = new Round({
      eventId,
      trackId,
      name,
      order: parseInt(order),
      submissionDeadline: submissionDeadline ? new Date(submissionDeadline) : undefined,
      advanceTopN: advanceTopN ? parseInt(advanceTopN) : undefined,
      status: 'pending'
    });

    await newRound.save();
    res.status(201).json(newRound);

  } catch (error) {
    console.error('Create Round Error:', error.message);
    res.status(500).json({ message: 'Server error creating round.' });
  }
});

/**
 * @route   POST /api/events/:eventId/upload-exam
 * @desc    Simulate exam attachment file upload
 * @access  Private (Coordinator or Admin)
 */
router.post('/:eventId/upload-exam', authenticateToken, async (req, res) => {
  const { eventId } = req.params;
  const { trackId, fileName, fileUrl, roundId } = req.body;

  if (!fileName || !fileUrl) {
    return res.status(400).json({ message: 'File name and URL are required.' });
  }

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    // Auth check
    if (!req.user.isSystemAdmin) {
      const isCoord = await EventRole.findOne({ userId: req.user._id, eventId, role: 'coordinator' });
      if (!isCoord) return res.status(403).json({ message: 'Unauthorized.' });
    }

    const fileMeta = {
      id: `file-${Date.now()}`,
      fileName,
      fileUrl,
      roundId: roundId || null,
      trackId: trackId || null,
      uploadedAt: new Date(),
      uploadedBy: req.user.fullName
    };

    if (trackId) {
      const track = await Track.findById(trackId);
      if (track) {
        track.attachments.push(fileMeta);
        await track.save();
      }
    } else {
      event.attachments.push(fileMeta);
      await event.save();
    }

    res.json({
      message: 'Exam file details successfully saved to track/event schema!',
      attachment: fileMeta
    });

  } catch (error) {
    console.error('Upload Exam Details Error:', error.message);
    res.status(500).json({ message: 'Server error saving exam attachments.' });
  }
});

module.exports = router;
