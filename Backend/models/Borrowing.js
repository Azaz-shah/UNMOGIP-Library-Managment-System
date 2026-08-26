import mongoose from 'mongoose';

const borrowingSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book is required'],
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee is required'],
  },
  // Section 1: Who issued and who processed return
  borrowedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  returnedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  borrowDate: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  returnDate: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['borrowed', 'returned', 'overdue'],
    default: 'borrowed',
  },
  // Rule 4.3: Mark returned late for reporting
  isReturnedLate: {
    type: Boolean,
    default: false,
  },
  // Notification tracking
  notificationsSent: {
    reminder1Day: { type: Boolean, default: false },
    reminderDueDate: { type: Boolean, default: false },
    overdueAlert: { type: Boolean, default: false },
  },
  // Audit trail
  issuedByScan: { type: Boolean, default: false },
  returnedByScan: { type: Boolean, default: false },
  notes: { type: String, default: '' },
}, { timestamps: true });

// Update status based on dates
borrowingSchema.pre('save', function (next) {
  if (this.status === 'borrowed' && this.dueDate < new Date()) {
    this.status = 'overdue';
  }
  if (this.returnDate) {
    this.status = 'returned';
    // Rule 4.3: Mark as returned late if past due date
    if (!this.isReturnedLate && this.returnDate > this.dueDate) {
      this.isReturnedLate = true;
    }
  }
  next();
});

// Auto-calculate due date if not set
borrowingSchema.pre('save', function (next) {
  if (!this.dueDate && this.isNew) {
    const duration = parseInt(process.env.BORROW_DURATION_DAYS || '14');
    const due = new Date(this.borrowDate);
    due.setDate(due.getDate() + duration);
    this.dueDate = due;
  }
  next();
});

borrowingSchema.set('toJSON', { virtuals: true });
borrowingSchema.set('toObject', { virtuals: true });

export default mongoose.model('Borrowing', borrowingSchema);
