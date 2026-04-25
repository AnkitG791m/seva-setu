import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVolunteer, updateVolunteer } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Star, MapPin, Loader2, ArrowLeft, Plus, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VolunteerProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vol, setVol]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm]     = useState({ skills: [], preferred_zones: [], is_available: true });
  const [newSkill, setNewSkill] = useState('');
  const [newZone, setNewZone]   = useState('');
  const [saving, setSaving]   = useState(false);

  const isOwner = vol?.userId === user?.id || user?.role === 'COORDINATOR';

  useEffect(() => {
    getVolunteer(id)
      .then((r) => {
        setVol(r.data);
        setForm({ skills: r.data.skills, preferred_zones: r.data.preferred_zones, is_available: r.data.is_available });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateVolunteer(id, form);
      toast.success('Profile updated!');
      setEditing(false);
      const { data } = await getVolunteer(id);
      setVol(data);
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setForm((f) => ({ ...f, skills: [...f.skills, newSkill.trim()] }));
    setNewSkill('');
  };

  const addZone = () => {
    if (!newZone.trim()) return;
    setForm((f) => ({ ...f, preferred_zones: [...f.preferred_zones, newZone.trim()] }));
    setNewZone('');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>;
  if (!vol) return <p className="text-slate-400">Volunteer not found.</p>;

  const statusColor = { PENDING: 'badge-yellow', ACCEPTED: 'badge-blue', COMPLETED: 'badge-green' };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Profile hero */}
      <div className="glass-card p-8">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-2xl bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-3xl flex-shrink-0">
            {vol.user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="page-title">{vol.user?.name}</h1>
            <p className="text-slate-400 text-sm mt-1">{vol.user?.email}</p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(vol.avg_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-surface-muted'}`} />
                ))}
                <span className="text-sm text-slate-400 ml-1">{vol.avg_rating.toFixed(1)} avg rating</span>
              </div>
              <span className={vol.is_available ? 'badge-green' : 'badge-gray'}>
                {vol.is_available ? '🟢 Available' : '⛔ Busy'}
              </span>
            </div>
          </div>
          {isOwner && !editing && (
            <button onClick={() => setEditing(true)} className="btn-secondary text-sm py-2">Edit Profile</button>
          )}
        </div>

        {/* Skills */}
        <div className="mt-6">
          <p className="label">Skills</p>
          {editing ? (
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {form.skills.map((s, i) => (
                  <span key={i} className="badge-gray flex items-center gap-1">
                    {s}
                    <button onClick={() => setForm((f) => ({ ...f, skills: f.skills.filter((_, j) => j !== i) }))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="input-field text-sm py-2 flex-1"
                  placeholder="Add skill (e.g. First Aid)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <button type="button" onClick={addSkill} className="btn-secondary py-2 px-3">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {vol.skills.length === 0
                ? <span className="text-slate-400 text-sm">No skills listed</span>
                : vol.skills.map((s) => <span key={s} className="badge-gray">{s}</span>)
              }
            </div>
          )}
        </div>

        {/* Zones */}
        <div className="mt-4">
          <p className="label">Preferred Zones</p>
          {editing ? (
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {form.preferred_zones.map((z, i) => (
                  <span key={i} className="badge-blue flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{z}
                    <button onClick={() => setForm((f) => ({ ...f, preferred_zones: f.preferred_zones.filter((_, j) => j !== i) }))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="input-field text-sm py-2 flex-1"
                  placeholder="Add zone (e.g. North Delhi)"
                  value={newZone}
                  onChange={(e) => setNewZone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addZone())}
                />
                <button type="button" onClick={addZone} className="btn-secondary py-2 px-3">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {vol.preferred_zones.length === 0
                ? <span className="text-slate-400 text-sm">No zones listed</span>
                : vol.preferred_zones.map((z) => (
                  <span key={z} className="badge-blue flex items-center gap-1"><MapPin className="w-3 h-3" />{z}</span>
                ))
              }
            </div>
          )}
        </div>

        {/* Availability toggle */}
        {editing && (
          <label className="flex items-center gap-3 mt-5 cursor-pointer">
            <div
              onClick={() => setForm((f) => ({ ...f, is_available: !f.is_available }))}
              className={`w-11 h-6 rounded-full transition-colors ${form.is_available ? 'bg-brand-500' : 'bg-surface-muted'} relative`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_available ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-slate-300">Available for assignments</span>
          </label>
        )}

        {editing && (
          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        )}
      </div>

      {/* Task history */}
      <div className="glass-card p-6">
        <h2 className="section-title mb-4">Task History</h2>
        {(!vol.tasks || vol.tasks.length === 0) ? (
          <p className="text-slate-400 text-sm">No tasks yet.</p>
        ) : (
          <div className="space-y-3">
            {vol.tasks.map((t) => (
              <div key={t.id} className="flex items-start justify-between p-4 bg-surface rounded-xl border border-surface-border">
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{t.needReport?.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.needReport?.location}</p>
                  {t.feedback && (
                    <div className="flex items-center gap-1 mt-1.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < t.feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-surface-muted'}`} />
                      ))}
                    </div>
                  )}
                </div>
                <span className={statusColor[t.status] ?? 'badge-gray'}>{t.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
