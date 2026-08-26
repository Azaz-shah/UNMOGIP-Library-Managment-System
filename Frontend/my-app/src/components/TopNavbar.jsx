import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineBell } from 'react-icons/hi';

const pageNames = {
  '/': 'Dashboard',
  '/books': 'Books',
  '/members': 'Employees',
  '/borrowings': 'Issue/Return',
  '/reports': 'Reports',
  '/notifications': 'Notification Log',
};

export default function TopNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // Determine page name from path
  const getPageName = () => {
    const path = location.pathname;
    if (path.startsWith('/books/')) return 'Book Details';
    if (path.startsWith('/employees/')) return 'Employee Details';
    return pageNames[path] || 'Library Management System';
  };

  const getInitials = (name) => {
    if (!name) return 'AD';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: '#fff',
      borderBottom: '1px solid #e2e8f0',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.875rem 2rem',
      }}>
        {/* Left: Page Name */}
        <h1 style={{
          margin: 0,
          fontSize: '1.15rem',
          fontWeight: 700,
          color: '#0f172a',
          letterSpacing: '-0.2px',
        }}>
          Library Management System
        </h1>

        {/* Right: Search + Bell + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.875rem',
            borderRadius: '10px',
            border: `1px solid ${searchFocused ? '#cbd5e1' : '#e2e8f0'}`,
            background: '#fff',
            width: searchFocused ? '240px' : '200px',
            transition: 'all 0.2s ease',
          }}>
            <HiOutlineSearch style={{ fontSize: '1rem', color: '#94a3b8', flexShrink: 0 }} />
            <input
              placeholder="Search..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.85rem',
                color: '#0f172a',
                width: '100%',
                padding: 0,
              }}
            />
          </div>

          {/* Bell icon */}
          <button
            onClick={() => navigate('/notifications')}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              border: '1px solid #e2e8f0',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              position: 'relative',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; }}
          >
            <HiOutlineBell style={{ fontSize: '1.1rem' }} />
          </button>

          {/* Profile avatar */}
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
            transition: 'all 0.15s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.4)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.3)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {getInitials(user?.name)}
          </div>
        </div>
      </div>
    </div>
  );
}
