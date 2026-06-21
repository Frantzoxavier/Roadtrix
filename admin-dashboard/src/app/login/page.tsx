'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Truck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-accent-900 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-gradient-to-br from-accent-900 to-accent-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-accent" />
          </div>
          <span className="text-white font-bold text-2xl">RoadTrix</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Transportation<br />
            <span className="text-accent">Operations</span><br />
            Platform
          </h1>
          <p className="text-white/50 text-lg leading-relaxed">
            Dispatch smarter. Track in real-time.<br />
            Maximize every load.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'Active Drivers', value: '24/7' },
            { label: 'Load Tracking', value: 'Live' },
            { label: 'Profit Margin', value: '32%' },
          ].map((stat) => (
            <div key={stat.label} className="border border-white/10 rounded-xl p-4">
              <p className="text-white font-bold text-xl">{stat.value}</p>
              <p className="text-white/40 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-primary-900">RoadTrix</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Sign in</h2>
          <p className="text-slate-500 text-sm mb-8">Enter your credentials to access the dashboard</p>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-6">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@roadtrix.com"
                className="input"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {isLoading ? <Spinner size="sm" /> : 'Sign in to dashboard'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-slate-100 rounded-xl">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Demo credentials</p>
            <div className="space-y-1">
              <p className="text-xs text-slate-600"><span className="font-medium">Admin:</span> admin@roadtrix.com / Admin@123</p>
              <p className="text-xs text-slate-600"><span className="font-medium">Dispatcher:</span> dispatcher@roadtrix.com / Dispatch@123</p>
              <p className="text-xs text-slate-600"><span className="font-medium">Driver:</span> james.rodriguez@roadtrix.com / Driver@123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
