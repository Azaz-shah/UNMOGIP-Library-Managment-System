import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlinePencil,
  HiOutlinePrinter,
  HiOutlineExclamationCircle,
  HiOutlineTag,
  HiOutlineBookOpen,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../api';

const statusStyles = {
  borrowed: { bg: '#dbeafe', text: '#2563eb', label: 'Issued' },
  overdue: { bg: '#fee2e2', text: '#dc2626', label: 'Overdue' },
  returned: { bg: '#dcfce7', text: '#15803d', label: 'Returned' },
};

export default function BookProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [borrowings, setBorrowings] = useState([]);
  const [barcodeImage, setBarcodeImage] = useState('');
  const [stats, setStats] = useState({ timesBorrowed: 0, avgDuration: 0, lastReturned: null, popularity: 'Low' });
  const [showMarkLostModal, setShowMarkLostModal] = useState(false);
  const [markingLost, setMarkingLost] = useState(false);

  useEffect(() => {
    loadBook();
  }, [id]);

  const loadBook = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/books/${id}`);
      setBook(data);

      // Load barcode
      try {
        const { data: bc } = await api.get(`/books/${id}/barcode`);
        setBarcodeImage(bc.barcode);
      } catch {}

      // Load borrowings for this book
      try {
        const { data: borrowData } = await api.get(`/borrowings?book=${id}`);
        const borrows = borrowData.borrowings || [];
        setBorrowings(borrows);

        // Calculate stats
        const total = borrows.length;
        const returned = borrows.filter(b => b.status === 'returned');
        const avgDays = returned.length > 0
          ? Math.round(returned.reduce((sum, b) => {
              const days = Math.ceil((new Date(b.returnDate) - new Date(b.borrowDate)) / (1000 * 60 * 60 * 24));
              return sum + days;
            }, 0) / returned.length)
          : 0;
        const lastRet = returned.length > 0
          ? returned.sort((a, b) => new Date(b.returnDate) - new Date(a.returnDate))[0]?.returnDate
          : null;
        const pop = total >= 10 ? 'High' : total >= 5 ? 'Medium' : 'Low';

        setStats({ timesBorrowed: total, avgDuration: avgDays, lastReturned: lastRet, popularity: pop });
      } catch {}
    } catch (err) {
      toast.error('Failed to load book details');
      navigate('/books');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkLost = async () => {
    setMarkingLost(true);
    try {
      await api.put(`/books/${id}`, { status: 'Lost' });
      toast.success('Book marked as Lost');
      setShowMarkLostModal(false);
      loadBook();
    } catch (err) {
      toast.error('Failed to update book status');
    } finally {
      setMarkingLost(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getPopularityColor = (p) => {
    if (p === 'High') return '#15803d';
    if (p === 'Medium') return '#d97706';
    return '#64748b';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="spinner" />
          <span>Loading book details...</span>
        </div>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="page-container">
      {/* Back link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          onClick={() => navigate('/books')}
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
          Back to Books
        </button>
      </div>

      {/* Main Card */}
      <div style={{
        background: '#fff', borderRadius: '12px',
        border: '1px solid #e2e8f0', overflow: 'hidden',
      }}>
        {/* Top section: Image + Info */}
        <div style={{
          display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem',
          padding: '2rem',
        }}>
          {/* Left: Book Cover + Barcode */}
          <div>
            {/* Book Cover */}
            <div style={{
              width: '100%', aspectRatio: '3/4', borderRadius: '10px',
              background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '1.5rem', color: '#fff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                background: '#d4a843',
              }} />
              <HiOutlineBookOpen style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.8 }} />
              <div style={{
                fontSize: '0.85rem', fontWeight: 700, textAlign: 'center',
                lineHeight: 1.3, marginBottom: '0.5rem',
              }}>
                {book.title}
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, textAlign: 'center' }}>
                {book.author}
              </div>
              <div style={{
                marginTop: 'auto', fontSize: '0.6rem', opacity: 0.5,
                fontFamily: 'monospace',
              }}>
                {book.isbn || ''}
              </div>
            </div>

            {/* Barcode Preview */}
            <div style={{
              marginTop: '1rem', background: '#f8fafc', borderRadius: '8px',
              border: '1px solid #e2e8f0', padding: '0.75rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '0.375rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                UNMOGIP PROPERTY
              </div>
              {barcodeImage ? (
                <img src={barcodeImage} alt="Barcode" style={{ maxWidth: '100%', height: 'auto', margin: '0 auto', display: 'block' }} />
              ) : (
                <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', letterSpacing: '1px' }}>
                    {book.barcode || 'N/A'}
                  </span>
                </div>
              )}
              <div style={{
                fontFamily: 'monospace', fontSize: '0.7rem', color: '#64748b',
                marginTop: '0.25rem',
              }}>
                REF: {book.isbn || '—'}
              </div>
              <div style={{
                fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700,
                color: '#0f172a', marginTop: '0.15rem',
              }}>
                {book.barcode || 'UNR-LIB-0000'}
              </div>
            </div>
          </div>

          {/* Right: Book Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {book.category && (
                  <span style={{
                    padding: '0.2rem 0.625rem', borderRadius: '9999px',
                    fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: '#dbeafe', color: '#2563eb',
                  }}>
                    {book.category}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <button
                  onClick={() => navigate(`/books?edit=${id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    padding: '0.4rem 0.75rem', borderRadius: '8px',
                    border: '1.5px solid #e2e8f0', background: '#fff',
                    color: '#475569', fontSize: '0.78rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <HiOutlinePencil style={{ fontSize: '0.85rem' }} />
                  Edit
                </button>
                <button
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    padding: '0.4rem 0.75rem', borderRadius: '8px',
                    border: '1.5px solid #e2e8f0', background: '#fff',
                    color: '#475569', fontSize: '0.78rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <HiOutlinePrinter style={{ fontSize: '0.85rem' }} />
                  Print Label
                </button>
                {book.status !== 'Lost' && (
                  <button
                    onClick={() => setShowMarkLostModal(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.4rem 0.75rem', borderRadius: '8px',
                      border: '1.5px solid #fecaca', background: '#fef2f2',
                      color: '#dc2626', fontSize: '0.78rem', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <HiOutlineExclamationCircle style={{ fontSize: '0.85rem' }} />
                    Mark as Lost
                  </button>
                )}
              </div>
            </div>

            <h1 style={{
              margin: '0.5rem 0 0.25rem', fontSize: '1.5rem', fontWeight: 700,
              color: '#0f172a', lineHeight: 1.2,
            }}>
              {book.title}
            </h1>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', color: '#64748b' }}>
              {book.author}
            </p>

            {/* Meta info grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem',
              marginBottom: '1.25rem',
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                  ISBN
                </div>
                <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 500 }}>
                  {book.isbn || '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                  PUBLISHER
                </div>
                <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 500 }}>
                  {book.publisher || '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                  PUBLICATION YEAR
                </div>
                <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 500 }}>
                  {book.year || '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                  EDITION
                </div>
                <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 500 }}>
                  {book.edition || '—'}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem',
              padding: '1rem', background: '#f8fafc', borderRadius: '10px',
              border: '1px solid #f1f5f9',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, marginBottom: '0.25rem' }}>
                  TIMES BORROWED
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {stats.timesBorrowed}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, marginBottom: '0.25rem' }}>
                  AVG. DURATION
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {stats.avgDuration > 0 ? `${stats.avgDuration} days` : '—'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, marginBottom: '0.25rem' }}>
                  LAST RETURNED
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  {stats.lastReturned ? formatDate(stats.lastReturned) : '—'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, marginBottom: '0.25rem' }}>
                  POPULARITY
                </div>
                <div style={{
                  fontSize: '0.85rem', fontWeight: 700,
                  color: getPopularityColor(stats.popularity),
                }}>
                  {stats.popularity}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '0', borderTop: '1px solid #f1f5f9',
          padding: '0 2rem',
        }}>
          {['overview', 'transaction-history'].map((tab) => {
            const isActive = activeTab === tab;
            const label = tab === 'overview' ? 'Overview' : 'Transaction History';
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.75rem 1.25rem', border: 'none',
                  borderBottom: isActive ? '2.5px solid #0f172a' : '2.5px solid transparent',
                  background: 'transparent', cursor: 'pointer',
                  fontSize: '0.82rem', fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#0f172a' : '#94a3b8',
                  transition: 'all 0.15s', marginBottom: '-1px',
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                }}
              >
                {tab === 'overview' ? <HiOutlineDocumentText style={{ fontSize: '0.9rem' }} /> : <HiOutlineClock style={{ fontSize: '0.9rem' }} />}
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '1.5rem 2rem' }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Current Holder */}
              <div>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HiOutlineUser style={{ fontSize: '1rem', color: '#64748b' }} />
                  Current Holder
                </h3>
                {borrowings.filter(b => b.status === 'borrowed' || b.status === 'overdue').length > 0 ? (
                  borrowings.filter(b => b.status === 'borrowed' || b.status === 'overdue').slice(0, 1).map((b) => {
                    const isOverdue = b.status === 'overdue' || new Date(b.dueDate) < new Date();
                    return (
                      <div key={b._id} style={{
                        padding: '1rem', borderRadius: '10px',
                        border: `1px solid ${isOverdue ? '#fecaca' : '#e2e8f0'}`,
                        background: isOverdue ? '#fef2f2' : '#f8fafc',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: '#0f172a', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.85rem', fontWeight: 700,
                          }}>
                            {b.employee?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>
                              {b.employee?.name || 'Unknown'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              ID: {b.employee?.employeeId || '—'}
                            </div>
                          </div>
                          <span style={{
                            marginLeft: 'auto', padding: '0.2rem 0.5rem',
                            borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700,
                            background: isOverdue ? '#fee2e2' : '#dbeafe',
                            color: isOverdue ? '#dc2626' : '#2563eb',
                          }}>
                            {isOverdue ? 'OVERDUE' : 'ISSUED'}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Issue Date: </span>
                            <span style={{ color: '#475569', fontWeight: 500 }}>{formatDate(b.borrowDate)}</span>
                          </div>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Due Date: </span>
                            <span style={{ color: isOverdue ? '#dc2626' : '#475569', fontWeight: 500 }}>{formatDate(b.dueDate)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{
                    padding: '1.5rem', textAlign: 'center', color: '#94a3b8',
                    background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9',
                  }}>
                    <HiOutlineCheckCircle style={{ fontSize: '1.5rem', color: '#15803d', marginBottom: '0.5rem' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>All copies are available</p>
                  </div>
                )}
              </div>

              {/* Synopsis */}
              <div>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HiOutlineDocumentText style={{ fontSize: '1rem', color: '#64748b' }} />
                  Synopsis
                </h3>
                <div style={{
                  padding: '1rem', background: '#f8fafc', borderRadius: '10px',
                  border: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569',
                  lineHeight: 1.6,
                }}>
                  {book.description || book.synopsis || (
                    <>
                      <p style={{ margin: '0 0 0.75rem' }}>
                        <strong>{book.title}</strong> by <strong>{book.author}</strong> is a{' '}
                        {book.category?.toLowerCase() || 'reference'} book available in the UNMOGIP library.
                      </p>
                      <p style={{ margin: 0 }}>
                        This book is classified under <strong>{book.category || 'General'}</strong> and has{' '}
                        <strong>{book.copies}</strong> total copies with{' '}
                        <strong style={{ color: book.available > 0 ? '#15803d' : '#dc2626' }}>
                          {book.available} available
                        </strong>{' '}
                        for borrowing.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transaction-history' && (
            <div>
              {borrowings.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  <HiOutlineClock style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0 }}>No transaction history yet</p>
                </div>
              ) : (
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>EMPLOYEE</th>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: '#0f172a', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.65rem', fontWeight: 700,
                              }}>
                                {b.employee?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                                  {b.employee?.name || '—'}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                  {b.employee?.employeeId || ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                            {formatDate(b.borrowDate)}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                            {formatDate(b.dueDate)}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: b.returnDate ? '#475569' : '#cbd5e1' }}>
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
          )}
        </div>
      </div>

      {/* Mark as Lost Modal */}
      {showMarkLostModal && (
        <div className="modal-overlay" onClick={() => setShowMarkLostModal(false)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '2rem 2rem 1.5rem', textAlign: 'center' }}>
              {/* Icon */}
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: '#fef2f2', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}>
                <HiOutlineExclamationCircle style={{ fontSize: '1.75rem', color: '#dc2626' }} />
              </div>

              {/* Title */}
              <h3 style={{
                margin: '0 0 0.5rem', fontSize: '1.15rem',
                fontWeight: 700, color: '#0f172a',
              }}>
                Mark Book as Lost
              </h3>

              {/* Description */}
              <p style={{
                margin: '0 0 1.5rem', fontSize: '0.85rem',
                color: '#64748b', lineHeight: 1.6,
                maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto',
              }}>
                Enter the reason for marking this book as lost. It will be removed from the available pool permanently.
              </p>

              {/* Book info */}
              <div style={{
                background: '#f8fafc', borderRadius: '10px',
                border: '1px solid #e2e8f0', padding: '1rem',
                marginBottom: '1.5rem', textAlign: 'left',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #1e3a5f, #0f172a)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <HiOutlineBookOpen style={{ fontSize: '1rem', color: '#fff' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>
                      {book?.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      by {book?.author}
                    </div>
                  </div>
                </div>
                {book?.barcode && (
                  <div style={{
                    marginTop: '0.75rem', paddingTop: '0.75rem',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Barcode:</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                      {book.barcode}
                    </span>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div style={{
                background: '#fffbeb', borderRadius: '8px',
                border: '1px solid #fef3c7', padding: '0.75rem 1rem',
                marginBottom: '1.5rem', display: 'flex',
                alignItems: 'center', gap: '0.5rem',
              }}>
                <HiOutlineExclamationCircle style={{ fontSize: '1rem', color: '#d97706', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: '#92400e' }}>
                  This action cannot be undone. The book will be permanently marked as lost.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: '0.5rem',
              padding: '1rem 2rem 1.5rem',
            }}>
              <button
                onClick={() => setShowMarkLostModal(false)}
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: '8px',
                  border: '1.5px solid #e2e8f0', background: '#fff',
                  color: '#475569', fontSize: '0.85rem', fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleMarkLost}
                disabled={markingLost}
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: '8px',
                  border: 'none', background: '#dc2626',
                  color: '#fff', fontSize: '0.85rem', fontWeight: 600,
                  cursor: markingLost ? 'not-allowed' : 'pointer', transition: 'all 0.15s ease',
                  boxShadow: '0 2px 6px rgba(220,38,38,0.25)',
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  opacity: markingLost ? 0.7 : 1,
                }}
              >
                {markingLost ? (<><svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" strokeDasharray="32" strokeLinecap="round" /></svg> Marking...</>) : (<><HiOutlineExclamationCircle style={{ fontSize: '0.9rem' }} /> Confirm Mark as Lost</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
