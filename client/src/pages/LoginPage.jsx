import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Leaf, Phone, Chrome, ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../lib/firebase.js';

export default function LoginPage() {
  const { loginWithGoogle, loginWithPhone, verifyOTP } = useAuth();
  const navigate = useNavigate();
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  }, []);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Google से सफलतापूर्वक लॉगिन किया गया!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Google लॉगिन विफल: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (phone.length < 10) {
      toast.error('कृपया सही मोबाइल नंबर दर्ज करें (10 अंक)।');
      return;
    }
    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : '+91' + phone;
      const appVerifier = window.recaptchaVerifier;
      await loginWithPhone(formattedPhone, appVerifier);
      setOtpSent(true);
      toast.success('OTP आपके मोबाइल पर भेजा गया है!');
    } catch (err) {
      toast.error('OTP भेजने में विफल: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      toast.error('कृपया 6 अंकों का OTP दर्ज करें।');
      return;
    }
    setLoading(true);
    try {
      await verifyOTP(otp);
      toast.success('सफलतापूर्वक लॉगिन किया गया!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('OTP गलत है या एक्सपायर हो गया है।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      {/* Background orbs */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl shadow-xl shadow-brand-500/30 mb-4">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">SevaSetu में आपका स्वागत है</h1>
          <p className="text-slate-400 mt-2">स्वयंसेवकों और जरूरतमंदों को जोड़ने का एक मंच</p>
        </div>

        <div className="glass-card p-8">
          {/* Google Start */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full btn-secondary justify-center mb-6 py-3 text-sm"
          >
            <Chrome className="w-4 h-4 text-red-400" />
            Google से साइन इन करें 
            <span className="text-xs text-surface-muted ml-auto">(NGO के लिए)</span>
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-xs text-surface-muted">या (OR)</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          <div id="recaptcha-container"></div>

          {/* OTP Section */}
          {!otpSent ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="label">मोबाइल नंबर</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted" />
                  <input
                    type="tel"
                    className="input-field pl-10"
                    placeholder="अपना मोबाइल नंबर दर्ज करें"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> प्रोसेस हो रहा है…</> : 'OTP भेजें'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="label">OTP दर्ज करें</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted" />
                  <input
                    type="text"
                    className="input-field pl-10 tracking-[0.5em] text-center"
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> जांच हो रही है…</> : 'लॉगिन करें'}
              </button>
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-center text-sm text-slate-400 hover:text-white mt-4"
              >
                नंबर बदलें?
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-400 mt-6">
            खाता नहीं है?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              यहाँ क्लिक करें
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
