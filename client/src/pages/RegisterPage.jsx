import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Leaf, User, Mail, Lock, Phone, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = ['VOLUNTEER', 'FIELD_WORKER', 'COORDINATOR'];

export default function RegisterPage() {
  const { registerWithEmail } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'VOLUNTEER' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await registerWithEmail(form);
      toast.success('Account created! Welcome to SevaSetu 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="fixed top-20 right-20 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl shadow-xl shadow-brand-500/30 mb-4">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Join SevaSetu</h1>
          <p className="text-slate-400 mt-2">Create your account to start helping</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted" />
                <input type="text" className="input-field pl-10" placeholder="Rahul Sharma" {...field('name')} required />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted" />
                <input type="email" className="input-field pl-10" placeholder="you@example.com" {...field('email')} required />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="label">Phone <span className="text-surface-muted font-normal">(optional)</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted" />
                <input type="tel" className="input-field pl-10" placeholder="+91 98765 43210" {...field('phone')} />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="label">Role</label>
              <div className="relative">
                <select className="input-field appearance-none pr-10" {...field('role')}>
                  {ROLES.map((r) => (
                    <option key={r} value={r} className="bg-surface-card">{r.replace('_', ' ')}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted pointer-events-none" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted" />
                <input type="password" className="input-field pl-10" placeholder="Min 6 characters" {...field('password')} required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
