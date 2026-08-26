import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import BookProfile from './pages/BookProfile';
import Members from './pages/Members';
import EmployeeProfile from './pages/EmployeeProfile';
import Borrowings from './pages/Borrowings';
import NotificationLog from './pages/NotificationLog';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;    return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}

// Public route wrapper (redirect to dashboard if logged in)
function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  if (token) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/books" element={<ProtectedRoute><Books /></ProtectedRoute>} />
        <Route path="/books/:id" element={<ProtectedRoute><BookProfile /></ProtectedRoute>} />
        <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
        <Route path="/employees/:id" element={<ProtectedRoute><EmployeeProfile /></ProtectedRoute>} />
        <Route path="/borrowings" element={<ProtectedRoute><Borrowings /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationLog /></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
