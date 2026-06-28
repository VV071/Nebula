import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const { t } = useTranslation();
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);
      if (error) setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

      {/* ── AURORA BACKGROUND ── */}
      <div className="absolute inset-0 -z-10"
        style={{ backgroundColor: '#060609' }}
      />

      {/* Animated mesh gradient orbs */}
      <div
        className="absolute -z-10 animate-float"
        style={{
          top: '-10%', left: '-5%',
          width: '600px', height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 65%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute -z-10 animate-float-delayed"
        style={{
          top: '10%', right: '-10%',
          width: '500px', height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 65%)',
          filter: 'blur(50px)',
        }}
      />
      <div
        className="absolute -z-10"
        style={{
          bottom: '-5%', left: '30%',
          width: '400px', height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 65%)',
          filter: 'blur(60px)',
          animation: 'float 9s ease-in-out infinite 1s',
        }}
      />
      <div
        className="absolute -z-10"
        style={{
          bottom: '20%', right: '10%',
          width: '350px', height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 65%)',
          filter: 'blur(50px)',
          animation: 'float 11s ease-in-out infinite 3s',
        }}
      />

      {/* Grid noise texture */}
      <div
        className="absolute inset-0 -z-10 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="w-full max-w-md">

        {/* ── LOGO + TAGLINE ── */}
        <div className="text-center mb-8">
          <div className="inline-flex relative mb-6">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-2xl animate-pulse-glow opacity-60"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', filter: 'blur(16px)', borderRadius: '1rem' }}
            />
            <div
              className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)',
                boxShadow: '0 8px 32px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {/* Stitch border on logo */}
              <span
                className="absolute inset-[4px] rounded-xl pointer-events-none"
                style={{ border: '1.5px dashed rgba(255,255,255,0.3)', borderRadius: '12px' }}
              />
              <Sparkles className="w-9 h-9 text-white" />
            </div>
          </div>

          <h1
            className="text-4xl font-bold mb-2 tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t('app.name')}
          </h1>
          <p className="text-sm font-medium uppercase tracking-widest text-indigo-400/80">
            {t('app.tagline')}
          </p>
        </div>

        {/* ── GLASS AUTH CARD ── */}
        <div
          className="relative rounded-card-xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(32px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* Stitch inner border */}
          <span
            className="absolute inset-[8px] pointer-events-none z-0"
            style={{
              border: '1.5px dashed rgba(129,140,248,0.2)',
              borderRadius: '14px',
            }}
          />

          {/* Corner stitch dots */}
          {[
            { top: '14px', left: '14px' },
            { top: '14px', right: '14px' },
            { bottom: '14px', left: '14px' },
            { bottom: '14px', right: '14px' },
          ].map((pos, i) => (
            <span key={i} className="absolute w-1.5 h-1.5 rounded-full pointer-events-none z-10"
              style={{
                background: 'rgba(129,140,248,0.4)',
                boxShadow: '0 0 6px rgba(129,140,248,0.4)',
                ...pos,
              }}
            />
          ))}

          <div className="relative z-10 p-8">

            {/* Tab switcher */}
            <div className="flex p-1 mb-8 rounded-button"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {['Sign In', 'Sign Up'].map((label, i) => {
                const active = isSignUp === (i === 1);
                return (
                  <button
                    key={label}
                    onClick={() => { setIsSignUp(i === 1); setError(''); }}
                    className="flex-1 py-2 px-4 rounded-[10px] text-sm font-semibold transition-all duration-300 relative overflow-hidden"
                    style={active ? {
                      background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                    } : {
                      color: 'rgba(161,161,187,1)',
                      background: 'transparent',
                    }}
                  >
                    {active && (
                      <span className="absolute inset-[3px] rounded-[8px] pointer-events-none"
                        style={{ border: '1px dashed rgba(255,255,255,0.2)' }}
                      />
                    )}
                    <span className="relative z-10">{label}</span>
                  </button>
                );
              })}
            </div>

            <h2 className="text-xl font-bold mb-6" style={{ color: 'rgba(244,244,255,0.95)' }}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>

            {/* Error message */}
            {error && (
              <div
                className="mb-5 p-3.5 rounded-button text-sm"
                style={{
                  background: 'rgba(244,63,94,0.08)',
                  border: '1px solid rgba(244,63,94,0.2)',
                  color: '#FB7185',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'rgba(161,161,187,0.8)' }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: 'rgba(129,140,248,0.7)' }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-button text-sm font-medium transition-all duration-200 focus:outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(244,244,255,0.95)',
                    }}
                    placeholder="you@example.com"
                    required
                    onFocus={e => {
                      e.target.style.borderColor = 'rgba(129,140,248,0.5)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
                      e.target.style.background = 'rgba(255,255,255,0.09)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = 'rgba(255,255,255,0.06)';
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'rgba(161,161,187,0.8)' }}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: 'rgba(129,140,248,0.7)' }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 rounded-button text-sm font-medium transition-all duration-200 focus:outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(244,244,255,0.95)',
                    }}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    onFocus={e => {
                      e.target.style.borderColor = 'rgba(129,140,248,0.5)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
                      e.target.style.background = 'rgba(255,255,255,0.09)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = 'rgba(255,255,255,0.06)';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'rgba(129,140,248,0.6)' }}
                  >
                    {showPassword
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-button text-sm font-bold text-white transition-all duration-300 relative overflow-hidden group mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: loading
                    ? 'rgba(99,102,241,0.5)'
                    : 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                {/* Stitch inner border on button */}
                {!loading && (
                  <span className="absolute inset-[3px] rounded-[9px] pointer-events-none"
                    style={{ border: '1px dashed rgba(255,255,255,0.25)' }}
                  />
                )}
                {/* Shine overlay */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating…</span>
                    </>
                  ) : (
                    <>
                      <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Demo hint */}
            <div
              className="mt-6 p-3.5 rounded-button flex items-start gap-3"
              style={{
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(129,140,248,0.12)',
              }}
            >
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#818CF8' }} />
              <p className="text-xs" style={{ color: 'rgba(161,161,187,0.8)' }}>
                Demo: Use any email and password (min 6 characters)
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: 'rgba(99,102,241,0.5)' }}>
          © 2025 {t('app.name')} · Mindful Finance
        </p>
      </div>
    </div>
  );
}
