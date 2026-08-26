import { useEffect, useState } from 'react';
import {
  HiOutlinePlus,
  HiOutlineArrowLeft,
  HiOutlineX,
  HiOutlineCamera,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../api';

export default function Borrowings() {
  const [borrowings, setBorrowings] = useState([]);
  const [totalBorrowings, setTotalBorrowings] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({ bookId: '', employeeId: '' });
  const [showForm, setShowForm] = useState(false);
  const [showScanForm, setShowScanForm] = useState(false);
  const [scanForm, setScanForm] = useState({ bookBarcode: '', employeeBarcode: '' });
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [returningId, setReturningId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/borrowings'),
      api.get('/books?limit=200'),
      api.get('/employees?limit=200'),
    ])
      .then(([b, bk, emp]) => {
        setBorrowings(b.data.borrowings || b.data);
        setTotalBorrowings(b.data.total || (b.data.borrowings || b.data).length);
        setBooks((bk.data.books || bk.data));
        setEmployees(emp.data.employees || emp.data);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // Manual issue
  const handleBorrow = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/borrowings', form);
      toast.success('Book issued successfully');
      setForm({ bookId: '', employeeId: '' });
      setShowForm(false);
      load();
    } catch (err) {
      const msg = err.response?.data?.error || 'Error issuing book';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Barcode scan issue
  const handleScanIssue = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/borrowings/scan-issue', scanForm);
      toast.success('Book issued via barcode scan!');
      setScanForm({ bookBarcode: '', employeeBarcode: '' });
      setShowScanForm(false);
      load();
    } catch (err) {
      const msg = err.response?.data?.error || 'Scan issue failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Barcode scan return
  const handleScanReturn = async () => {
    setSubmitting(true);
    try {
      await api.post('/borrowings/scan-return', scanForm);
      toast.success('Book returned via barcode scan!');
      setScanForm({ bookBarcode: '', employeeBarcode: '' });
      load();
    } catch (err) {
      const msg = err.response?.data?.error || 'Scan return failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Manual return
  const handleReturn = async (id) => {
    setReturningId(id);
    try {
      await api.put(`/borrowings/${id}/return`);
      toast.success('Book returned successfully');
      load();
    } catch {
      toast.error('Failed to return book');
    } finally {
      setReturningId(null);
    }
  };

  const isOverdue = (b) => {
    return (b.status === 'borrowed' || b.status === 'overdue') && new Date(b.dueDate) < new Date();
  };

  const filtered = borrowings.filter((b) => {
    if (filter === 'borrowed') return b.status === 'borrowed' || (b.status === 'overdue');
    if (filter === 'returned') return b.status === 'returned';
    if (filter === 'overdue') return isOverdue(b);
    return true;
  });

  const filterCounts = {
    all: borrowings.length,
    borrowed: borrowings.filter((b) => b.status !== 'returned').length,
    returned: borrowings.filter((b) => b.status === 'returned').length,
    overdue: borrowings.filter(isOverdue).length,
  };

  const closeModal = () => {
    setShowForm(false);
    setShowScanForm(false);
    setError('');
    setForm({ bookId: '', employeeId: '' });
    setScanForm({ bookBarcode: '', employeeBarcode: '' });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">Borrowings</h2>
          <p className="page-subtitle">Track and manage book issues and returns</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => { setShowScanForm(true); setError(''); }}>
            <HiOutlineCamera /> Scan Barcode
          </button>
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setError(''); }}>
            <HiOutlinePlus /> Issue Book
          </button>
        </div>
      </div>

      <div className="filter-tabs">
        {['all', 'borrowed', 'returned', 'overdue'].map((f) => (
          <button key={f} className={`tab ${filter === f ? 'tab-active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', opacity: 0.7, fontWeight: 400 }}>
              ({filterCounts[f]})
            </span>
          </button>
        ))}
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-count">Showing <strong>{filtered.length}</strong> records</span>
        </div>
        {loading ? (
          <div className="loading">
            <div className="loading-spinner" />
            <span className="loading-text">Loading borrowings...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔄</div>
            <h3 className="empty-state-title">{filter === 'all' ? 'No borrowings yet' : `No ${filter} records`}</h3>
            <p className="empty-state-text">{filter === 'all' ? 'Issue your first book to get started' : 'No records match this filter'}</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}><input type="checkbox" checked={filtered.length > 0 && filtered.every(b => selectedIds.has(b._id || b.id))} ref={el => { if (el) el.indeterminate = filtered.some(b => selectedIds.has(b._id || b.id)) && !filtered.every(b => selectedIds.has(b._id || b.id)); }} onChange={() => { const allIds = filtered.map(b => b._id || b.id); setSelectedIds(prev => allIds.every(id => prev.has(id)) ? new Set() : new Set(allIds)); }} style={{ cursor: 'pointer' }} /></th>
                <th>Book</th>
                <th>Employee</th>
                <th>Borrow Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const overdue = isOverdue(b);
                const bid = b._id || b.id;
                return (
                  <tr key={bid} className={overdue ? 'row-overdue' : ''} style={{ background: selectedIds.has(bid) ? '#f0f7ff' : undefined }}>
                    <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(bid)} onChange={() => { setSelectedIds(prev => { const n = new Set(prev); n.has(bid) ? n.delete(bid) : n.add(bid); return n; }); }} style={{ cursor: 'pointer' }} /></td>
                    <td>
                      <div className="table-cell-title">{b.book?.title || '—'}</div>
                      <div className="table-cell-sub">{b.book?.author}</div>
                    </td>
                    <td>
                      <div className="table-cell-title">{b.employee?.name || '—'}</div>
                      <div className="table-cell-sub">{b.employee?.employeeId}</div>
                    </td>
                    <td style={{ color: 'var(--gray-500)' }}>{b.borrowDate ? new Date(b.borrowDate).toLocaleDateString() : '—'}</td>
                    <td style={{ color: 'var(--gray-500)' }}>{b.dueDate ? new Date(b.dueDate).toLocaleDateString() : '—'}</td>
                    <td style={{ color: 'var(--gray-500)' }}>{b.returnDate ? new Date(b.returnDate).toLocaleDateString() : '—'}</td>
                    <td>
                      <span className={`badge ${
                        b.status === 'returned' ? 'badge-green' :
                        overdue ? 'badge-red' : 'badge-blue'
                      }`}>
                        <span className="badge-dot" />
                        {overdue && b.status !== 'returned' ? 'Overdue' : b.status}
                      </span>
                    </td>
                    <td>
                      {b.status !== 'returned' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleReturn(b._id || b.id)} disabled={returningId === (b._id || b.id)} style={{ opacity: returningId === (b._id || b.id) ? 0.7 : 1, cursor: returningId === (b._id || b.id) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {returningId === (b._id || b.id) ? (<><svg width="14" height="14" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" strokeDasharray="32" strokeLinecap="round" /></svg> Returning...</>) : (<><HiOutlineArrowLeft /> Return</>)}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Manual Issue Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Issue a Book</h3>
              <button className="modal-close" onClick={closeModal}><HiOutlineX /></button>
            </div>
            <form onSubmit={handleBorrow}>
              <div className="modal-body">
                {error && <div className="error-msg">⚠️ {error}</div>}
                <div className="form">
                  <div className="form-group">
                    <label className="form-label">Select Book *</label>
                    <select className="form-select" required value={form.bookId} onChange={(e) => setForm({ ...form, bookId: e.target.value })}>
                      <option value="">Choose a book...</option>
                      {books.filter((b) => b.available > 0).map((b) => (
                        <option key={b._id || b.id} value={b._id || b.id}>
                          {b.title} — {b.author} (Available: {b.available})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Select Employee *</label>
                    <select className="form-select" required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
                      <option value="">Choose an employee...</option>
                      {employees.map((emp) => (
                        <option key={emp._id || emp.id} value={emp._id || emp.id}>
                          {emp.name} ({emp.employeeId || emp.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  {submitting ? (<><svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" strokeDasharray="32" strokeLinecap="round" /></svg> Issuing...</>) : 'Issue Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scan Modal */}
      {showScanForm && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📡 Barcode Scan</h3>
              <button className="modal-close" onClick={closeModal}><HiOutlineX /></button>
            </div>
            <div className="modal-body">
              {error && <div className="error-msg">⚠️ {error}</div>}
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
                Scan or type the book barcode and employee barcode to issue/return.
              </p>
              <div className="form" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Book Barcode / ISBN *</label>
                  <input
                    className="form-input"
                    placeholder="Scan or type book barcode..."
                    value={scanForm.bookBarcode}
                    onChange={(e) => setScanForm({ ...scanForm, bookBarcode: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Employee Barcode / ID *</label>
                  <input
                    className="form-input"
                    placeholder="Scan or type employee barcode..."
                    value={scanForm.employeeBarcode}
                    onChange={(e) => setScanForm({ ...scanForm, employeeBarcode: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ gap: '0.5rem' }}>
              <button className="btn btn-success" onClick={handleScanIssue} disabled={!scanForm.bookBarcode || !scanForm.employeeBarcode || submitting} style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                {submitting ? (<><svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" strokeDasharray="32" strokeLinecap="round" /></svg> Issuing...</>) : '📚 Issue'}
              </button>
              <button className="btn btn-secondary" onClick={handleScanReturn} disabled={!scanForm.bookBarcode || !scanForm.employeeBarcode || submitting} style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                {submitting ? (<><svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" strokeDasharray="32" strokeLinecap="round" /></svg> Returning...</>) : '↩️ Return'}
              </button>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
