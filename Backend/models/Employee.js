import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
  },
  department: {
    type: String,
    trim: true,
    default: '',
  },
  designation: {
    type: String,
    trim: true,
    default: '',
  },
  // Active/Inactive status (Rule 6 & 8)
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  borrowingHistory: [{
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    borrowDate: Date,
    dueDate: Date,
    returnDate: Date,
    status: { type: String, enum: ['borrowed', 'returned', 'overdue'] },
  }],
}, { timestamps: true });

// Generate barcode before saving if not provided (Rule 6a)
employeeSchema.pre('save', async function (next) {
  if (!this.barcode) {
    this.barcode = `EMP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  if (!this.employeeId) {
    this.employeeId = `UNMOGIP-${String(Date.now()).slice(-6)}`;
  }
  next();
});

// Virtual: is employee blocked from borrowing (Rule 8)
employeeSchema.virtual('canBorrow').get(function () {
  return this.isActive && this.status === 'Active';
});

employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

export default mongoose.model('Employee', employeeSchema);
