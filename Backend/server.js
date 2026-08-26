import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import employeeRoutes from './routes/employees.js';
import borrowingRoutes from './routes/borrowings.js';
import reportRoutes from './routes/reports.js';
import notificationRoutes from './routes/notifications.js';
import scheduleDueDateChecks from './utils/scheduler.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/members', employeeRoutes); // Alias for backward compatibility
app.use('/api/borrowings', borrowingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// GET /api/stats - Legacy stats endpoint (maps to reports/stats)
app.get('/api/stats', async (req, res) => {
  try {
    const Book = (await import('./models/Book.js')).default;
    const Employee = (await import('./models/Employee.js')).default;
    const Borrowing = (await import('./models/Borrowing.js')).default;

    const [totalBooks, totalMembers, activeBorrowings, overdueBooks] = await Promise.all([
      Book.countDocuments({ isActive: true }),
      Employee.countDocuments({ isActive: true }),
      Borrowing.countDocuments({ status: { $in: ['borrowed', 'overdue'] } }),
      Borrowing.countDocuments({
        status: { $in: ['borrowed', 'overdue'] },
        dueDate: { $lt: new Date() },
      }),
    ]);

    res.json({ totalBooks, totalMembers, totalEmployees: totalMembers, activeBorrowings, overdueBooks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/settings - Get system settings (Rule 3.3)
app.get('/api/settings', (req, res) => {
  res.json({
    borrowDurationDays: parseInt(process.env.BORROW_DURATION_DAYS || '14'),
    hrEmail: process.env.HR_EMAIL || '',
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start scheduled jobs
scheduleDueDateChecks();

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 UNMOGIP Library Management API ready`);
  console.log(`📋 Borrow duration: ${process.env.BORROW_DURATION_DAYS || 14} days`);
});
