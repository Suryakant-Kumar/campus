import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Database,
  Radio,
  BarChart2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { FounderAnalytics, User } from '../types';
import { getFounderCampuses, getFounderAnalytics } from '../api';

interface FounderDashboardProps {
  currentUser: User;
  onSelectCampus: (slug: string) => void;
  onExit: () => void;
}

export const FounderDashboard: React.FC<FounderDashboardProps> = ({
  currentUser,
  onSelectCampus,
  onExit,
}) => {
  const [campuses, setCampuses] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<FounderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFounderData();
  }, []);

  const loadFounderData = async () => {
    setLoading(true);
    try {
      const [campusesData, statsData] = await Promise.all([
        getFounderCampuses(),
        getFounderAnalytics(),
      ]);
      setCampuses(campusesData);
      setAnalytics(statsData);
    } catch (err) {
      console.error('Failed to load founder dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Global Platform Founder Headquarters
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global clearance: Inspecting all tenant campuses across the entire CampusConnect platform.
          </p>
        </div>

        <button
          onClick={onExit}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium transition cursor-pointer"
        >
          Exit to Main Portal
        </button>
      </div>

      {/* Global Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Campuses</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {analytics?.totalCampuses ?? campuses.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Universities, hostels, societies</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Users</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold text-sky-400 mt-2">
            {analytics?.totalUsers ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Students, staff, & workers</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Issues Raised</span>
            <BarChart2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">
            {analytics?.totalIssues ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across all campuses</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Resolved Issues</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">
            {analytics?.resolvedIssues ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Closed with verification</div>
        </div>
      </div>

      {/* Cross-Campus Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>All Registered Campuses</span>
          </h2>
          <button
            onClick={loadFounderData}
            className="text-xs text-indigo-400 hover:underline"
          >
            Refresh Data
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Campus Name</th>
                <th className="py-3 px-4">Dedicated Link</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Members</th>
                <th className="py-3 px-4">Workers</th>
                <th className="py-3 px-4">Issues</th>
                <th className="py-3 px-4">Critical</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {campuses.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div>{c.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{c.contact_email}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-indigo-400">
                    {c.slug}.campusconnect.com
                  </td>
                  <td className="py-3.5 px-4 capitalize">
                    {c.type.replace('_', ' ')}
                  </td>
                  <td className="py-3.5 px-4 font-semibold">{c.total_users || 1}</td>
                  <td className="py-3.5 px-4">{c.worker_count || 0}</td>
                  <td className="py-3.5 px-4">{c.total_issues || 0}</td>
                  <td className="py-3.5 px-4">
                    {Number(c.critical_open_issues) > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                        {c.critical_open_issues}
                      </span>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectCampus(c.slug)}
                      className="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 font-medium transition cursor-pointer"
                    >
                      Enter Campus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
