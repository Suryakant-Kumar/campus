import React, { useState } from 'react';
import {
  Building2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Users,
  AlertCircle,
  Database,
  Lock,
  Layers,
  ChevronRight,
  Cpu,
} from 'lucide-react';
import { Campus } from '../types';
import { registerAdminAndCampus } from '../api';

interface MainSiteLandingProps {
  campuses: Campus[];
  onCampusCreated: (campus: Campus) => void;
  onSelectCampus: (slug: string) => void;
  onOpenFounderLogin: () => void;
}

export const MainSiteLanding: React.FC<MainSiteLandingProps> = ({
  campuses,
  onCampusCreated,
  onSelectCampus,
  onOpenFounderLogin,
}) => {
  const [form, setForm] = useState({
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    campusName: '',
    campusSlug: '',
    campusType: 'university',
    campusDescription: '',
    campusAddress: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successLink, setSuccessLink] = useState<string | null>(null);

  const handleSlugify = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleCampusNameChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      campusName: val,
      campusSlug: prev.campusSlug === '' || prev.campusSlug === handleSlugify(prev.campusName)
        ? handleSlugify(val)
        : prev.campusSlug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await registerAdminAndCampus(form);
      setSuccessLink(res.campusLink);
      onCampusCreated(res.campus);
    } catch (err: any) {
      setError(err.message || 'Failed to register campus and admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.18),rgba(255,255,255,0))]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Tenant Architecture · Gemini Server-Side Triage</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              One platform for every <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">Campus</span> issue
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Admins register on the main site to provision their isolated campus workspace with custom link <code className="text-indigo-300 font-mono text-xs bg-slate-900 px-2 py-0.5 rounded">&lt;campus&gt;.campusconnect.com</code>.
              Users raise issues, AI inspects and triages them, and workers resolve them with complete accountability.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#register-section"
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 flex items-center gap-2 transition"
              >
                <span>Register Your Campus</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={onOpenFounderLogin}
                className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium text-sm flex items-center gap-2 transition cursor-pointer"
              >
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Global Founder Portal</span>
              </button>
            </div>
          </div>

          {/* Feature Badges */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-sm">Tenant Isolation</h3>
              <p className="text-xs text-slate-400 mt-1">
                Zero cross-campus leaks. Roles strictly validated on server tokens.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-sm">Gemini AI Check</h3>
              <p className="text-xs text-slate-400 mt-1">
                Automated clarity scoring, spam detection, urgency ranking, and worker summaries.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-sm">PostgreSQL (Neon)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Stateless backend, zero local files, and Vercel Blob cloud photo storage.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-sm">Cryptographic Security</h3>
              <p className="text-xs text-slate-400 mt-1">
                Scrypt password hashing with per-user salt and 7-day HMAC signed tokens.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Registration & Campuses Directory */}
      <section id="register-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Admin Registration Form (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Register Admin & Provision Campus</h2>
                <p className="text-xs text-slate-400">
                  Admins register first, provision their campus link, and receive full management access.
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {successLink && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Campus Provisioned Successfully!</span>
                </div>
                <p className="text-emerald-200/90">
                  Your campus portal link is ready: <strong className="font-mono text-white underline">{successLink}</strong>.
                  Users will only ever use this link to raise and track issues.
                </p>
                <button
                  onClick={() => onSelectCampus(form.campusSlug)}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer"
                >
                  <span>Open Your Campus Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Section 1: Admin Account */}
              <div className="border-b border-slate-800 pb-5">
                <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
                  1. Admin Account Credentials
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Admin Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Arthur Vance"
                      value={form.adminName}
                      onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-xs outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Admin Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@university.edu"
                      value={form.adminEmail}
                      onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-xs outline-none transition"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Password * (scrypt hashed + salt)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Choose a strong password (min 6 characters)"
                      value={form.adminPassword}
                      onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-xs outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Campus Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  2. Campus Specification
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Campus Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Stanford University"
                      value={form.campusName}
                      onChange={(e) => handleCampusNameChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-xs outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Campus Category *</label>
                    <select
                      value={form.campusType}
                      onChange={(e) => setForm({ ...form, campusType: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-xs outline-none transition"
                    >
                      <option value="university">University</option>
                      <option value="school">School</option>
                      <option value="hostel">Hostel</option>
                      <option value="pg">PG (Paying Guest)</option>
                      <option value="residential_society">Residential Society</option>
                      <option value="other">Other Campus</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Campus Subdomain / Slug *
                    </label>
                    <div className="flex rounded-lg overflow-hidden border border-slate-800 focus-within:border-indigo-500">
                      <input
                        type="text"
                        required
                        placeholder="stanford"
                        value={form.campusSlug}
                        onChange={(e) => setForm({ ...form, campusSlug: handleSlugify(e.target.value) })}
                        className="flex-1 px-3 py-2 bg-slate-950 text-white text-xs font-mono outline-none"
                      />
                      <span className="px-3 py-2 bg-slate-900 text-slate-400 text-xs font-mono border-l border-slate-800 select-none">
                        .campusconnect.com
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Users will only ever use this link to access the campus.
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">Description / Location</label>
                    <input
                      type="text"
                      placeholder="e.g. North Campus, Palo Alto, CA"
                      value={form.campusDescription}
                      onChange={(e) => setForm({ ...form, campusDescription: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-xs outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs tracking-wide shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Provisioning Campus on PostgreSQL...</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    <span>Create Campus & Log In as Admin</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Directory of Active Campuses (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Registered Campuses</span>
                </h3>
                <p className="text-xs text-slate-400">Direct portal links for each campus</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
                {campuses.length} active
              </span>
            </div>

            {campuses.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center">
                <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-300">No campuses registered yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Be the first admin to register a university, school, hostel, or residential society using the form.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {campuses.map((campus) => (
                  <div
                    key={campus.id}
                    className="p-4 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition group relative"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white text-sm group-hover:text-indigo-300 transition">
                            {campus.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 capitalize border border-slate-700/50">
                            {campus.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-indigo-400 mt-1 flex items-center gap-1">
                          <span>{campus.slug}.campusconnect.com</span>
                        </div>
                        {campus.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{campus.description}</p>
                        )}
                      </div>

                      <button
                        onClick={() => onSelectCampus(campus.slug)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-medium flex items-center gap-1 transition shrink-0 cursor-pointer"
                        title="Enter Campus Portal"
                      >
                        <span>Open</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{campus.member_count || 1} members</span>
                      </span>
                      <span className="text-slate-400 font-medium">
                        {campus.open_issues_count ?? 0} open issues
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
