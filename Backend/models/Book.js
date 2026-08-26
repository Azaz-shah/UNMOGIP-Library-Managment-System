import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
  },
  isbn: {
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
  // Per-barcode counter for sequential generation
  barcodeSequence: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    trim: true,
    default: '',
  },
  publisher: {
    type: String,
    trim: true,
    default: '',
  },
  year: {
    type: Number,
    default: null,
  },
  copies: {
    type: Number,
    default: 1,
    min: 0,
  },
  available: {
    type: Number,
    default: 1,
    min: 0,
  },
  // Book-level status: Available / Issued / Lost (Rule 2.3)
  status: {
    type: String,
    enum: ['Available', 'Issued', 'Lost'],
    default: 'Available',
  },
  description: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    default: '',
    trim: true,
  },
  coverImage: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Generate barcode format: LIB-{YEAR}-{sequential 6-digit} (Rule 2.1)
bookSchema.pre('save', async function (next) {
  if (!this.barcode) {
    const year = new Date().getFullYear();
    // Get the next sequence number for this year
    const lastBook = await this.constructor.findOne(
      { barcode: { $regex: `^LIB-${year}-` } },
      { barcodeSequence: 1 },
      { sort: { barcodeSequence: -1 } }
    );
    const seq = (lastBook?.barcodeSequence || 0) + 1;
    this.barcodeSequence = seq;
    this.barcode = `LIB-${year}-${String(seq).padStart(6, '0')}`;
  }
  // On new book creation, set available = copies
  if (this.isNew) {
    this.available = this.copies;
  }
  // Ensure available doesn't exceed copies
  if (this.available > this.copies) {
    this.available = this.copies;
  }
  // Auto-update status based on availability (Rule 2.3)
  if (this.status !== 'Lost') {
    if (this.available === 0) {
      this.status = 'Issued';
    } else {
      this.status = 'Available';
    }
  }
  next();
});

// Virtual for stock status
bookSchema.virtual('stockStatus').get(function () {
  if (this.status === 'Lost') return 'lost';
  if (this.available === 0) return 'out_of_stock';
  if (this.available < this.copies) return 'low_stock';
  return 'in_stock';
});

bookSchema.set('toJSON', { virtuals: true });
bookSchema.set('toObject', { virtuals: true });

export default mongoose.model('Book', bookSchema);
