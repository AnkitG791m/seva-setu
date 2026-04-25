import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getVolunteers } from '../lib/api.js';
import { Users, Star, Search, MapPin, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VolunteersPage() {
  const [volunteers, setVols]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [onlyAvail, setOnlyAvail] = useState(false);

  useEffect(() => {
    const params = {};
    if (onlyAvail) params.available = true;
    getVolunteers(params)
      .then((r) => setVols(r.data))
      .catch(() => toast.error('Failed to load volunteers'))
      .finally(() => setLoading(false));
  }, [onlyAvail]);

  const filtered = volunteers.filter((v) =>
    v.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.skills?.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Volunteers</h1>
        <p className="text-slate-400 mt-1">{filtered.length} volunteers</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted" />
          <input
            className="input-field pl-10 py-2 text-sm"
            placeholder="Search by name or skill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyAvail}
            onChange={(e) => setOnlyAvail(e.target.checked)}
            className="accent-brand-500 w-4 h-4"
          />
          Available only
        </label>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 glass-card animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">No volunteers found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <Link
              key={v.id}
              to={`/volunteers/${v.id}`}
              className="glass-card p-5 flex flex-col gap-3 hover:border-brand-500/40 transition-all hover:-translate-y-0.5 group"
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-lg flex-shrink-0">
                  {v.user?.name?.[0]?.toUpperCase() ?? 'V'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white group-hover:text-brand-400 transition-colors truncate">
                    {v.user?.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-slate-400">{v.avg_rating.toFixed(1)}</span>
                  </div>
                </div>
                <span className={`ml-auto flex-shrink-0 ${v.is_available ? 'badge-green' : 'badge-gray'}`}>
                  {v.is_available ? 'Available' : 'Busy'}
                </span>
              </div>

              {/* Skills */}
              {v.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {v.skills.slice(0, 4).map((s) => (
                    <span key={s} className="badge-gray text-[11px] px-2 py-0.5">{s}</span>
                  ))}
                  {v.skills.length > 4 && (
                    <span className="badge-gray text-[11px] px-2 py-0.5">+{v.skills.length - 4}</span>
                  )}
                </div>
              )}

              {/* Zones */}
              {v.preferred_zones.length > 0 && (
                <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  {v.preferred_zones.join(', ')}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
