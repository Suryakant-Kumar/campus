import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Building2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { loginUser, registerUser } from '../api';
import { Campus, User } from '../types';

interface CampusAuthModalProps {
  campus: Campus | null;
  initialMode: 'login' | 'register' | 'founder';
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, campus: Campus | null) => void;
}

export const CampusAuthModal: React.FC<CampusAuthModalProps> = ({
  campus,
  initialMode,
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'founder'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [founderSecret, setFounderSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login' || mode === 'founder') {
        const res = await loginUser({
          email: email.trim(),
          password,
          campusSlug: campus ? campus.slug : undefined,
        });
        onAuthSuccess(res.user, res.campus);
        onClose();
      } else {
        if (!campus) {
          throw new Error('Campus context required for registration.');
        }
        const res = await registerUser({
          email: email.trim(),
          password,
          name: name.trim(),
          campusSlug: campus.slug,
          department: department.trim() || undefined,
          phone: phone.trim() || undefined,
        });
        onAuthSuccess(res.user, res.campus);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {mode === 'founder' ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Global Founder Login</span>
                </>
              ) : mode === 'register' ? (
                <>
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Join {campus ? campus.name : 'Campus'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-indigo-400" />
                  <span>Sign In · {campus ? campus.name : 'CampusConnect'}</span>
                </>
              )}
            </h3>
            {campus && (
              <p className="text-[11px] font-mono text-indigo-400 mt-0.5">
                {campus.slug}.campusconnect.com
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                />
                <UserIcon className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">Email Address *</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="user@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
              />
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Password * (scrypt)</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
              />
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Department / Room</label>
                <input
                  type="text"
                  placeholder="e.g. Block C, Room 204"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold shadow transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : mode === 'register' ? (
              <>
                <span>Create Campus Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          {mode === 'login' ? (
            campus && (
              <>
                <span>Don't have an account on this campus?</span>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-indigo-400 hover:underline font-semibold"
                >
                  Sign Up
                </button>
              </>
            )
          ) : mode === 'register' ? (
            <>
              <span>Already registered?</span>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-indigo-400 hover:underline font-semibold"
              >
                Sign In
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-slate-400 hover:text-white"
            >
              Back to Campus Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
