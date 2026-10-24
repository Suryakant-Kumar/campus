import React, { useState } from 'react';
import {
  Building2,
  Shield,
  User as UserIcon,
  LogOut,
  Sparkles,
  ChevronDown,
  Layers,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { Campus, User, UserRole } from '../types';

interface NavbarProps {
  currentCampus: Campus | null;
  currentUser: User | null;
  onLogout: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  campusesList: Campus[];
  onSelectCampus: (slug: string | null) => void;
}

const ROLE_COLORS: Record<UserRole, { bg: string; text: string; label: string }> = {
  founder: { bg: 'bg-rose-500/20 border-rose-500/40', text: 'text-rose-300', label: 'Founder (Global)' },
  admin: { bg: 'bg-purple-500/20 border-purple-500/40', text: 'text-purple-300', label: 'Admin' },
  co_admin: { bg: 'bg-cyan-500/20 border-cyan-500/40', text: 'text-cyan-300', label: 'Co-Admin' },
  worker: { bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-300', label: 'Staff Worker' },
  user: { bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-300', label: 'Member' },
};

export const Navbar: React.FC<NavbarProps> = ({
  currentCampus,
  currentUser,
  onLogout,
  onOpenAuth,
  campusesList,
  onSelectCampus,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Campus Link */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectCampus(null)}
            className="flex items-center gap-2.5 text-left group transition cursor-pointer"
            title="Go to CampusConnect Main Site"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20 group-hover:scale-105 transition">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-tight">CampusConnect</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI Triage
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <span>Multi-Campus Engine</span>
              </p>
            </div>
          </button>

          {/* Current Campus Subdomain Tag */}
          {currentCampus && (
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-semibold text-white">{currentCampus.name}</span>
                <span className="font-mono text-indigo-400 text-[11px]">
                  ({currentCampus.slug}.campusconnect.com)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Center / Campus Quick Switcher */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentCampus ? `Campus: ${currentCampus.name}` : 'Explore Campuses'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Campus Portals
                </div>
                <button
                  onClick={() => {
                    onSelectCampus(null);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                    !currentCampus ? 'bg-indigo-600/20 text-indigo-300 font-medium' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>Main Landing & Register</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </button>
                <div className="my-1 border-t border-slate-800"></div>
                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  {campusesList.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-slate-500">No campuses registered yet.</div>
                  ) : (
                    campusesList.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          onSelectCampus(c.slug);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                          currentCampus?.slug === c.slug
                            ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-white">{c.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{c.slug}.campusconnect.com</div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">
                          {c.type.replace('_', ' ')}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Stateless Poll (5s)</span>
          </div>
        </div>

        {/* User Status / Actions */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-white flex items-center justify-end gap-1.5">
                  <span>{currentUser.name}</span>
                </div>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
                      ROLE_COLORS[currentUser.role]?.bg || 'bg-slate-800 border-slate-700'
                    } ${ROLE_COLORS[currentUser.role]?.text || 'text-slate-300'}`}
                  >
                    {ROLE_COLORS[currentUser.role]?.label || currentUser.role}
                  </span>
                  {currentUser.department && (
                    <span className="text-[10px] text-slate-400">· {currentUser.department}</span>
                  )}
                </div>
              </div>

              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 text-xs font-medium transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
