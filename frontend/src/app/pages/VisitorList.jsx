import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Search, Plus, X, Pencil, Trash2, LogOut, UserRound } from 'lucide-react';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { STATUS_FILTERS, fmtDateTime } from '../utils.js';
import StatusBadge from '../components/StatusBadge.jsx';
import DeleteModal from '../components/DeleteModal.jsx';
import StatsBar from '../components/StatsBar.jsx';

const PAGE_SIZE = 8;

export default function VisitorList() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { user, logout } = useAuth();
  const isEmployee = user.role === 'employee';

  const [visitors, setVisitors] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, checkedIn: 0, checkedOut: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/visitors/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  }, []);

  const fetchVisitors = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'All') params.append('status', statusFilter);
      params.append('page', currentPage);
      params.append('limit', PAGE_SIZE);

      const res = await api.get(`/visitors?${params.toString()}`);
      setVisitors(res.data.visitors);
      setTotalPages(res.data.totalPages || 1);
      setError('');
    } catch (err) {
      console.error('Failed to fetch visitors', err);
      setError('Could not load visitors. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, currentPage]);

  // Debounced fetch on search / filter / page change
  useEffect(() => {
    const timer = setTimeout(fetchVisitors, 300);
    return () => clearTimeout(timer);
  }, [fetchVisitors]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset to page 1 whenever the filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  async function handleCheckOut(visitor) {
    try {
      await api.patch(`/visitors/${visitor._id}`, { status: 'Checked Out' });
      fetchVisitors();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to check out visitor');
    }
  }

  async function confirmDelete() {
    try {
      await api.delete(`/visitors/${toDelete._id}`);
      setToDelete(null);
      // Step back a page if we just deleted the last item on this page
      if (visitors.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        fetchVisitors();
      }
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to delete visitor');
      setToDelete(null);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="inner">
          <div className="masthead">
            <div>
              <p className="eyebrow">{isEmployee ? 'Reception Desk' : 'My Visits'}</p>
              <h1 className="site-title">Visitor Register</h1>
            </div>
            <div className="masthead-actions">
              <span className="user-chip">
                <UserRound size={13} />
                {user.name}
                <span className="role-tag">{user.role}</span>
              </span>
              <button className="btn-new" onClick={() => navigate('/new')}>
                <Plus size={14} strokeWidth={2.5} />
                {isEmployee ? 'New Visitor' : 'Register Visit'}
              </button>
              <button className="btn-ghost" onClick={handleLogout}>
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>

          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-icon">
                <Search size={13} />
              </span>
              <input
                ref={inputRef}
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or mobile number…"
              />
              {search && (
                <button
                  className="search-clear"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearch('');
                    inputRef.current?.focus();
                  }}
                >
                  <X size={11} />
                </button>
              )}
            </div>

            <div className="filters">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  className={`filter-btn${statusFilter === s ? ' active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <StatsBar stats={stats} />

        {error && <p className="banner-error">{error}</p>}

        {loading ? (
          <div className="empty-state">
            <p className="empty-label">Loading…</p>
          </div>
        ) : visitors.length === 0 ? (
          <div className="empty-state">
            <p className="empty-label">
              {search ? `No visitors match "${search}"` : isEmployee ? 'No visitor records yet' : 'You have not registered any visits yet'}
            </p>
            {!search && statusFilter === 'All' && (
              <button className="empty-action" onClick={() => navigate('/new')}>
                {isEmployee ? 'Register the first visitor →' : 'Register your visit →'}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="visitor-table">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Mobile</th>
                    <th>Organization</th>
                    <th>Meeting</th>
                    <th>Purpose</th>
                    <th>Visit Time</th>
                    <th>Status</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.map((v) => (
                    <tr key={v._id}>
                      <td data-label="Visitor">
                        <div className="cell-name">{v.name}</div>
                        <div className="cell-sub">{v.email}</div>
                        {isEmployee && v.createdBy && (
                          <div className="cell-sub">
                            Added by {v.createdBy.name} ({v.createdBy.role})
                          </div>
                        )}
                      </td>
                      <td data-label="Mobile">{v.mobile}</td>
                      <td data-label="Organization">{v.organization}</td>
                      <td data-label="Meeting">{v.personToMeet}</td>
                      <td data-label="Purpose" className="cell-purpose">{v.purpose}</td>
                      <td data-label="Visit Time">
                        <div>{fmtDateTime(v.visitDateTime)}</div>
                        {v.checkOutTime && (
                          <div className="cell-sub">Out: {fmtDateTime(v.checkOutTime)}</div>
                        )}
                      </td>
                      <td data-label="Status">
                        <StatusBadge status={v.status} />
                      </td>
                      <td data-label="Actions" className="col-actions">
                        <div className="row-actions">
                          {isEmployee && v.status === 'Checked In' && (
                            <button
                              className="icon-btn"
                              title="Check out"
                              onClick={() => handleCheckOut(v)}
                            >
                              <LogOut size={14} />
                            </button>
                          )}
                          {(isEmployee || v.status === 'Checked In') && (
                            <button
                              className="icon-btn"
                              title="Edit"
                              onClick={() => navigate(`/visitor/${v._id}/edit`)}
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {isEmployee && (
                            <button
                              className="icon-btn danger"
                              title="Delete"
                              onClick={() => setToDelete(v)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn-cancel"
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn-cancel"
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {toDelete && (
        <DeleteModal
          name={toDelete.name}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
