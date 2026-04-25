import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getNeeds, getVolunteers, getTasks, getMonthlySummary } from '../lib/api.js';
import {
  AlertTriangle, Users, ClipboardList, CheckCircle,
  TrendingUp, ArrowRight, Loader2, Sparkles, Bot
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, color, loading }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-surface-border animate-pulse rounded mt-2" />
      ) : (
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
      )}
    </div>
  );
}

function UrgencyBadge({ score }) {
  if (score >= 8) return <span className="badge-red">🔴 Critical {score}/10</span>;
  if (score >= 5) return <span className="badge-yellow">🟡 Medium {score}/10</span>;
  return <span className="badge-green">🟢 Low {score}/10</span>;
}

function StatusBadge({ status }) {
  const map = { OPEN: 'badge-blue', ASSIGNED: 'badge-yellow', RESOLVED: 'badge-green' };
  return <span className={map[status] ?? 'badge-gray'}>{status}</span>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [needs, setNeeds]       = useState([]);
  const [volunteers, setVols]   = useState([]);
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [aiSummary, setAiSummary] = useState('');

  useEffect(() => {
    Promise.allSettled([getNeeds(), getVolunteers(), getTasks(), getMonthlySummary()])
      .then(([n, v, t, report]) => {
        if (n.status === 'fulfilled') setNeeds(n.value.data);
        if (v.status === 'fulfilled') setVols(v.value.data);
        if (t.status === 'fulfilled') setTasks(t.value.data);
        if (report.status === 'fulfilled') setAiSummary(report.value.data.narrative);
      })
      .finally(() => setLoading(false));
  }, []);

  const open       = needs.filter((n) => n.status === 'OPEN').length;
  const resolved   = needs.filter((n) => n.status === 'RESOLVED').length;
  const available  = volunteers.filter((v) => v.is_available).length;
  const pending    = tasks.filter((t) => t.status === 'PENDING').length;

  const topNeeds = [...needs]
    .sort((a, b) => b.urgency_score - a.urgency_score)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Welcome back, <span className="text-brand-400 font-semibold">{user?.name}</span>
        </p>
      </div>

      {/* AI Intelligence Summary */}
      {!loading && aiSummary && (
        <div className="glass-card overflow-hidden relative border-indigo-500/30 bg-gradient-to-br from-indigo-900/10 to-surface">
          <div className="absolute top-0 right-0 py-1.5 px-3 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider rounded-bl-lg border-b border-l border-indigo-500/20 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Gemini Intelligence
          </div>
          <div className="p-5 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white mb-2">Live Crisis Overview</h3>
              <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                {aiSummary.split('\n')[0]} {/* Just show the first paragraph for brevity in dashboard */}
              </p>
              <Link to="/impact" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 mt-3 hover:text-indigo-300 transition-colors">
                Read Full AI Analysis <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open Needs"       value={open}      icon={AlertTriangle}  color="bg-red-500/15 text-red-400"    loading={loading} />
        <StatCard label="Available Vols."  value={available} icon={Users}          color="bg-brand-500/15 text-brand-400" loading={loading} />
        <StatCard label="Pending Tasks"    value={pending}   icon={ClipboardList}  color="bg-yellow-500/15 text-yellow-400" loading={loading} />
        <StatCard label="Resolved"         value={resolved}  icon={CheckCircle}    color="bg-cyan-500/15 text-cyan-400"  loading={loading} />
      </div>

      {/* Top urgent needs */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-400" />
            <h2 className="section-title">Most Urgent Needs</h2>
          </div>
          <Link to="/needs" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-surface-border/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : topNeeds.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No needs reported yet.</p>
        ) : (
          <div className="space-y-3">
            {topNeeds.map((need) => (
              <Link
                key={need.id}
                to={`/needs/${need.id}`}
                className="flex items-start justify-between p-4 rounded-xl bg-surface hover:bg-surface-border/40 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white group-hover:text-brand-400 transition-colors truncate">
                    {need.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{need.location} · {need.category}</p>
                </div>
                <div className="flex flex-col items-end gap-1 ml-4 flex-shrink-0">
                  <UrgencyBadge score={need.urgency_score} />
                  <StatusBadge status={need.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent tasks */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-yellow-400" />
            <h2 className="section-title">Recent Tasks</h2>
          </div>
          <Link to="/tasks" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-surface-border/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No tasks yet.</p>
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => {
              const statusColor = { PENDING: 'badge-yellow', ACCEPTED: 'badge-blue', COMPLETED: 'badge-green' }[task.status];
              return (
                <Link
                  key={task.id}
                  to={`/needs/${task.needReportId}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-surface hover:bg-surface-border/40 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white group-hover:text-brand-400 transition-colors truncate">
                      {task.needReport?.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Volunteer: {task.volunteer?.user?.name}
                    </p>
                  </div>
                  <span className={statusColor}>{task.status}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
