import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineUser,
  HiOutlineOfficeBuilding,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineIdentification,
  HiOutlineTag,
  HiOutlineDotsVertical,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../api';

const emptyForm = { name: '', email: '', phone: '', department: '', designation: '' };

export default function Members() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleteModal, setDeleteModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const menuRef = useRef(null);
  const itemsPerPage = 10;

  const load = () => {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get(`/employees${params}`)
      .then((r) => {
        setEmployees(r.data.employees || r.data);
        setTotalEmployees(r.data.total || (r.data.employees || r.data).length);
      })
      .catch(() => toast.error('Failed to load employees'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [search]);
  useEffect(() => { setCurrentPage(1); setSelectedIds(new Set()); }, [search]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/employees/${editing}`, form);
        toast.success('Employee updated successfully');
      } else {
        await api.post('/employees', form);
        toast.success('Employee added successfully');
      }
      setForm(emptyForm);
      setEditing(null);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (emp) => {
    setForm({
      name: emp.name, email: emp.email, phone: emp.phone || '',
      department: emp.department || '', designation: emp.designation || '',
    });
    setEditing(emp._id || emp.id);
    setShowForm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    try {
      await api.delete(`/employees/${deleteModal._id || deleteModal.id}`);
      toast.success('Employee removed');
      setDeleteModal(null);
      setSelectedIds(prev => { const n = new Set(prev); n.delete(deleteModal._id || deleteModal.id); return n; });
      load();
    } catch {
      toast.error('Failed to remove employee');
    }
  };

  const viewHistory = async (emp) => {
    try {
      const { data } = await api.get(`/employees/${emp._id || emp.id}`);
      setSelectedEmployee(data);
    } catch {
      toast.error('Failed to load history');
    }
  };

  const filtered = employees;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paged = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, filtered.length);

  // Select all logic
  const pagedIds = paged.map(e => e._id || e.id);
  const allSelected = pagedIds.length > 0 && pagedIds.every(id => selectedIds.has(id));
  const someSelected = pagedIds.some(id => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pagedIds));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  const getAvatarColor = (name) => {
    const colors = ['#6366f1', '#0891b2', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0d9488', '#c026d3'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const closeModal = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">Employees</h2>
          <p className="page-subtitle">Manage library members and their accounts</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditing(null); setShowForm(true); }}>
            <HiOutlinePlus /> Add Employee
          </button>
        </div>
      </div>

      <div className="search-wrapper">
        <HiOutlineSearch className="search-icon" />
        <input className="search-input" placeholder="Search by name, email, department, or employee ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-count">
            Showing <strong>{startIdx}</strong> to <strong>{endIdx}</strong> of <strong>{filtered.length}</strong> results
          </span>
        </div>
        {loading ? (
          <div className="loading">
            <div className="loading-spinner" />
            <span className="loading-text">Loading employees...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3 className="empty-state-title">{search ? 'No employees found' : 'No employees yet'}</h3>
            <p className="empty-state-text">{search ? 'Try adjusting your search terms' : 'Add your first employee to get started'}</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th>EMPLOYEE ID</th>
                <th>NAME</th>
                <th>DEPARTMENT</th>
                <th>OFFICE EMAIL</th>
                <th>STATUS</th>
                <th>ISSUED BOOKS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((emp) => {
                const empId = emp._id || emp.id;
                const isMenuOpen = activeMenu === empId;
                // Determine if this is a last-row item to open menu upward
                const empIndex = paged.indexOf(emp);
                const openUpward = empIndex >= paged.length - 2;

                return (
                  <tr
                    key={empId}
                    style={{
                      cursor: 'pointer',
                      background: selectedIds.has(empId) ? '#f0f7ff' : undefined,
                    }}
                    onClick={() => navigate(`/employees/${empId}`)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(empId)}
                        onChange={() => toggleSelect(empId)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                        {emp.employeeId || '—'}
                      </span>
                    </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>{emp.name}</span>
                  </td>
                    <td style={{ color: '#475569', fontSize: '0.85rem' }}>{emp.department || '—'}</td>
                    <td style={{ color: '#475569', fontSize: '0.85rem' }}>{emp.email}</td>
                    <td>
                      {(emp.isActive && emp.status !== 'Inactive') ? (
                        <span style={{
                          padding: '0.2rem 0.75rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 600,
                          background: '#dcfce7', color: '#15803d',
                        }}>Active</span>
                      ) : (
                        <span style={{
                          padding: '0.2rem 0.75rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 600,
                          background: '#fee2e2', color: '#dc2626',
                        }}>Inactive</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '28px', height: '28px', borderRadius: '8px',
                        background: emp.issuedBooks > 0 ? '#e0e7ff' : '#f1f5f9',
                        color: emp.issuedBooks > 0 ? '#4338ca' : '#94a3b8',
                        fontSize: '0.85rem', fontWeight: 700,
                      }}>
                        {emp.issuedBooks || 0}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }} ref={isMenuOpen ? menuRef : undefined}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(isMenuOpen ? null : empId);
                        }}
                        style={{
                          background: isMenuOpen ? '#f1f5f9' : 'none', border: 'none', cursor: 'pointer',
                          padding: '4px', color: '#64748b', borderRadius: '6px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <HiOutlineDotsVertical style={{ fontSize: '1.1rem' }} />
                      </button>
                      {isMenuOpen && (
                        <div style={{
                          position: 'absolute', right: 0, zIndex: 30,
                          ...(openUpward
                            ? { bottom: '100%', marginBottom: '4px' }
                            : { top: '100%', marginTop: '4px' }
                          ),
                          background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '140px', padding: '0.375rem',
                        }}>
                          <button onClick={(e) => { e.stopPropagation(); handleEdit(emp); setActiveMenu(null); }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.82rem', color: '#475569', borderRadius: '6px', textAlign: 'left' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                          >
                            <HiOutlinePencil style={{ fontSize: '0.9rem' }} /> Edit
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteModal(emp); setActiveMenu(null); }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.82rem', color: '#dc2626', borderRadius: '6px', textAlign: 'left' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                          >
                            <HiOutlineTrash style={{ fontSize: '0.9rem' }} /> Remove
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && filtered.length > itemsPerPage && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.75rem 1.5rem', borderTop: '1px solid #f1f5f9',
          }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Showing <strong>{startIdx}</strong> to <strong>{endIdx}</strong> of <strong>{filtered.length}</strong> results
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '0.4rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0',
                  background: '#fff', color: currentPage === 1 ? '#cbd5e1' : '#475569',
                  fontSize: '0.82rem', fontWeight: 500, cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.4rem 1rem', borderRadius: '8px', border: '1px solid #3b82f6',
                  background: currentPage === totalPages ? '#f1f5f9' : '#3b82f6',
                  color: currentPage === totalPages ? '#94a3b8' : '#fff',
                  fontSize: '0.82rem', fontWeight: 600, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ====== Custom Delete Confirmation Modal ====== */}
      {deleteModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setDeleteModal(null)}>
          <div
            style={{
              background: '#fff', borderRadius: '16px', width: '420px', maxWidth: '90vw',
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)', textAlign: 'center', padding: '2rem 2rem 1.5rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning icon */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <HiOutlineExclamationCircle style={{ fontSize: '2rem', color: '#dc2626' }} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              Remove Employee
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong style={{ color: '#0f172a' }}>{deleteModal.name}</strong>?
              They will no longer be able to access the system.
            </p>

            {/* Employee info card */}
            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
              padding: '0.75rem 1rem', marginBottom: '1.25rem', textAlign: 'left',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>{deleteModal.name}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                {deleteModal.employeeId || '—'} • {deleteModal.email}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteModal(null)}
                style={{
                  padding: '0.6rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0',
                  background: '#fff', color: '#475569', fontSize: '0.88rem', fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none',
                  background: '#dc2626', color: '#fff', fontSize: '0.88rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: '0 2px 8px rgba(220,38,38,0.3)',
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#b91c1c'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#dc2626'; }}
              >
                <HiOutlineTrash style={{ fontSize: '0.95rem' }} />
                Remove Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Employee Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '1.75rem 1.75rem 0', textAlign: 'center',
              borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem',
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: editing ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #0f172a, #334155)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}>
                <HiOutlineUser style={{ fontSize: '1.75rem', color: '#fff' }} />
              </div>
              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                {editing ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                {editing ? 'Update employee information below' : 'Fill in the details to register a new employee'}
              </p>
              <button
                onClick={closeModal}
                style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  background: '#f1f5f9', border: 'none', borderRadius: '8px',
                  width: '32px', height: '32px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#64748b', fontSize: '1.1rem',
                }}
              >
                <HiOutlineX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding: '1.25rem 1.75rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    marginBottom: '0.75rem', paddingBottom: '0.5rem',
                    borderBottom: '1px solid #f1f5f9',
                  }}>
                    <HiOutlineUser style={{ fontSize: '0.9rem', color: '#0f172a' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.03em' }}>
                      PERSONAL INFORMATION
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
                      <HiOutlineIdentification style={{ fontSize: '0.85rem', color: '#94a3b8' }} />
                      Full Name *
                    </label>
                    <input className="form-input" required placeholder="e.g. John Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ paddingLeft: '0.75rem' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
                        <HiOutlineMail style={{ fontSize: '0.85rem', color: '#94a3b8' }} />
                        Email Address *
                      </label>
                      <input className="form-input" required type="email" placeholder="john@unmogip.org" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ paddingLeft: '0.75rem' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
                        <HiOutlinePhone style={{ fontSize: '0.85rem', color: '#94a3b8' }} />
                        Phone Number
                      </label>
                      <input className="form-input" placeholder="e.g. +92 300 1234567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ paddingLeft: '0.75rem' }} />
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    marginBottom: '0.75rem', paddingBottom: '0.5rem',
                    borderBottom: '1px solid #f1f5f9',
                  }}>
                    <HiOutlineOfficeBuilding style={{ fontSize: '0.9rem', color: '#0f172a' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.03em' }}>
                      WORK DETAILS
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
                        <HiOutlineOfficeBuilding style={{ fontSize: '0.85rem', color: '#94a3b8' }} />
                        Department
                      </label>
                      <input className="form-input" placeholder="e.g. HR, IT, Admin" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} style={{ paddingLeft: '0.75rem' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
                        <HiOutlineTag style={{ fontSize: '0.85rem', color: '#94a3b8' }} />
                        Designation
                      </label>
                      <input className="form-input" placeholder="e.g. Officer, Manager" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} style={{ paddingLeft: '0.75rem' }} />
                    </div>
                  </div>

                  {!editing && (
                    <div style={{
                      marginTop: '0.75rem',
                      background: '#f0f9ff', border: '1px solid #bae6fd',
                      borderRadius: '8px', padding: '0.625rem 0.875rem',
                      fontSize: '0.8rem', color: '#0369a1',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}>
                      <HiOutlineTag style={{ fontSize: '0.9rem', flexShrink: 0 }} />
                      <span>Employee ID and Barcode will be <strong>auto-generated</strong> when you save.</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: '0.5rem',
                padding: '1rem 1.75rem', borderTop: '1px solid #f1f5f9',
                background: '#fafbfc', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px',
              }}>
                <button type="button" onClick={closeModal} style={{
                  padding: '0.5rem 1.25rem', borderRadius: '8px',
                  border: '1.5px solid #e2e8f0', background: '#fff',
                  color: '#475569', fontSize: '0.85rem', fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{
                  padding: '0.5rem 1.5rem', borderRadius: '8px',
                  border: 'none', background: '#0f172a',
                  color: '#fff', fontSize: '0.85rem', fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer', transition: 'all 0.15s ease',
                  boxShadow: '0 2px 6px rgba(15,23,42,0.2)',
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  opacity: submitting ? 0.7 : 1,
                }}>
                  {submitting ? (
                    <><svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" strokeDasharray="32" strokeLinecap="round" /></svg> {editing ? 'Updating...' : 'Adding...'}</>
                  ) : (
                    <><HiOutlinePlus style={{ fontSize: '1rem' }} /> {editing ? 'Update Employee' : 'Add Employee'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Borrowing History Modal */}
      {selectedEmployee && (
        <div className="modal-overlay" onClick={() => setSelectedEmployee(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Borrowing History — {selectedEmployee.name}</h3>
              <button className="modal-close" onClick={() => setSelectedEmployee(null)}><HiOutlineX /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                <span><strong>ID:</strong> {selectedEmployee.employeeId}</span>
                <span><strong>Barcode:</strong> {selectedEmployee.barcode}</span>
              </div>
              {selectedEmployee.borrowingHistory?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedEmployee.borrowingHistory.map((h, i) => (
                    <div key={i} style={{
                      padding: '0.75rem', borderRadius: 'var(--radius-md)',
                      background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{h.book?.title || 'Unknown Book'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                        Borrowed: {new Date(h.borrowDate).toLocaleDateString()}
                        {h.returnDate && ` • Returned: ${new Date(h.returnDate).toLocaleDateString()}`}
                      </div>
                      <span className={`badge ${h.status === 'returned' ? 'badge-green' : h.status === 'overdue' ? 'badge-red' : 'badge-blue'}`} style={{ marginTop: '0.35rem' }}>
                        {h.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: '2rem' }}>No borrowing history</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
