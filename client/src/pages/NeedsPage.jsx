import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getNeeds, deleteNeed } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  Plus, Search, Filter, Trash2, Eye, ChevronDown, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Food', 'Medical', 'Shelter', 'Education', 'Water', 'Other'];
const STATUSES   = ['All', 'OPEN', 'ASSIGNED', 'RESOLVED'];

function UrgencyBar({ score }) {
  const color = score >= 8 ? 'bg-red-500' : score >= 5 ? 'bg-yellow-500' : 'bg-brand-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${score * 10}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-6 text-right">{score}</span>
    </div>
  );
}

export default function NeedsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [needs, setNeeds]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus]     = useState('All');

  const canCreate = ['COORDINATOR', 'FIELD_WORKER'].includes(user?.role);
  const canDelete = user?.role === 'COORDINATOR';

  const fetchNeeds = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status !== 'All') params.status = status;
      if (category !== 'All') params.category = category;
      const { data } = await getNeeds(params);
      setNeeds(data);
    } catch {
      toast.error('Failed to load needs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNeeds(); }, [status, category]);

  const filtered = needs.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.location.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this need report?')) return;
    try {
      await deleteNeed(id);
      toast.success('Deleted');
      setNeeds((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error('Delete failed');
    }
  };

  const statusColor = { OPEN: 'badge-blue', ASSIGNED: 'badge-yellow', RESOLVED: 'badge-green' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Need Reports</h1>
          <p className="text-slate-400 mt-1">{filtered.length} reports found</p>
        </div>
        {canCreate && (
          <Link to="/needs/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Report Need
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted" />
          <input
            className="input-field pl-10 py-2 text-sm"
            placeholder="Search by title or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="relative">
          <select
            className="input-field py-2 text-sm appearance-none pr-8"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => <option key={c} className="bg-surface-card">{c}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted pointer-events-none" />
        </div>

        <div className="relative">
          <select
            className="input-field py-2 text-sm appearance-none pr-8"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => <option key={s} className="bg-surface-card">{s}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted pointer-events-none" />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 glass-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">No need reports found.</p>
          {canCreate && (
            <Link to="/needs/new" className="btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" /> Create one
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((need) => (
            <Link
              key={need.id}
              to={`/needs/${need.id}`}
              className="glass-card p-5 flex flex-col gap-3 hover:border-brand-500/40 transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white group-hover:text-brand-400 transition-colors line-clamp-1">
                  {need.title}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    to={`/needs/${need.id}`}
                    className="p-1.5 rounded-lg hover:bg-surface-border text-slate-400 hover:text-white transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  {canDelete && (
                    <button
                      onClick={(e) => handleDelete(need.id, e)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-400 line-clamp-2">{need.description}</p>

              <div className="flex flex-wrap gap-2 mt-auto">
                <span className="badge-gray">{need.category}</span>
                <span className={statusColor[need.status] ?? 'badge-gray'}>{need.status}</span>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Urgency</span>
                </div>
                <UrgencyBar score={need.urgency_score} />
              </div>

              <p className="text-xs text-slate-500 truncate">📍 {need.location}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
