import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiOutlinePencil,
  HiOutlineUserRemove,
  HiOutlineArrowLeft,
  HiOutlineBriefcase,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineFilter,
  HiOutlineX,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../api';

const statusStyles = {
  borrowed: { bg: '#dbeafe', text: '#2563eb', label: 'Issued' },
  overdue: { bg: '#fee2e2', text: '#dc2626', label: 'Overdue' },
  returned: { bg: '#dcfce7', text: '#15803d', label: 'Returned' },
};

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [borrowings, setBorrowings] = useState([]);
  const [totalBorrowed, setTotalBorrowed] = useState(0);
  const [currentlyIssued, setCurrentlyIssued] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/employees/${id}`);
      setEmployee(data);

      // Calculate stats from borrowing history
      const history = data.borrowingHistory || [];
      setTotalBorrowed(history.length);
      setCurrentlyIssued(history.filter(h => h.status === 'borrowed').length);
      setOverdueCount(history.filter(h => h.status === 'overdue' || (h.status === 'borrowed' && new Date(h.dueDate) < new Date())).length);

      // Fetch full borrowing records
      try {
        const { data: borrowData } = await api.get(`/borrowings?employee=${id}`);
        setBorrowings(borrowData.borrowings || []);
      } catch {
        setBorrowings([]);
      }
    } catch (err) {
      toast.error('Failed to load employee profile');
      navigate('/members');
    } finally {
      setLoading(false);
    }
  };

  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleMarkInactive = async () => {
    setSubmitting(true);
    try {
      await api.put(`/employees/${id}`, { status: 'Inactive', isActive: false });
      toast.success('Employee marked as Inactive');
      setShowInactiveModal(false);
      loadEmployee();
    } catch (err) {
      toast.error('Failed to update employee status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkActive = async () => {
    setSubmitting(true);
    try {
      await api.put(`/employees/${id}`, { status: 'Active', isActive: true });
      toast.success('Employee reactivated');
      loadEmployee();
    } catch (err) {
      toast.error('Failed to update employee status');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="spinner" />
          <span>Loading employee profile...</span>
        </div>
      </div>
    );
  }

  if (!employee) return null;

  const isActive = employee.isActive && employee.status !== 'Inactive';

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <button
            onClick={() => navigate('/members')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              color: '#64748b', fontSize: '0.85rem', fontWeight: 500,
              padding: '0.25rem 0.5rem', borderRadius: '6px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'none'; }}
          >
            <HiOutlineArrowLeft style={{ fontSize: '1rem' }} />
            Employees
          </button>
          <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>/</span>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Employee Details</span>
        </div>
      </div>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1.5rem',
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Employee Profile
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => navigate(`/members?edit=${id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.5rem 1rem', borderRadius: '8px',
              border: '1.5px solid #e2e8f0', background: '#fff',
              color: '#475569', fontSize: '0.82rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <HiOutlinePencil style={{ fontSize: '0.9rem' }} />
            Edit
          </button>
          {isActive ? (
            <button
              onClick={() => setShowInactiveModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 1rem', borderRadius: '8px',
                border: '1.5px solid #dc2626', background: '#fff',
                color: '#dc2626', fontSize: '0.82rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
            >
              <HiOutlineUserRemove style={{ fontSize: '0.9rem' }} />
              Mark Inactive
            </button>
          ) : (
            <button
              onClick={handleMarkActive}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 1rem', borderRadius: '8px',
                border: '1.5px solid #15803d', background: '#15803d',
                color: '#fff', fontSize: '0.82rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {submitting ? (<><svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" strokeDasharray="32" strokeLinecap="round" /></svg> Reactivating...</>) : (<><HiOutlineCheckCircle style={{ fontSize: '0.9rem' }} /> Reactivate</>)}
            </button>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div style={{
        background: '#fff', borderRadius: '12px',
        border: '1px solid #e2e8f0', padding: '1.5rem',
        marginBottom: '1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
          {/* Avatar */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #0f172a, #334155)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          }}>
            <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>
              {getInitials(employee.name)}
            </span>
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                {employee.name}
              </h2>
              <span style={{
                padding: '0.2rem 0.625rem', borderRadius: '9999px',
                fontSize: '0.7rem', fontWeight: 700,
                background: isActive ? '#dcfce7' : '#f1f5f9',
                color: isActive ? '#15803d' : '#94a3b8',
              }}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', color: '#64748b' }}>
              ID: {employee.employeeId || '—'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 2rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  DEPARTMENT
                </span>
                <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 500 }}>
                  {employee.department || '—'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  EMAIL
                </span>
                <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 500 }}>
                  {employee.email}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  PHONE
                </span>
                <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 500 }}>
                  {employee.phone || '—'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  JOIN DATE
                </span>
                <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 500 }}>
                  {formatDate(employee.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{
          background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
          padding: '1.25rem', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <HiOutlineBriefcase style={{ fontSize: '1rem', color: '#64748b' }} />
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>Total Borrowed</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
            {totalBorrowed}
          </div>
        </div>

        <div style={{
          background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
          padding: '1.25rem', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: '3px', background: '#2563eb',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <HiOutlineCheckCircle style={{ fontSize: '1rem', color: '#2563eb' }} />
            <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 500 }}>Currently Issued</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2563eb' }}>
            {currentlyIssued}
          </div>
        </div>

        <div style={{
          background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
          padding: '1.25rem', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: '3px', background: '#dc2626',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <HiOutlineExclamationCircle style={{ fontSize: '1rem', color: '#dc2626' }} />
            <span style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 500 }}>Overdue</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#dc2626' }}>
            {overdueCount}
          </div>
        </div>
      </div>

      {/* Borrowing History */}
      <div style={{
        background: '#fff', borderRadius: '12px',
        border: '1px solid #e2e8f0', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9',
        }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
            Borrowing History
          </h3>
          <button style={{
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: '6px', padding: '0.375rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', color: '#64748b',
          }}>
            <HiOutlineFilter style={{ fontSize: '0.9rem' }} />
          </button>
        </div>

        {borrowings.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <HiOutlineBriefcase style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: '#cbd5e1' }} />
            <p style={{ margin: 0 }}>No borrowing history yet</p>
          </div>
        ) : (
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>BOOK TITLE</th>
                <th>BARCODE</th>
                <th>ISSUE DATE</th>
                <th>DUE DATE</th>
                <th>RETURN DATE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {borrowings.map((b) => {
                const status = b.status === 'returned' ? 'returned'
                  : (b.status === 'overdue' || new Date(b.dueDate) < new Date()) ? 'overdue'
                  : 'borrowed';
                const sc = statusStyles[status] || statusStyles.borrowed;

                return (
                  <tr key={b._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                        {b.book?.title || '—'}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'monospace', fontSize: '0.78rem',
                        color: '#64748b', background: '#f8fafc',
                        padding: '0.2rem 0.5rem', borderRadius: '4px',
                      }}>
                        {b.book?.barcode || '—'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                      {formatDate(b.borrowDate)}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                      {formatDate(b.dueDate)}
                    </td>
                    <td style={{
                      fontSize: '0.82rem',
                      color: b.returnDate ? (b.isReturnedLate ? '#dc2626' : '#475569') : '#cbd5e1',
                    }}>
                      {b.returnDate ? formatDate(b.returnDate) : '—'}
                    </td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.625rem', borderRadius: '9999px',
                        fontSize: '0.7rem', fontWeight: 700,
                        background: sc.bg, color: sc.text,
                      }}>
                        {sc.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Custom Mark Inactive Modal */}
      {showInactiveModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowInactiveModal(false)}>
          <div
            style={{
              background: '#fff', borderRadius: '16px', width: '420px', maxWidth: '90vw',
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)', textAlign: 'center', padding: '2rem 2rem 1.5rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowInactiveModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
            >
              <HiOutlineX style={{ fontSize: '1.1rem' }} />
            </button>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <HiOutlineExclamationCircle style={{ fontSize: '2rem', color: '#dc2626' }} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              Mark as Inactive
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
              Are you sure you want to mark <strong style={{ color: '#0f172a' }}>{employee?.name}</strong> as inactive?
              They will not be able to borrow new books.
            </p>

            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
              padding: '0.75rem 1rem', marginBottom: '1.25rem', textAlign: 'left',
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>{employee?.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                {employee?.employeeId || '—'} • {employee?.email}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowInactiveModal(false)}
                style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleMarkInactive}
                disabled={submitting}
                style={{
                  padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none',
                  background: '#dc2626', color: '#fff', fontSize: '0.88rem', fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(220,38,38,0.3)',
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? (<><svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" strokeDasharray="32" strokeLinecap="round" /></svg> Updating...</>) : (<><HiOutlineUserRemove style={{ fontSize: '0.95rem' }} /> Mark Inactive</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
