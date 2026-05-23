const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String },
  title: { type: String },
  body: { type: String },
  metadata: { type: Schema.Types.Mixed, default: {} },
  channel: { type: String, enum: ['email', 'in_app'] },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  sentAt: { type: Date }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);