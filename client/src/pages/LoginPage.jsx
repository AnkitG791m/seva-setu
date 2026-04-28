import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Leaf, Loader2, Mail, Lock, Eye, EyeOff, UserPlus, LogIn, UserCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, register, continueAsGuest } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [name, setName]             = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [role, setRole]             = useState('VOLUNTEER');
  const [loading, setLoading]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register({ email, password, name, role });
        toast.success(`Welcome, ${name || email}! Account created.`);
      } else {
        const user = await login(email, password);
        toast.success(`Welcome back, ${user.name || user.email}!`);
      }
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Authentication failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    toast('Browsing as Guest. Some features may be limited.', { icon: '👋' });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-500/10 border border-brand-500/20 mb-5 shadow-2xl shadow-brand-500/10">
            <Leaf className="w-10 h-10 text-brand-500" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">SevaSetu</h1>
          <p className="text-slate-400 mt-2 text-sm">Community Disaster Relief Platform</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">

          {/* Login / Register Toggle */}
          <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-2xl mb-8">
            <button onClick={() => setIsRegister(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${!isRegister ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              <LogIn className="w-4 h-4" /> Login
            </button>
            <button onClick={() => setIsRegister(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${isRegister ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              <UserPlus className="w-4 h-4" /> Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1.5">Full Name</label>
                <input type="text" placeholder="Ankit Kumar" value={name} onChange={e => setName(e.target.value)} required
                  className="w-full bg-slate-900/80 border border-slate-700/50 text-white p-3.5 rounded-xl focus:outline-none focus:border-brand-500 transition-all placeholder:text-slate-600" />
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input type="email" placeholder="name@email.com" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full bg-slate-900/80 border border-slate-700/50 text-white p-3.5 pl-10 rounded-xl focus:outline-none focus:border-brand-500 transition-all placeholder:text-slate-600" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required minLength={6}
                  className="w-full bg-slate-900/80 border border-slate-700/50 text-white p-3.5 pl-10 rounded-xl focus:outline-none focus:border-brand-500 transition-all placeholder:text-slate-600" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1.5">Your Role</label>
                <select value={role} onChange={e => setRole(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/50 text-white p-3.5 rounded-xl focus:outline-none focus:border-brand-500 transition-all">
                  <option value="VOLUNTEER">Volunteer (Disaster Relief)</option>
                  <option value="COORDINATOR">NGO Coordinator</option>
                  <option value="FIELD_WORKER">Field Worker</option>
                </select>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 mt-2">
              {loading
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : isRegister
                  ? <><UserPlus className="w-5 h-5" /> Create Account</>
                  : <><LogIn className="w-5 h-5" /> Login</>
              }
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-slate-700/50" />
            <span className="text-slate-600 text-xs font-bold uppercase tracking-widest">or</span>
            <div className="h-px flex-1 bg-slate-700/50" />
          </div>

          {/* Guest Button */}
          <button onClick={handleGuest}
            className="w-full bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-300 hover:text-white font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2">
            <UserCheck className="w-5 h-5" />
            Continue as Guest
            <ArrowRight className="w-4 h-4 ml-1 opacity-60" />
          </button>
          <p className="text-center text-slate-600 text-xs mt-3">Guest access has limited features</p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">Demo Credentials</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span className="text-brand-400 font-semibold">Admin</span>
              <span>admin@sevasetu.app / SevaSetu@2026</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span className="text-emerald-400 font-semibold">Volunteer</span>
              <span>demo@sevasetu.app / Demo@12345</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span className="text-orange-400 font-semibold">Field Worker</span>
              <span>field@sevasetu.app / Field@12345</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
