import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNeed, createTask, getVolunteers, updateTaskStatus, submitFeedback, analyseUrgency, suggestVolunteers, smartAssignTask } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  MapPin, Clock, Zap, Bot, Users, CheckCheck, Star,
  ChevronDown, Loader2, ArrowLeft, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

function Section({ title, icon: Icon, children }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-brand-400" />
        <h2 className="section-title">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function NeedDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [need, setNeed]               = useState(null);
  const [volunteers, setVols]         = useState([]);
  const [selectedVol, setSelectedVol] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [feedback, setFeedback]       = useState({ rating: 5, comment: '' });
  const [loadingNeed, setLoadingNeed] = useState(true);
  const [loadingAI, setLoadingAI]     = useState(false);
  const [assigning, setAssigning]     = useState(false);

  const isCoordinator = user?.role === 'COORDINATOR';

  const load = async () => {
    setLoadingNeed(true);
    try {
      const [needRes, volRes] = await Promise.all([getNeed(id), getVolunteers({ available: true })]);
      setNeed(needRes.data);
      setVols(volRes.data);
    } catch {
      toast.error('Failed to load need report');
    } finally {
      setLoadingNeed(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleAssign = async () => {
    if (!selectedVol) { toast.error('Select a volunteer'); return; }
    setAssigning(true);
    try {
      await createTask({ needReportId: id, volunteerId: selectedVol });
      toast.success('Volunteer assigned!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusUpdate = async (taskId, status) => {
    try {
      await updateTaskStatus(taskId, status);
      toast.success(`Task marked as ${status}`);
      load();
    } catch {
      toast.error('Status update failed');
    }
  };

  const handleFeedback = async (taskId) => {
    try {
      await submitFeedback({ taskId, ...feedback });
      toast.success('Feedback submitted!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Feedback failed');
    }
  };

  const handleAISuggest = async () => {
    setLoadingAI(true);
    try {
      const { data } = await suggestVolunteers(id);
      setAiSuggestion(data.suggestion);
    } catch {
      toast.error('AI suggestion failed');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSmartMatch = async () => {
    setAssigning(true);
    try {
      const { data } = await smartAssignTask(id);
      toast.success(`Smart Match Success: ${data.task.volunteer.user.name} assigned! ✨`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Smart matching failed');
    } finally {
      setAssigning(false);
    }
  };

  const handleReanalyse = async () => {
    setLoadingAI(true);
    try {
      const { data } = await analyseUrgency(id);
      setNeed(data);
      toast.success('Urgency re-analysed by Gemini ✨');
    } catch {
      toast.error('Re-analysis failed');
    } finally {
      setLoadingAI(false);
    }
  };

  if (loadingNeed) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (!need) return <p className="text-slate-400">Need not found.</p>;

  const urgencyColor = need.urgency_score >= 8 ? 'text-red-400' : need.urgency_score >= 5 ? 'text-yellow-400' : 'text-brand-400';
  const task = need.tasks?.[0];
  const myTask = need.tasks?.find((t) => t.volunteer?.user?.id === user?.id);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Hero card */}
      <div className="glass-card p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="badge-gray mb-3 inline-block">{need.category}</span>
            <h1 className="page-title">{need.title}</h1>
            <p className="flex items-center gap-1.5 text-slate-400 text-sm mt-2">
              <MapPin className="w-4 h-4" /> {need.location}
            </p>
          </div>
          <div className={`text-4xl font-extrabold ${urgencyColor}`}>{need.urgency_score}<span className="text-lg text-slate-400">/10</span></div>
        </div>

        <p className="text-slate-300 mt-6 leading-relaxed">{need.description}</p>

        {need.photo_url && (
          <img src={need.photo_url} alt="Need" className="mt-6 rounded-xl w-full max-h-64 object-cover" />
        )}

        {need.gemini_reason && (
          <div className="mt-6 flex gap-3 bg-brand-500/10 border border-brand-500/20 rounded-xl p-4">
            <Bot className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-brand-400 font-semibold uppercase tracking-wide mb-1">Gemini Analysis</p>
              <p className="text-sm text-slate-300">{need.gemini_reason}</p>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500 mt-4 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          Reported {new Date(need.created_at).toLocaleString()}
        </p>
      </div>

      {/* AI Actions (Coordinator) */}
      {isCoordinator && (
        <Section title="AI Tools" icon={Bot}>
          <div className="flex flex-wrap gap-3 mb-4">
            <button onClick={handleReanalyse} disabled={loadingAI} className="btn-secondary text-sm">
              {loadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-yellow-400" />}
              Re-analyse Urgency
            </button>
            <button onClick={handleAISuggest} disabled={loadingAI} className="btn-secondary text-sm">
              {loadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4 text-brand-400" />}
              Suggest Volunteers
            </button>
          </div>
          {aiSuggestion && (
            <div className="bg-surface rounded-xl p-4 text-sm text-slate-300 whitespace-pre-wrap border border-surface-border">
              {aiSuggestion}
            </div>
          )}
        </Section>
      )}

      {/* Assignment (Coordinator) */}
        <Section title="Assign Volunteer" icon={Users}>
          <div className="flex flex-col gap-6">
            {/* Smart Match Button */}
            <div className="bg-brand-500/5 border border-brand-500/20 rounded-2xl p-5 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-brand-400" />
              </div>
              <div>
                <p className="font-bold text-white">AI Smart Match & Notify</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[250px]">Gemini will find the best nearby volunteer and send a push notification instantly.</p>
              </div>
              <button 
                onClick={handleSmartMatch} 
                disabled={assigning}
                className="btn-primary w-full max-w-[200px] h-11 bg-gradient-to-r from-brand-500 to-indigo-500 border-none shadow-lg shadow-brand-500/20 hover:scale-[1.02] transition-transform"
              >
                {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Auto-Assign Now
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-surface-border"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface-card px-2 text-slate-500 font-semibold tracking-tight">Or Manual Selection</span>
              </div>
            </div>

            {volunteers.length === 0 ? (
              <p className="text-slate-400 text-sm text-center">No available volunteers at this time.</p>
            ) : (
              <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <select
                    className="input-field appearance-none pr-8 text-sm"
                    value={selectedVol}
                    onChange={(e) => setSelectedVol(e.target.value)}
                  >
                    <option value="" className="bg-surface-card">Select a volunteer…</option>
                    {volunteers.map((v) => (
                      <option key={v.id} value={v.id} className="bg-surface-card">
                        {v.user?.name} — ⭐ {v.avg_rating} · {v.skills.join(', ') || 'No skills'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted pointer-events-none" />
                </div>
                <button onClick={handleAssign} disabled={assigning || !selectedVol} className="btn-secondary text-sm">
                  {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                  Assign Manually
                </button>
              </div>
            )}
          </div>
        </Section>

      {/* Volunteer task actions */}
      {myTask && myTask.status !== 'COMPLETED' && (
        <Section title="Your Task" icon={CheckCheck}>
          <div className="flex gap-3">
            {myTask.status === 'PENDING' && (
              <button onClick={() => handleStatusUpdate(myTask.id, 'ACCEPTED')} className="btn-primary text-sm">
                Accept Task
              </button>
            )}
            {myTask.status === 'ACCEPTED' && (
              <button onClick={() => handleStatusUpdate(myTask.id, 'COMPLETED')} className="btn-primary text-sm">
                Mark Completed
              </button>
            )}
          </div>
        </Section>
      )}

      {/* Feedback */}
      {task?.status === 'COMPLETED' && !task?.feedback && (
        <Section title="Submit Feedback" icon={Star}>
          <div className="space-y-4">
            <div>
              <label className="label">Rating (1–5)</label>
              <input
                type="number" min={1} max={5}
                className="input-field w-24"
                value={feedback.rating}
                onChange={(e) => setFeedback({ ...feedback, rating: +e.target.value })}
              />
            </div>
            <div>
              <label className="label">Comment</label>
              <textarea
                className="input-field resize-none"
                rows={3}
                placeholder="How did the volunteer perform?"
                value={feedback.comment}
                onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
              />
            </div>
            <button onClick={() => handleFeedback(task.id)} className="btn-primary text-sm">
              Submit Feedback
            </button>
          </div>
        </Section>
      )}

      {/* Existing feedback */}
      {task?.feedback && (
        <Section title="Feedback" icon={Star}>
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-5 h-5 ${i < task.feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-surface-muted'}`} />
            ))}
            <span className="text-sm text-slate-400 ml-1">{task.feedback.rating}/5</span>
          </div>
          {task.feedback.comment && <p className="text-sm text-slate-300 mt-2">{task.feedback.comment}</p>}
        </Section>
      )}
    </div>
  );
}
