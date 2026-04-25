import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTasks, updateTaskStatus } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ClipboardList, CheckCheck, Play, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['All', 'PENDING', 'ACCEPTED', 'COMPLETED'];

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('All');

  const isVolunteer = user?.role === 'VOLUNTEER';

  const load = async () => {
    setLoading(true);
    try {
      const params = filter !== 'All' ? { status: filter } : {};
      const { data } = await getTasks(params);
      setTasks(data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const handleStatus = async (taskId, status) => {
    try {
      await updateTaskStatus(taskId, status);
      toast.success(`Marked as ${status}`);
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const statusColor = { PENDING: 'badge-yellow', ACCEPTED: 'badge-blue', COMPLETED: 'badge-green' };
  const urgencyColor = (s) => s >= 8 ? 'text-red-400' : s >= 5 ? 'text-yellow-400' : 'text-brand-400';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="text-slate-400 mt-1">{tasks.length} tasks</p>
        </div>

        <div className="relative">
          <select
            className="input-field py-2 text-sm appearance-none pr-8"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {STATUSES.map((s) => <option key={s} className="bg-surface-card">{s}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 glass-card animate-pulse" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <ClipboardList className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">No tasks found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/needs/${task.needReportId}`}
                  className="font-semibold text-white hover:text-brand-400 transition-colors line-clamp-1"
                >
                  {task.needReport?.title}
                </Link>
                <p className="text-sm text-slate-400 mt-0.5">
                  Volunteer: <span className="text-slate-300">{task.volunteer?.user?.name}</span>
                </p>
                <p className={`text-xs mt-1 font-semibold ${urgencyColor(task.needReport?.urgency_score ?? 0)}`}>
                  Urgency: {task.needReport?.urgency_score}/10
                </p>
              </div>

              {/* Status + actions */}
              <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                <span className={statusColor[task.status] ?? 'badge-gray'}>{task.status}</span>

                {isVolunteer && task.status === 'PENDING' && (
                  <button onClick={() => handleStatus(task.id, 'ACCEPTED')} className="btn-primary text-xs py-1.5 px-3">
                    <Play className="w-3.5 h-3.5" /> Accept
                  </button>
                )}
                {isVolunteer && task.status === 'ACCEPTED' && (
                  <button onClick={() => handleStatus(task.id, 'COMPLETED')} className="btn-primary text-xs py-1.5 px-3">
                    <CheckCheck className="w-3.5 h-3.5" /> Complete
                  </button>
                )}

                <p className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(task.assigned_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
