const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Rubric = mongoose.model('Rubric');
const Criterion = mongoose.model('Criterion');
const EventRole = mongoose.model('EventRole');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/rubrics
 * @desc    Create a rubric for an event round
 * @access  Private (Coordinator or Admin)
 */
router.post('/', authenticateToken, async (req, res) => {
  const { eventId, trackId, roundId, name, description, totalWeight, maxCriterionScore } = req.body;

  if (!eventId || !trackId || !roundId || !name) {
    return res.status(400).json({ message: 'Event ID, Track ID, Round ID, and Rubric name are required.' });
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
      if (!coordinatorRole) return res.status(403).json({ message: 'Unauthorized. Coordinator role required.' });
    }

    // Check if rubric already exists for this round
    const existing = await Rubric.findOne({ roundId, isActive: true });
    if (existing) {
      return res.status(400).json({ message: 'An active rubric already exists for this round.' });
    }

    const rubric = new Rubric({
      eventId,
      trackId,
      roundId,
      name,
      description,
      totalWeight: totalWeight || 100,
      maxCriterionScore: maxCriterionScore || 10.0,
      createdBy: req.user._id
    });

    await rubric.save();
    res.status(201).json(rubric);

  } catch (error) {
    console.error('Create Rubric Error:', error.message);
    res.status(500).json({ message: 'Server error creating rubric.' });
  }
});

/**
 * @route   GET /api/rubrics/round/:roundId
 * @desc    Get active rubric for a round including criteria
 * @access  Private
 */
router.get('/round/:roundId', authenticateToken, async (req, res) => {
  try {
    const rubric = await Rubric.findOne({ roundId: req.params.roundId, isActive: true });
    if (!rubric) {
      return res.status(404).json({ message: 'No active rubric found for this round.' });
    }

    const criteria = await Criterion.find({ rubricId: rubric._id }).sort({ order: 1 });

    res.json({
      rubric,
      criteria
    });

  } catch (error) {
    console.error('Fetch Rubric Error:', error.message);
    res.status(500).json({ message: 'Server error retrieving rubric.' });
  }
});

/**
 * @route   POST /api/rubrics/:rubricId/criteria
 * @desc    Add a criterion to a rubric
 * @access  Private (Coordinator or Admin)
 */
router.post('/:rubricId/criteria', authenticateToken, async (req, res) => {
  const { rubricId } = req.params;
  const { code, name, description, weight, maxScore, excellentDescription, goodDescription, passedDescription, failedDescription, order } = req.body;

  if (!code || !name || weight === undefined) {
    return res.status(400).json({ message: 'Criterion code, name, and weight are required.' });
  }

  try {
    const rubric = await Rubric.findById(rubricId);
    if (!rubric) return res.status(404).json({ message: 'Rubric not found.' });
    if (rubric.isLocked) {
      return res.status(400).json({ message: 'Rubric is locked. Criteria cannot be modified.' });
    }

    // Auth check
    if (!req.user.isSystemAdmin) {
      const isCoord = await EventRole.findOne({ userId: req.user._id, eventId: rubric.eventId, role: 'coordinator' });
      if (!isCoord) return res.status(403).json({ message: 'Unauthorized.' });
    }

    // Check duplicate code
    const existing = await Criterion.findOne({ rubricId, code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'A criterion with this code already exists in this rubric.' });
    }

    const criterion = new Criterion({
      rubricId,
      code: code.toUpperCase(),
      name,
      description,
      weight: parseFloat(weight),
      maxScore: maxScore ? parseFloat(maxScore) : 10.0,
      excellentDescription,
      goodDescription,
      passedDescription,
      failedDescription,
      order: order !== undefined ? parseInt(order) : undefined
    });

    await criterion.save();
    res.status(201).json(criterion);

  } catch (error) {
    console.error('Add Criterion Error:', error.message);
    res.status(500).json({ message: 'Server error adding criterion.' });
  }
});

/**
 * @route   POST /api/rubrics/:rubricId/lock
 * @desc    Lock rubric to enable grading
 * @access  Private (Coordinator or Admin)
 */
router.post('/:rubricId/lock', authenticateToken, async (req, res) => {
  try {
    const rubric = await Rubric.findById(req.params.rubricId);
    if (!rubric) return res.status(404).json({ message: 'Rubric not found.' });

    // Auth check
    if (!req.user.isSystemAdmin) {
      const isCoord = await EventRole.findOne({ userId: req.user._id, eventId: rubric.eventId, role: 'coordinator' });
      if (!isCoord) return res.status(403).json({ message: 'Unauthorized.' });
    }

    // Validate sum of criteria weights matches totalWeight
    const criteria = await Criterion.find({ rubricId: rubric._id });
    const weightSum = criteria.reduce((sum, c) => sum + c.weight, 0);

    if (Math.abs(weightSum - rubric.totalWeight) > 0.01) {
      return res.status(400).json({ 
        message: `Cannot lock rubric. The sum of criteria weights (${weightSum}%) must match the total rubric weight (${rubric.totalWeight}%).` 
      });
    }

    rubric.isLocked = true;
    rubric.lockedBy = req.user._id;
    rubric.lockedAt = new Date();
    await rubric.save();

    res.json({ message: 'Rubric locked and ready for grading.', rubric });

  } catch (error) {
    console.error('Lock Rubric Error:', error.message);
    res.status(500).json({ message: 'Server error locking rubric.' });
  }
});

/**
 * @route   GET /api/rubrics
 * @desc    Get all active rubrics with their criteria
 * @access  Private (Coordinator or Admin)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rubrics = await Rubric.find({ isActive: true })
      .populate('eventId', 'name')
      .populate('trackId', 'name')
      .populate('roundId', 'name');
    
    // Fetch criteria for each rubric
    const rubricsWithCriteria = await Promise.all(
      rubrics.map(async (r) => {
        const criteria = await Criterion.find({ rubricId: r._id }).sort({ order: 1 });
        return {
          ...r.toObject(),
          criteria
        };
      })
    );
    
    res.json(rubricsWithCriteria);
  } catch (error) {
    console.error('Fetch All Rubrics Error:', error.message);
    res.status(500).json({ message: 'Server error retrieving rubrics.' });
  }
});

/**
 * @route   POST /api/rubrics/clone
 * @desc    Clone an existing rubric to a new event round
 * @access  Private (Coordinator or Admin)
 */
router.post('/clone', authenticateToken, async (req, res) => {
  const { fromRubricId, eventId, trackId, roundId, name } = req.body;

  if (!fromRubricId || !eventId || !trackId || !roundId || !name) {
    return res.status(400).json({ message: 'From Rubric ID, Event ID, Track ID, Round ID, and New Rubric Name are required.' });
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
      if (!coordinatorRole) return res.status(403).json({ message: 'Unauthorized. Coordinator role required.' });
    }

    // Check if rubric already exists for this target round
    const existing = await Rubric.findOne({ roundId, isActive: true });
    if (existing) {
      return res.status(400).json({ message: 'An active rubric already exists for this round.' });
    }

    // Find source rubric
    const sourceRubric = await Rubric.findById(fromRubricId);
    if (!sourceRubric) {
      return res.status(404).json({ message: 'Source rubric not found.' });
    }

    // Create new rubric
    const newRubric = new Rubric({
      eventId,
      trackId,
      roundId,
      name,
      description: sourceRubric.description,
      totalWeight: sourceRubric.totalWeight,
      maxCriterionScore: sourceRubric.maxCriterionScore,
      createdBy: req.user._id
    });

    await newRubric.save();

    // Find source criteria and clone them
    const sourceCriteria = await Criterion.find({ rubricId: fromRubricId });
    const newCriteria = sourceCriteria.map(c => new Criterion({
      rubricId: newRubric._id,
      code: c.code,
      name: c.name,
      description: c.description,
      weight: c.weight,
      maxScore: c.maxScore,
      excellentDescription: c.excellentDescription,
      goodDescription: c.goodDescription,
      passedDescription: c.passedDescription,
      failedDescription: c.failedDescription,
      order: c.order
    }));

    await Criterion.insertMany(newCriteria);

    res.status(201).json({
      message: 'Rubric cloned successfully!',
      rubric: newRubric,
      criteria: newCriteria
    });

  } catch (error) {
    console.error('Clone Rubric Error:', error.message);
    res.status(500).json({ message: 'Server error cloning rubric.' });
  }
});

module.exports = router;
