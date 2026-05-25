const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Notification = mongoose.model('Notification');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for logged in user
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 notifications
    
    res.json(notifications);
  } catch (error) {
    console.error('Fetch Notifications Error:', error.message);
    res.status(500).json({ message: 'Server error retrieving notifications.' });
  }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: 'sent' }, // using 'sent' as read/cleared for now based on schema
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Mark Notification Read Error:', error.message);
    res.status(500).json({ message: 'Server error updating notification.' });
  }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read for logged in user
 * @access  Private
 */
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, status: 'pending' },
      { $set: { status: 'sent' } }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark All Notifications Read Error:', error.message);
    res.status(500).json({ message: 'Server error updating notifications.' });
  }
});

module.exports = router;
