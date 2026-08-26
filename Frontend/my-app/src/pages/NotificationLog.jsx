import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import {
  HiOutlineBell,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlineSearch,
  HiChevronLeft,
  HiChevronRight,
} from 'react-icons/hi';

const typeLabels = {
  BorrowConfirmation: 'Issue Confirmation',
  DueReminder: 'Due Reminder',
  OverdueAlert: 'Overdue Warning',
  ReturnConfirmation: 'Return Receipt',
};

const typeColors = {
  BorrowConfirmation: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  DueReminder: { bg: '#fefce8', text: '#ca8a04', border: '#fef08a' },
  OverdueAlert: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  ReturnConfirmation: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
};

const statusStyles = {
  Sent: { bg: '#dcfce7', text: '#15803d', label: 'SENT' },
  Failed: { bg: '#fee2e2', text: '#dc2626', label: 'FAILED' },
  Queued: { bg: '#e0f2fe', text: '#0284c7', label: 'QUEUED' },
  Retrying: { bg: '#fef3c7', text: '#d97706', label: 'RETRYING' },
};

export default function NotificationLog() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', page);
      params.append('limit', 15);

      const { data } = await api.get(`/notifications?${params.toString()}`);
      setNotifications(data.notifications || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      toast.error('Failed to load notification logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [typeFilter, statusFilter, page]);

  const handleRetry = async (id) => {
    try {
      await api.post(`/notifications/${id}/retry`);
      toast.success('Notification queued for retry');
      fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Retry failed');
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day}  ${h}:${min}`;
  };

  const startIdx = (page - 1) * 15 + 1;
  const endIdx = Math.min(page * 15, total);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <HiOutlineBell style={{ fontSize: '1.5rem', color: '#64748b' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Notification Log
          </h1>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
          Audit trail of all automated system communications.
        </p>
      </div>

      {/* Filters */}
      <div className="toolbar" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            style={{
              padding: '0.5rem 2rem 0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.875rem',
              color: '#334155',
              background: '#fff',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">All Types</option>
            <option value="BorrowConfirmation">Issue Confirmation</option>
            <option value="DueReminder">Due Reminder</option>
            <option value="OverdueAlert">Overdue Warning</option>
            <option value="ReturnConfirmation">Return Receipt</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              padding: '0.5rem 2rem 0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.875rem',
              color: '#334155',
              background: '#fff',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">All Statuses</option>
            <option value="Sent">Sent</option>
            <option value="Failed">Failed</option>
            <option value="Queued">Queued</option>
            <option value="Retrying">Retrying</option>
          </select>

          <button
            onClick={fetchNotifications}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#64748b',
            }}
          >
            <HiOutlineRefresh style={{ fontSize: '1rem' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-count">
            Showing <strong>{startIdx}</strong> to <strong>{endIdx}</strong> of <strong>{total}</strong> results
          </span>
        </div>
        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <span>Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <HiOutlineBell style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '0.75rem' }} />
            <h3 style={{ margin: 0, color: '#475569' }}>No notifications yet</h3>
            <p style={{ color: '#94a3b8', margin: '0.5rem 0 0' }}>
              Notifications will appear here when books are issued or returned.
            </p>
          </div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}><input type="checkbox" checked={notifications.length > 0 && notifications.every(n => selectedIds.has(n._id))} ref={el => { if (el) el.indeterminate = notifications.some(n => selectedIds.has(n._id)) && !notifications.every(n => selectedIds.has(n._id)); }} onChange={() => { const allIds = notifications.map(n => n._id); setSelectedIds(prev => allIds.every(id => prev.has(id)) ? new Set() : new Set(allIds)); }} style={{ cursor: 'pointer' }} /></th>
                  <th>DATE/TIME</th>
                  <th>TYPE</th>
                  <th>RELATED BOOK</th>
                  <th>RELATED EMPLOYEE</th>
                  <th>RECIPIENTS</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => {
                  const typeStyle = typeColors[n.type] || { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
                  const statusStyle = statusStyles[n.status] || { bg: '#f1f5f9', text: '#475569', label: n.status };

                  return (
                    <tr key={n._id} style={{ background: selectedIds.has(n._id) ? '#f0f7ff' : undefined }}>
                      <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(n._id)} onChange={() => { setSelectedIds(prev => { const s = new Set(prev); s.has(n._id) ? s.delete(n._id) : s.add(n._id); return s; }); }} style={{ cursor: 'pointer' }} /></td>
                      <td style={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>
                        {formatDate(n.date)}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.625rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: typeStyle.bg,
                            color: typeStyle.text,
                            border: `1px solid ${typeStyle.border}`,
                          }}
                        >
                          {typeLabels[n.type] || n.type}
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px' }}>
                        <div style={{ fontWeight: 500, color: '#0f172a', fontSize: '0.875rem' }}>
                          {n.bookTitle || '—'}
                        </div>
                      </td>
                      <td style={{ color: '#475569', fontSize: '0.875rem' }}>
                        {n.employeeName || '—'}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '180px', wordBreak: 'break-all' }}>
                          {n.recipients?.join(', ') || '—'}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.625rem',
                            borderRadius: '9999px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            background: statusStyle.bg,
                            color: statusStyle.text,
                          }}
                        >
                          {statusStyle.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                          {n.status === 'Failed' && (
                            <button
                              onClick={() => handleRetry(n._id)}
                              title="Retry"
                              style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '6px',
                                padding: '0.375rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#2563eb',
                              }}
                            >
                              <HiOutlineRefresh style={{ fontSize: '0.875rem' }} />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedNotification(n)}
                            title="View details"
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              padding: '0.375rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              color: '#64748b',
                            }}
                          >
                            <HiOutlineEye style={{ fontSize: '0.875rem' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              padding: '0.75rem 1.5rem',
              borderTop: '1px solid #f1f5f9',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Page numbers */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  const isActive = pageNum === page;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        border: isActive ? '1.5px solid #0f172a' : '1.5px solid transparent',
                        background: isActive ? '#0f172a' : 'transparent',
                        color: isActive ? '#fff' : '#64748b',
                        fontSize: '0.8rem',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Separator */}
                {totalPages > 5 && <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>…</span>}

                {/* Prev button */}
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    border: '1.5px solid #e2e8f0',
                    background: page <= 1 ? '#f8fafc' : '#fff',
                    color: page <= 1 ? '#cbd5e1' : '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: page <= 1 ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                  onMouseEnter={(e) => { if (page > 1) { e.currentTarget.style.borderColor = '#0f172a'; e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(15,23,42,0.08)'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = page <= 1 ? '#cbd5e1' : '#475569'; e.currentTarget.style.boxShadow = page <= 1 ? 'none' : '0 1px 2px rgba(0,0,0,0.04)'; }}
                >
                  <HiChevronLeft style={{ fontSize: '1rem' }} />
                  Prev
                </button>

                {/* Next button */}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    border: '1.5px solid #0f172a',
                    background: page >= totalPages ? '#f8fafc' : '#0f172a',
                    color: page >= totalPages ? '#94a3b8' : '#fff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: page >= totalPages ? 'none' : '0 2px 6px rgba(15,23,42,0.2)',
                  }}
                  onMouseEnter={(e) => { if (page < totalPages) { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = page >= totalPages ? '#f8fafc' : '#0f172a'; e.currentTarget.style.boxShadow = page >= totalPages ? 'none' : '0 2px 6px rgba(15,23,42,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  Next
                  <HiChevronRight style={{ fontSize: '1rem' }} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedNotification && (
        <div className="modal-overlay" onClick={() => setSelectedNotification(null)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Notification Details</h3>
              <button className="modal-close" onClick={() => setSelectedNotification(null)}>×</button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Type</span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                  {typeLabels[selectedNotification.type] || selectedNotification.type}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Status</span>
                <span
                  style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: statusStyles[selectedNotification.status]?.bg || '#f1f5f9',
                    color: statusStyles[selectedNotification.status]?.text || '#475569',
                  }}
                >
                  {statusStyles[selectedNotification.status]?.label || selectedNotification.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Book</span>
                <span style={{ fontWeight: 500, fontSize: '0.85rem', color: '#0f172a' }}>
                  {selectedNotification.bookTitle || '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Employee</span>
                <span style={{ fontWeight: 500, fontSize: '0.85rem', color: '#0f172a' }}>
                  {selectedNotification.employeeName || '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Date/Time</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>
                  {formatDate(selectedNotification.date)}
                </span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.85rem', display: 'block', marginBottom: '0.375rem' }}>Recipients</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {selectedNotification.recipients?.map((r, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: '#f1f5f9',
                        fontSize: '0.8rem',
                        color: '#475569',
                      }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
              {selectedNotification.error && (
                <div style={{ marginTop: '0.25rem' }}>
                  <span style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Error</span>
                  <div style={{
                    padding: '0.5rem',
                    borderRadius: '6px',
                    background: '#fef2f2',
                    fontSize: '0.8rem',
                    color: '#dc2626',
                    wordBreak: 'break-word',
                  }}>
                    {selectedNotification.error}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
