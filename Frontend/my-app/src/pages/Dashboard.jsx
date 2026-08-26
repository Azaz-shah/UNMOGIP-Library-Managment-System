import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowRight,
} from 'react-icons/hi';
import api from '../api';

const actionColors = {
  borrowed: { bg: '#dbeafe', text: '#2563eb', label: 'ISSUE' },
  overdue: { bg: '#fee2e2', text: '#dc2626', label: 'OVERDUE' },
  returned: { bg: '#dcfce7', text: '#15803d', label: 'RETURN' },
};

const chartBarColors = [
  'linear-gradient(180deg, #1e3a5f 0%, #0f172a 100%)',
  'linear-gradient(180deg, #334155 0%, #1e293b 100%)',
  'linear-gradient(180deg, #64748b 0%, #475569 100%)',
  'linear-gradient(180deg, #94a3b8 0%, #64748b 100%)',
  'linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)',
  'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)',
];

export default function Dashboard() {
  const [stats, setStats] = useState({ totalBooks: 0, activeBorrowings: 0, overdueBooks: 0, totalEmployees: 0, totalBorrowings: 0, returnedBooks: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [overdueTrend, setOverdueTrend] = useState([]);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const trendRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/reports/stats')
      .then((r) => setStats(r.data))
      .catch(() => {});

    api.get('/borrowings?limit=5')
      .then((r) => setRecentActivity(r.data.borrowings || []))
      .catch(() => {});

    api.get('/reports/most-borrowed-categories')
      .then((r) => setCategoryData(r.data || []))
      .catch(() => {});

    api.get('/reports/overdue-trend?days=30')
      .then((r) => setOverdueTrend(r.data || []))
      .catch(() => {});
  }, []);

  const statCards = [
    { label: 'Total Books', value: stats.totalBooks || 0 },
    { label: 'Books Issued', value: stats.activeBorrowings || 0 },
    { label: 'Overdue Books', value: stats.overdueBooks || 0 },
    { label: 'Active Employees', value: stats.totalEmployees || 0 },
  ];

  const maxCategoryCount = Math.max(...categoryData.map(c => c.count), 1);
  const maxOverdueCount = Math.max(...overdueTrend.map(t => t.count), 1);

  const buildTrendPoints = () => {
    if (overdueTrend.length < 2) return [];
    const width = 300;
    const height = 120;
    const padding = 15;
    return overdueTrend.map((t, i) => ({
      x: padding + (i / (overdueTrend.length - 1)) * (width - padding * 2),
      y: height - padding - (t.count / Math.max(maxOverdueCount, 1)) * (height - padding * 2),
      data: t,
    }));
  };

  const trendPoints = buildTrendPoints();
  const trendPath = trendPoints.length > 0
    ? trendPoints.map(p => `${p.x},${p.y}`).join(' ')
    : '';

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays} Day${diffDays > 1 ? 's' : ''} Ago`;
    return d.toLocaleDateString();
  };

  const getShortLabel = (label) => {
    if (!label) return 'N/A';
    return label.length > 4 ? label.substring(0, 4) : label;
  };

  const handleTrendHover = (e, point) => {
    if (!trendRef.current) return;
    const rect = trendRef.current.getBoundingClientRect();
    setHoveredPoint(point);
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10 });
  };

  return (
    <div>
      {/* Stat Cards - Simple/Flat */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem', marginBottom: '1.5rem',
      }}>
        {statCards.map((card) => (
          <div key={card.label} style={{
            background: '#fff', borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem 1.5rem',
          }}>
            <div style={{
              fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500,
              marginBottom: '0.375rem', textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}>
              {card.label}
            </div>
            <div style={{
              fontSize: '2rem', fontWeight: 800, color: '#0f172a',
              lineHeight: 1.1,
            }}>
              {card.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '1rem', marginBottom: '1.5rem',
      }}>
        {/* Most Borrowed Categories */}
        <div style={{
          background: '#fff', borderRadius: '12px',
          border: '1px solid #e2e8f0', padding: '1.5rem',
        }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
            Most Borrowed Categories
          </h3>
          {categoryData.length === 0 ? (
            <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              No category data available yet
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around',
              height: '160px', padding: '0 0.5rem', position: 'relative',
            }}>
              {categoryData.map((bar, i) => {
                const barHeight = Math.max(12, (bar.count / maxCategoryCount) * 110);
                const isHovered = hoveredBar === i;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: '0.5rem', flex: 1, position: 'relative',
                    }}
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div style={{
                        position: 'absolute', top: '0',
                        background: '#0f172a', color: '#fff',
                        padding: '0.35rem 0.7rem', borderRadius: '8px',
                        fontSize: '0.75rem', fontWeight: 600,
                        whiteSpace: 'nowrap', zIndex: 10,
                        transform: 'translateY(-100%)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      }}>
                        {bar.category}: {bar.count} borrows
                      </div>
                    )}
                    <div style={{
                      width: '32px',
                      height: `${barHeight}px`,
                      background: chartBarColors[i % chartBarColors.length],
                      borderRadius: '4px 4px 0 0',
                      transition: 'all 0.2s ease',
                      transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)',
                      transformOrigin: 'bottom',
                      boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                    }} />
                    <span style={{
                      fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500,
                      textAlign: 'center', maxWidth: '50px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {getShortLabel(bar.category)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Overdue Trend - Interactive */}
        <div style={{
          background: '#fff', borderRadius: '12px',
          border: '1px solid #e2e8f0', padding: '1.5rem',
        }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
            Overdue Trend (30 Days)
          </h3>
          {overdueTrend.length === 0 ? (
            <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              No trend data available yet
            </div>
          ) : (
            <div ref={trendRef} style={{ height: '140px', position: 'relative' }}>
              {/* Tooltip */}
              {hoveredPoint && (
                <div style={{
                  position: 'absolute',
                  left: `${tooltipPos.x}px`,
                  top: `${tooltipPos.y}px`,
                  transform: 'translate(-50%, -100%)',
                  background: '#0f172a', color: '#fff',
                  padding: '0.4rem 0.75rem', borderRadius: '8px',
                  fontSize: '0.72rem', fontWeight: 600,
                  whiteSpace: 'nowrap', zIndex: 20,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  pointerEvents: 'none',
                }}>
                  <div style={{ fontSize: '0.65rem', opacity: 0.8, marginBottom: '2px' }}>
                    {hoveredPoint.data.date}
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {hoveredPoint.data.count} overdue
                  </div>
                </div>
              )}

              <svg width="100%" height="140" viewBox="0 0 300 140" fill="none" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 1, 2, 3].map(i => (
                  <line
                    key={i}
                    x1="15" y1={10 + i * 37} x2="285" y2={10 + i * 37}
                    stroke="#f1f5f9" strokeWidth="1"
                  />
                ))}

                {/* Area fill */}
                {trendPoints.length > 1 && (
                  <polygon
                    points={`15,130 ${trendPath} 285,130`}
                    fill="url(#areaGrad)"
                    opacity="0.12"
                  />
                )}

                {/* Line */}
                {trendPoints.length > 1 && (
                  <polyline
                    points={trendPath}
                    stroke="#0f172a"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Interactive hover areas + dots */}
                {trendPoints.map((p, i) => (
                  <g key={i}>
                    {/* Invisible hover area */}
                    <rect
                      x={p.x - 8} y={0} width={16} height={140}
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => handleTrendHover(e, p)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    {/* Visible dot */}
                    <circle
                      cx={p.x} cy={p.y}
                      r={hoveredPoint?.data.date === p.data.date ? 5 : 3}
                      fill="#0f172a"
                      stroke={hoveredPoint?.data.date === p.data.date ? '#fff' : 'none'}
                      strokeWidth={hoveredPoint?.data.date === p.data.date ? 2 : 0}
                      style={{ pointerEvents: 'none', transition: 'r 0.15s, stroke-width 0.15s' }}
                    />
                    {/* Vertical guide line on hover */}
                    {hoveredPoint?.data.date === p.data.date && (
                      <line
                        x1={p.x} y1={p.y} x2={p.x} y2={130}
                        stroke="#0f172a" strokeWidth="1" strokeDasharray="3,3"
                        opacity="0.3" style={{ pointerEvents: 'none' }}
                      />
                    )}
                  </g>
                ))}

                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f172a" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        background: '#fff', borderRadius: '12px',
        border: '1px solid #e2e8f0', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9',
        }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
            Recent Activity
          </h3>
          <button
            onClick={() => navigate('/borrowings')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#2563eb', fontSize: '0.82rem', fontWeight: 600,
            }}
          >
            View All
            <HiOutlineArrowRight style={{ fontSize: '0.9rem' }} />
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
            <p style={{ margin: 0 }}>No recent activity</p>
          </div>
        ) : (
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>BOOK TITLE</th>
                <th>EMPLOYEE NAME</th>
                <th>ACTION</th>
                <th>TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((b, i) => {
                const status = b.status === 'returned' ? 'returned'
                  : (b.status === 'overdue' || (b.status === 'borrowed' && new Date(b.dueDate) < new Date())) ? 'overdue'
                  : 'borrowed';
                const ac = actionColors[status] || actionColors.borrowed;

                return (
                  <tr key={b._id || i}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                        {b.book?.title || 'Unknown Book'}
                      </div>
                    </td>
                    <td style={{ color: '#475569', fontSize: '0.85rem' }}>
                      {b.employee?.name || '—'}
                    </td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.625rem', borderRadius: '9999px',
                        fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.03em',
                        background: ac.bg, color: ac.text,
                      }}>
                        {ac.label}
                      </span>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                      {formatTime(b.borrowDate || b.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
