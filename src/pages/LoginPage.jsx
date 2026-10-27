import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Eye, EyeOff, Lock, Mail, ShieldCheck, UsersRound, Wallet } from 'lucide-react';
import { login } from '../features/auth/authSlice';

// Decorative bar cluster, as on the dashboard's stat cards (heights in px).
const BARS = [22, 30, 18, 34, 26, 38, 24];

const FEATURES = [
  { icon: UsersRound, title: 'Maids & customers', text: 'Review applications and manage profiles' },
  { icon: Wallet, title: 'Payments & invoices', text: 'Track revenue and download tax invoices' },
  { icon: BarChart3, title: 'Insights', text: 'Monthly revenue and platform activity at a glance' },
];

const inputClass =
  'w-full rounded-2xl border border-gray-200 bg-gray-50/60 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, status, error } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const loading = status === 'loading';

  if (token) {
    return <Navigate to={location.state?.from?.pathname || '/'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      navigate(location.state?.from?.pathname || '/', { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen bg-brand-50/40">
      {/* Brand panel — large screens only */}
      <aside className="relative hidden w-[46%] max-w-2xl overflow-hidden bg-gradient-to-br from-brand-500 via-brand-500 to-brand-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-white/10" aria-hidden="true" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider ring-1 ring-inset ring-white/25">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin Panel
          </span>
          <h2 className="mt-6 max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Everything Pickmymaid, in one place.
          </h2>
          <p className="mt-3 max-w-md text-base text-white/80">
            Manage maids, customers, payments and content from a single dashboard.
          </p>
        </div>

        <div className="relative space-y-6">
          {/* Mock stat card in the dashboard's style */}
          <div className="max-w-sm rounded-3xl bg-white p-5 text-gray-900 shadow-2xl shadow-brand-900/30" aria-hidden="true">
            <span className="flex items-center gap-2 text-sm text-gray-700">
              <BarChart3 className="h-4 w-4 text-gray-800" strokeWidth={1.75} />
              Platform activity
            </span>
            <span className="mt-6 flex items-end justify-between gap-3">
              <span className="space-y-2">
                <span className="block h-2.5 w-28 rounded-full bg-gray-200" />
                <span className="block h-2.5 w-16 rounded-full bg-brand-100" />
              </span>
              <span className="flex items-end gap-1">
                {BARS.map((h, i) => (
                  <span key={i} className="w-1.5 rounded-full bg-brand-500" style={{ height: h }} />
                ))}
              </span>
            </span>
          </div>

          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/25">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-sm text-white/75">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Sign-in */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-gray-200/70 bg-white p-7 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_20px_50px_-20px_rgba(242,113,29,0.25)] sm:p-9">
            <img src="/Logo.png" alt="Pickmymaid" className="h-14 w-auto" />

            <h1 className="mt-8 text-2xl font-semibold tracking-tight text-gray-900">Welcome back</h1>
            <p className="mt-1 text-sm text-gray-500">Sign in to the Pickmymaid admin panel.</p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@pickmymaid.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p role="alert" className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:bg-brand-600 hover:shadow-brand-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">© {new Date().getFullYear()} Pickmymaid · Admin access only</p>
        </div>
      </main>
    </div>
  );
}
