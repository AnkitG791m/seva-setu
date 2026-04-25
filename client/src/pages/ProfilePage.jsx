import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { updateUser } from '../lib/api.js';
import { User, Mail, Phone, Shield, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser(user.id, form);
      toast.success('Profile updated!');
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const roleBadge = {
    COORDINATOR: 'badge-blue',
    VOLUNTEER:   'badge-green',
    FIELD_WORKER:'badge-yellow',
  }[user?.role] ?? 'badge-gray';

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="page-title">My Profile</h1>

      <div className="glass-card p-8 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-brand-500/20 flex items-center justify-center text-brand-400 font-black text-3xl flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <span className={`${roleBadge} mt-1`}>{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="label flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</label>
          <p className="input-field opacity-60 cursor-not-allowed select-none">{user?.email}</p>
        </div>

        {/* Name */}
        <div>
          <label className="label flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Display Name</label>
          <input
            type="text"
            className="input-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="label flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</label>
          <input
            type="tel"
            className="input-field"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        {/* Role (read-only) */}
        <div>
          <label className="label flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Role</label>
          <p className="input-field opacity-60 cursor-not-allowed select-none">{user?.role}</p>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full justify-center py-3">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
