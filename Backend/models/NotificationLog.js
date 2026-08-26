import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema({
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Borrowing',
    required: true,
  },
  type: {
    type: String,
    enum: ['BorrowConfirmation', 'DueReminder', 'OverdueAlert', 'ReturnConfirmation'],
    required: true,
  },
  sentTo: [{
    type: String,
    required: true,
  }],
  sentAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Sent', 'Failed', 'Queued', 'Retrying'],
    default: 'Queued',
  },
  attempts: {
    type: Number,
    default: 0,
  },
  maxAttempts: {
    type: Number,
    default: 3,
  },
  error: {
    type: String,
    default: '',
  },
  // Content snapshot for audit
  subject: { type: String, default: '' },
  bookTitle: { type: String, default: '' },
  employeeName: { type: String, default: '' },
}, { timestamps: true });

notificationLogSchema.index({ transaction: 1, type: 1 });
notificationLogSchema.index({ status: 1 });

export default mongoose.model('NotificationLog', notificationLogSchema);
