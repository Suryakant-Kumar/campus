import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Wrench,
  BarChart3,
  Building2,
  UserPlus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Lock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Campus, StaffMember, User, CampusStats, Issue } from '../types';
import { getCampusStaff, addCampusStaff, removeCampusStaff, getCampusStats } from '../api';

interface AdminPanelProps {
  campus: Campus;
  currentUser: User;
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onRefreshData: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  campus,
  currentUser,
  issues,
  onSelectIssue,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'issues' | 'staff' | 'analytics' | 'settings'>('issues');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<CampusStats | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // New staff modal
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'worker' as 'worker' | 'co_admin',
    department: 'Maintenance',
    phone: '',
  });
  const [addingStaff, setAddingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'founder';
  const isCoAdminOrHigher = ['admin', 'co_admin', 'founder'].includes(currentUser.role);

  useEffect(() => {
    loadStaff();
    loadStats();
  }, [campus.slug]);

  const loadStaff = async () => {
    setLoadingStaff(true);
    try {
      const data = await getCampusStaff(campus.slug);
      setStaff(data);
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getCampusStats(campus.slug);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);
    setAddingStaff(true);

    try {
      await addCampusStaff(campus.slug, newStaffForm);
      await loadStaff();
      setShowAddStaffModal(false);
      setNewStaffForm({
        name: '',
        email: '',
        password: '',
        role: 'worker',
        department: 'Maintenance',
        phone: '',
      });
      alert(`Staff member ${newStaffForm.name} added successfully!`);
    } catch (err: any) {
      setStaffError(err.message || 'Failed to add staff member.');
    } finally {
      setAddingStaff(false);
    }
  };

  const handleRemoveStaff = async (memberId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove staff member ${name}?`)) return;

    try {
      await removeCampusStaff(campus.slug, memberId);
      await loadStaff();
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove staff member.');
    }
  };

  const unassignedIssues = issues.filter((i) => !i.assigned_to && i.status !== 'resolved');
  const criticalIssues = issues.filter((i) => i.urgency === 'critical' && i.status !== 'resolved');
  const inProgressIssues = issues.filter((i) => i.status === 'in_progress');
  const resolvedIssues = issues.filter((i) => i.status === 'resolved');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Shield className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">
              {currentUser.role === 'admin' ? 'Campus Administration Control' : 'Co-Admin Operations Portal'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Managing <strong className="text-white">{campus.name}</strong> ({campus.slug}.campusconnect.com)
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => setActiveTab('issues')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'issues'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Triage & Queue ({unassignedIssues.length})
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Staff & Workers ({staff.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Campus Analytics
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Link & Info
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Critical Hazards</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{criticalIssues.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">Requires immediate response</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Unassigned Tickets</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{unassignedIssues.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">Waiting in pool</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">In Progress</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">{inProgressIssues.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">Under active repair</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Resolved Issues</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{resolvedIssues.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">Successfully resolved</div>
        </div>
      </div>

      {/* TAB 1: Issues Triage Queue */}
      {activeTab === 'issues' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Dispatch & Triage Queue</h3>
              <p className="text-xs text-slate-400">Click any issue to assign workers or modify status</p>
            </div>
            <button
              onClick={onRefreshData}
              className="text-xs text-indigo-400 hover:underline"
            >
              Refresh
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {issues.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No issues raised in this campus yet.
              </div>
            ) : (
              issues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => onSelectIssue(issue)}
                  className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-800/30 px-3 rounded-xl transition cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{issue.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          issue.urgency === 'critical'
                            ? 'bg-rose-500/20 text-rose-300'
                            : issue.urgency === 'high'
                            ? 'bg-orange-500/20 text-orange-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {issue.urgency}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>{issue.category}</span>
                      <span>·</span>
                      <span>{issue.location}</span>
                      <span>·</span>
                      <span className="text-slate-500">
                        By {issue.creator_name || 'Member'} on {new Date(issue.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {issue.worker_name ? (
                      <span className="text-xs text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 flex items-center gap-1">
                        <Wrench className="w-3 h-3" />
                        <span>Worker: {issue.worker_name}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                        Unassigned
                      </span>
                    )}

                    <span
                      className={`text-xs px-2.5 py-1 rounded font-semibold capitalize ${
                        issue.status === 'resolved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : issue.status === 'in_progress'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-sky-500/20 text-sky-300'
                      }`}
                    >
                      {issue.status.replace('_', ' ')}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Staff Management (Admin only) */}
      {activeTab === 'staff' && isAdmin && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Campus Staff & Workers</span>
              </h3>
              <p className="text-xs text-slate-400">
                Staff members resolve issues, post internal notes, and take action.
              </p>
            </div>

            <button
              onClick={() => setShowAddStaffModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Staff Member</span>
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {staff.map((m) => (
              <div key={m.id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{m.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        m.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-300'
                          : m.role === 'co_admin'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {m.role}
                    </span>
                    {m.department && (
                      <span className="text-xs text-slate-400 font-medium">({m.department})</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                    <span>{m.email}</span>
                    {m.phone && <span>· {m.phone}</span>}
                    <span>· Active tasks: {m.active_assigned_count || 0}</span>
                    <span>· Resolved: {m.resolved_count || 0}</span>
                  </div>
                </div>

                {m.id !== currentUser.id && m.role !== 'admin' && (
                  <button
                    onClick={() => handleRemoveStaff(m.id, m.name)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Remove staff member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Campus Analytics */}
      {activeTab === 'analytics' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Campus Issue Analytics</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Issues by Urgency Level
              </h4>
              <div className="space-y-2">
                {['critical', 'high', 'medium', 'low'].map((urg) => {
                  const match = stats?.urgencyCounts.find((u) => u.urgency === urg);
                  const count = match ? parseInt(match.count, 10) : 0;
                  const total = issues.length || 1;
                  const pct = Math.round((count / total) * 100);

                  return (
                    <div key={urg} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize text-slate-300">{urg}</span>
                        <span className="font-semibold text-white">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className={`h-full ${
                            urg === 'critical'
                              ? 'bg-rose-500'
                              : urg === 'high'
                              ? 'bg-orange-500'
                              : urg === 'medium'
                              ? 'bg-amber-500'
                              : 'bg-slate-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Top Categories Reported
              </h4>
              <div className="space-y-2">
                {stats?.categoryCounts && stats.categoryCounts.length > 0 ? (
                  stats.categoryCounts.map((cat) => (
                    <div
                      key={cat.category}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 border border-slate-800"
                    >
                      <span className="text-slate-300 font-medium">{cat.category}</span>
                      <span className="font-mono text-indigo-400 font-bold">{cat.count} issues</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 py-4 text-center">
                    No category data accumulated yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Link & Info */}
      {activeTab === 'settings' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Campus Portal Configuration</h3>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block uppercase font-semibold">Campus Name</span>
              <span className="text-white font-medium text-sm">{campus.name}</span>
            </div>

            <div>
              <span className="text-slate-500 block uppercase font-semibold">Campus Dedicated Link</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-indigo-400 font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
                  {campus.slug}.campusconnect.com
                </code>
              </div>
              <p className="text-slate-400 text-[11px] mt-1">
                Share this link with your students, staff, hostelites, or residents. They will only ever access this URL.
              </p>
            </div>

            <div>
              <span className="text-slate-500 block uppercase font-semibold">Campus Type</span>
              <span className="text-slate-300 capitalize">{campus.type.replace('_', ' ')}</span>
            </div>

            {campus.address && (
              <div>
                <span className="text-slate-500 block uppercase font-semibold">Address / Location</span>
                <span className="text-slate-300">{campus.address}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Staff Member */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add Campus Staff Member</h3>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {staffError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {staffError}
              </div>
            )}

            <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Staff Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Carpenter"
                  value={newStaffForm.name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="worker@campus.edu"
                  value={newStaffForm.email}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Password * (scrypt)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Initial login password"
                  value={newStaffForm.password}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Staff Role *</label>
                  <select
                    value={newStaffForm.role}
                    onChange={(e) =>
                      setNewStaffForm({ ...newStaffForm, role: e.target.value as 'worker' | 'co_admin' })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="worker">Worker (Field Staff)</option>
                    <option value="co_admin">Co-Admin (Dispatcher)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Electrical / HVAC"
                    value={newStaffForm.department}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={newStaffForm.phone}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingStaff}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow"
                >
                  {addingStaff ? 'Creating...' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
