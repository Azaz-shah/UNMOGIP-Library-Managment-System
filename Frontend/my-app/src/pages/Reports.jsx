import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import {
  HiOutlineDocumentReport,
  HiOutlineDownload,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineDocumentText,
  HiOutlineExclamationCircle,
  HiOutlineUserGroup,
  HiOutlineCollection,
} from 'react-icons/hi';

const tabs = [
  { id: 'most-borrowed', label: 'MOST BORROWED', icon: HiOutlineDocumentReport },
  { id: 'overdue', label: 'OVERDUE', icon: HiOutlineExclamationCircle },
  { id: 'employee-wise', label: 'EMPLOYEE-WISE', icon: HiOutlineUserGroup },
  { id: 'stock', label: 'STOCK REPORT', icon: HiOutlineCollection },
];

const statusColors = {
  'In Stock': { bg: '#dcfce7', text: '#15803d' },
  'Low Stock': { bg: '#fef9c3', text: '#a16207' },
  'Out of Stock': { bg: '#fee2e2', text: '#dc2626' },
  'Lost': { bg: '#f3e8ff', text: '#9333ea' },
  'borrowed': { bg: '#dbeafe', text: '#2563eb' },
  'returned': { bg: '#dcfce7', text: '#15803d' },
  'overdue': { bg: '#fee2e2', text: '#dc2626' },
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState('most-borrowed');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const perPage = 8;

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint;
      switch (activeTab) {
        case 'most-borrowed':
          endpoint = '/reports/most-borrowed';
          break;
        case 'overdue':
          endpoint = '/reports/overdue';
          break;
        case 'employee-wise':
          endpoint = '/reports/employee-wise';
          break;
        case 'stock':
          endpoint = '/reports/stock';
          break;
        default:
          endpoint = '/reports/most-borrowed';
      }

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (activeTab === 'most-borrowed') params.append('limit', '50');

      const { data: result } = await api.get(`${endpoint}?${params.toString()}`);
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Failed to fetch report:', err);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchData();
  }, [activeTab, startDate, endDate]);

  const handleExport = async (format) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `${api.defaults.baseURL}/reports/export/${format}/${activeTab}?${params.toString()}`;
      const token = localStorage.getItem('token');

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${activeTab}-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`${format.toUpperCase()} report downloaded!`);
    } catch (err) {
      toast.error('Export failed. Try again.');
    }
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(data.length / perPage));
  const pagedData = data.slice((page - 1) * perPage, page * perPage);
  const startIdx = (page - 1) * perPage + 1;
  const endIdx = Math.min(page * perPage, data.length);

  const renderMostBorrowed = () => (
    <table className="table">
      <thead>
        <tr>
          <th style={{ width: '40px' }}><input type="checkbox" checked={pagedData.length > 0 && pagedData.every((_, i) => selectedIds.has((page - 1) * perPage + i))} ref={el => { if (el) el.indeterminate = pagedData.some((_, i) => selectedIds.has((page - 1) * perPage + i)) && !pagedData.every((_, i) => selectedIds.has((page - 1) * perPage + i)); }} onChange={() => { const allIdx = pagedData.map((_, i) => (page - 1) * perPage + i); setSelectedIds(prev => allIdx.every(id => prev.has(id)) ? new Set() : new Set(allIdx)); }} style={{ cursor: 'pointer' }} /></th>
          <th>RANK</th>
          <th>BOOK TITLE</th>
          <th>CATEGORY</th>
          <th>TIMES BORROWED</th>
          <th>STATUS</th>
        </tr>
      </thead>
      <tbody>
        {pagedData.map((item, i) => {
          const rank = (page - 1) * perPage + i + 1;
          const stockStatus = item.count > 100 ? 'In Stock' : item.count > 50 ? 'Low Stock' : 'In Stock';
          const sc = statusColors[stockStatus] || statusColors['In Stock'];
          return (
            <tr key={item._id || i} style={{ background: selectedIds.has((page - 1) * perPage + i) ? '#f0f7ff' : undefined }}>
              <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has((page - 1) * perPage + i)} onChange={() => { const idx = (page - 1) * perPage + i; setSelectedIds(prev => { const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s; }); }} style={{ cursor: 'pointer' }} /></td>
              <td style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.85rem' }}>
                {String(rank).padStart(2, '0')}
              </td>
              <td>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
                  {item.title}
                </div>
                {item.author && (
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                    {item.author}
                  </div>
                )}
              </td>
              <td style={{ color: '#475569', fontSize: '0.85rem' }}>
                {item.isbn || '—'}
              </td>
              <td>
                <span style={{
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: '#0f172a',
                }}>
                  {item.count}
                </span>
              </td>
              <td>
                <span style={{
                  padding: '0.2rem 0.625rem',
                  borderRadius: '9999px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  background: sc.bg,
                  color: sc.text,
                }}>
                  {stockStatus.toUpperCase()}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderOverdue = () => (
    <table className="table">
      <thead>
        <tr>
          <th style={{ width: '40px' }}><input type="checkbox" checked={pagedData.length > 0 && pagedData.every((_, i) => selectedIds.has((page - 1) * perPage + i))} onChange={() => { const allIdx = pagedData.map((_, i) => (page - 1) * perPage + i); setSelectedIds(prev => allIdx.every(id => prev.has(id)) ? new Set() : new Set(allIdx)); }} style={{ cursor: 'pointer' }} /></th>
          <th>BOOK TITLE</th>
          <th>EMPLOYEE</th>
          <th>DEPARTMENT</th>
          <th>DUE DATE</th>
          <th>DAYS OVERDUE</th>
        </tr>
      </thead>
      <tbody>
        {pagedData.map((item, i) => (
          <tr key={i} style={{ background: selectedIds.has((page - 1) * perPage + i) ? '#f0f7ff' : undefined }}>
            <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has((page - 1) * perPage + i)} onChange={() => { const idx = (page - 1) * perPage + i; setSelectedIds(prev => { const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s; }); }} style={{ cursor: 'pointer' }} /></td>
            <td>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
                {item.bookTitle}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                {item.author}
              </div>
            </td>
            <td>
              <div style={{ color: '#0f172a', fontSize: '0.875rem' }}>{item.employeeName}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.employeeId}</div>
            </td>
            <td style={{ color: '#475569', fontSize: '0.85rem' }}>{item.department || '—'}</td>
            <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>
              {new Date(item.dueDate).toLocaleDateString()}
            </td>
            <td>
              <span style={{
                padding: '0.2rem 0.625rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: '#fee2e2',
                color: '#dc2626',
              }}>
                {item.daysOverdue} days
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderEmployeeWise = () => (
    <table className="table">
      <thead>
        <tr>
          <th style={{ width: '40px' }}><input type="checkbox" checked={pagedData.length > 0 && pagedData.every((_, i) => selectedIds.has((page - 1) * perPage + i))} onChange={() => { const allIdx = pagedData.map((_, i) => (page - 1) * perPage + i); setSelectedIds(prev => allIdx.every(id => prev.has(id)) ? new Set() : new Set(allIdx)); }} style={{ cursor: 'pointer' }} /></th>
          <th>EMPLOYEE</th>
          <th>BOOK</th>
          <th>BORROW DATE</th>
          <th>DUE DATE</th>
          <th>RETURN DATE</th>
          <th>STATUS</th>
        </tr>
      </thead>
      <tbody>
        {pagedData.map((item, i) => {
          const sc = statusColors[item.status] || {};
          return (
            <tr key={i} style={{ background: selectedIds.has((page - 1) * perPage + i) ? '#f0f7ff' : undefined }}>
              <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has((page - 1) * perPage + i)} onChange={() => { const idx = (page - 1) * perPage + i; setSelectedIds(prev => { const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s; }); }} style={{ cursor: 'pointer' }} /></td>
              <td>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
                  {item.employee?.name || '—'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {item.employee?.employeeId || '—'}
                </div>
              </td>
              <td>
                <div style={{ fontWeight: 500, color: '#0f172a', fontSize: '0.875rem' }}>
                  {item.book?.title || '—'}
                </div>
              </td>
              <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>
                {item.borrowDate ? new Date(item.borrowDate).toLocaleDateString() : '—'}
              </td>
              <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>
                {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—'}
              </td>
              <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>
                {item.returnDate ? new Date(item.returnDate).toLocaleDateString() : '—'}
              </td>
              <td>
                <span style={{
                  padding: '0.2rem 0.625rem',
                  borderRadius: '9999px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  background: sc.bg || '#f1f5f9',
                  color: sc.text || '#475569',
                  textTransform: 'capitalize',
                }}>
                  {item.status}
                  {item.isReturnedLate ? ' (Late)' : ''}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderStock = () => (
    <table className="table">
      <thead>
        <tr>
          <th style={{ width: '40px' }}><input type="checkbox" checked={pagedData.length > 0 && pagedData.every((_, i) => selectedIds.has((page - 1) * perPage + i))} onChange={() => { const allIdx = pagedData.map((_, i) => (page - 1) * perPage + i); setSelectedIds(prev => allIdx.every(id => prev.has(id)) ? new Set() : new Set(allIdx)); }} style={{ cursor: 'pointer' }} /></th>
          <th>BOOK TITLE</th>
          <th>AUTHOR</th>
          <th>CATEGORY</th>
          <th>TOTAL</th>
          <th>AVAILABLE</th>
          <th>ISSUED</th>
          <th>STATUS</th>
        </tr>
      </thead>
      <tbody>
        {pagedData.map((item, i) => {
          const sc = statusColors[item.status] || {};
          return (
            <tr key={i} style={{ background: selectedIds.has((page - 1) * perPage + i) ? '#f0f7ff' : undefined }}>
              <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has((page - 1) * perPage + i)} onChange={() => { const idx = (page - 1) * perPage + i; setSelectedIds(prev => { const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s; }); }} style={{ cursor: 'pointer' }} /></td>
              <td>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
                  {item.title}
                </div>
              </td>
              <td style={{ color: '#475569', fontSize: '0.85rem' }}>{item.author}</td>
              <td style={{ color: '#475569', fontSize: '0.85rem' }}>{item.category || '—'}</td>
              <td style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>{item.totalCopies}</td>
              <td style={{ fontWeight: 600, color: '#15803d', fontSize: '0.875rem' }}>{item.available}</td>
              <td style={{ fontWeight: 600, color: '#2563eb', fontSize: '0.875rem' }}>{item.issued}</td>
              <td>
                <span style={{
                  padding: '0.2rem 0.625rem',
                  borderRadius: '9999px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  background: sc.bg || '#f1f5f9',
                  color: sc.text || '#475569',
                }}>
                  {item.status.toUpperCase()}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderTable = () => {
    switch (activeTab) {
      case 'most-borrowed': return renderMostBorrowed();
      case 'overdue': return renderOverdue();
      case 'employee-wise': return renderEmployeeWise();
      case 'stock': return renderStock();
      default: return renderMostBorrowed();
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem' }}>
            Reports Hub
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Generate, analyze, and export library activity data.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Date range */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.4rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            background: '#fff',
          }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>📅</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '0.8rem',
                color: '#475569',
                fontFamily: 'inherit',
                background: 'transparent',
              }}
            />
            <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>–</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '0.8rem',
                color: '#475569',
                fontFamily: 'inherit',
                background: 'transparent',
              }}
            />
          </div>

          {/* Export PDF */}
          <button
            onClick={() => handleExport('pdf')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1.5px solid #e2e8f0',
              background: '#fff',
              color: '#475569',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0f172a'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
          >
            <HiOutlineDocumentText style={{ fontSize: '1rem' }} />
            Export PDF
          </button>

          {/* Export Excel */}
          <button
            onClick={() => handleExport('excel')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1.5px solid #15803d',
              background: '#15803d',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 6px rgba(21,128,61,0.2)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#166534'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(21,128,61,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#15803d'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(21,128,61,0.2)'; }}
          >
            <HiOutlineDownload style={{ fontSize: '1rem' }} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '2px solid #f1f5f9',
        marginBottom: '0',
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.75rem 1.25rem',
                border: 'none',
                borderBottom: isActive ? '2.5px solid #0f172a' : '2.5px solid transparent',
                background: 'transparent',
                color: isActive ? '#0f172a' : '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                letterSpacing: '0.03em',
                marginBottom: '-2px',
              }}
            >
              <tab.icon style={{ fontSize: '1rem' }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="table-wrapper" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0 }}>
        <div className="table-toolbar">
          <span className="table-count">
            Showing <strong>{startIdx}</strong> to <strong>{endIdx}</strong> of <strong>{data.length}</strong> records
          </span>
        </div>
        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <span>Loading report...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="empty-state">
            <HiOutlineDocumentReport style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '0.75rem' }} />
            <h3 style={{ margin: 0, color: '#475569' }}>No data available</h3>
            <p style={{ color: '#94a3b8', margin: '0.5rem 0 0' }}>
              No records found for this report. Try adjusting the date range.
            </p>
          </div>
        ) : (
          <>
            {renderTable()}

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
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;

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

                {totalPages > 5 && <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>…</span>}

                {/* Prev */}
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
                  }}
                >
                  <HiChevronLeft style={{ fontSize: '1rem' }} />
                  Prev
                </button>

                {/* Next */}
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
                >
                  Next
                  <HiChevronRight style={{ fontSize: '1rem' }} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
