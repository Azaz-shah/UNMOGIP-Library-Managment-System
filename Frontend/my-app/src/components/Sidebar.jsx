import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  HiOutlineCollection,
  HiOutlineBookOpen,
  HiOutlineUserGroup,
  HiOutlineRefresh,
  HiOutlineBell,
  HiOutlineDocumentReport,
  HiOutlineLogout,
  HiOutlineExclamationCircle,
  HiOutlineX,
} from 'react-icons/hi';

const navItems = [
  { to: '/', label: 'Dashboard', icon: HiOutlineCollection, end: true },
  { to: '/books', label: 'Books', icon: HiOutlineBookOpen },
  { to: '/members', label: 'Employees', icon: HiOutlineUserGroup },
  { to: '/borrowings', label: 'Borrowings', icon: HiOutlineRefresh },
  { to: '/reports', label: 'Reports', icon: HiOutlineDocumentReport },
  { to: '/notifications', label: 'Notification Log', icon: HiOutlineBell },
];

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'AD';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <img src="/unmogip-seal.svg" alt="UNMOGIP" />
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">UNMOGIP</span>
            <span className="sidebar-logo-subtitle">Library Management</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            <span className="nav-link-icon">
              <item.icon />
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-section-label" style={{ marginTop: '0.75rem' }}>Account</div>
        <button
          className="nav-link"
          onClick={() => setShowLogoutModal(true)}
          style={{ cursor: 'pointer', border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
        >
          <span className="nav-link-icon">
            <HiOutlineLogout />
          </span>
          <span>Logout</span>
        </button>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLogoutModal(false)}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '400px', maxWidth: '90vw', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', textAlign: 'center', padding: '2rem 2rem 1.5rem', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowLogoutModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><HiOutlineX style={{ fontSize: '1.1rem' }} /></button>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <HiOutlineExclamationCircle style={{ fontSize: '2rem', color: '#dc2626' }} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Logout</h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>Are you sure you want to logout? You will need to sign in again.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setShowLogoutModal(false)} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleLogout} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(220,38,38,0.3)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <HiOutlineLogout style={{ fontSize: '0.95rem' }} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{getInitials(user?.name)}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name || 'Admin'}</span>
            <span className="sidebar-user-role">{user?.role || 'Administrator'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
