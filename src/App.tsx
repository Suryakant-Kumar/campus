import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Sparkles,
  Shield,
  Wrench,
  Radio,
  Flame,
  Layers,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { Campus, Issue, User, StaffMember } from './types';
import {
  detectCampusSlug,
  getCampusBySlug,
  listAllCampuses,
  getCampusIssues,
  getCurrentUser,
  clearStoredToken,
  getSystemHealth,
  getCampusStaff,
} from './api';
import { Navbar } from './components/Navbar';
import { MainSiteLanding } from './components/MainSiteLanding';
import { DatabaseNotice } from './components/DatabaseNotice';
import { IssueCard } from './components/IssueCard';
import { RaiseIssueModal } from './components/RaiseIssueModal';
import { IssueDetailModal } from './components/IssueDetailModal';
import { AdminPanel } from './components/AdminPanel';
import { WorkerDashboard } from './components/WorkerDashboard';
import { FounderDashboard } from './components/FounderDashboard';
import { CampusAuthModal } from './components/CampusAuthModal';

export default function App() {
  const [currentCampusSlug, setCurrentCampusSlug] = useState<string | null>(detectCampusSlug());
  const [currentCampus, setCurrentCampus] = useState<Campus | null>(null);
  const [campusesList, setCampusesList] = useState<Campus[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Issues and filtering
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeView, setActiveView] = useState<'feed' | 'admin' | 'worker'>('feed');

  // Staff list for assignments
  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  // Modals
  const [showRaiseModal, setShowRaiseModal] = useState<boolean>(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'login' | 'register' | 'founder' }>({
    open: false,
    mode: 'login',
  });

  // System Diagnostics
  const [dbConfigured, setDbConfigured] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check initial system health & load user
  useEffect(() => {
    checkHealth();
    loadCampuses();
    loadUser();
  }, []);

  const checkHealth = async () => {
    try {
      const health = await getSystemHealth();
      setDbConfigured(health.database.configured);
      setDbError(health.database.error);
    } catch {
      // Default fallback
    }
  };

  const loadCampuses = async () => {
    try {
      const list = await listAllCampuses();
      setCampusesList(list);
    } catch (err) {
      console.error('Failed to load campuses list:', err);
    }
  };

  const loadUser = async () => {
    try {
      const res = await getCurrentUser();
      setCurrentUser(res.user);
    } catch {
      // Unauthenticated
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Resolve current campus metadata when slug changes
  useEffect(() => {
    if (!currentCampusSlug) {
      setCurrentCampus(null);
      setIssues([]);
      return;
    }

    const fetchCampus = async () => {
      try {
        const campus = await getCampusBySlug(currentCampusSlug);
        setCurrentCampus(campus);
      } catch (err) {
        console.error('Campus not found:', err);
        setCurrentCampus(null);
      }
    };

    fetchCampus();
  }, [currentCampusSlug]);

  // Load campus staff if user is worker/co_admin/admin
  useEffect(() => {
    if (!currentCampusSlug || !currentUser) return;
    if (['worker', 'co_admin', 'admin', 'founder'].includes(currentUser.role)) {
      getCampusStaff(currentCampusSlug)
        .then(setStaffList)
        .catch(() => {});
    }
  }, [currentCampusSlug, currentUser]);

  // Poll campus issues every 5 seconds (Stateless live update requirement)
  const fetchIssues = useCallback(async () => {
    if (!currentCampusSlug || !currentUser) return;

    try {
      const data = await getCampusIssues(currentCampusSlug, {
        status: selectedStatus,
        category: selectedCategory,
        urgency: selectedUrgency,
        search: searchQuery,
      });
      setIssues(data);
    } catch (err) {
      console.error('Error polling issues:', err);
    }
  }, [currentCampusSlug, currentUser, selectedStatus, selectedCategory, selectedUrgency, searchQuery]);

  useEffect(() => {
    fetchIssues();
    const interval = setInterval(fetchIssues, 5000);
    return () => clearInterval(interval);
  }, [fetchIssues]);

  const handleLogout = () => {
    clearStoredToken();
    setCurrentUser(null);
    setActiveView('feed');
  };

  const handleSelectCampus = (slug: string | null) => {
    setCurrentCampusSlug(slug);
    // Update URL query parameter without full reload for preview fluidity
    const url = new URL(window.location.href);
    if (slug) {
      url.searchParams.set('campus', slug);
    } else {
      url.searchParams.delete('campus');
    }
    window.history.pushState({}, '', url.toString());
  };

  const handleAuthSuccess = (user: User, campus: Campus | null) => {
    setCurrentUser(user);
    if (campus) {
      handleSelectCampus(campus.slug);
    }
  };

  const handleIssueCreated = (newIssue: Issue) => {
    setIssues((prev) => [newIssue, ...prev]);
    setSelectedIssue(newIssue);
  };

  const handleIssueUpdated = (updated: Issue) => {
    setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setSelectedIssue(updated);
  };

  // Role permissions checks
  const isAdminOrHigher = currentUser && ['admin', 'co_admin', 'founder'].includes(currentUser.role);
  const isWorker = currentUser && currentUser.role === 'worker';
  const isFounder = currentUser && currentUser.role === 'founder';

  // If user is a Global Founder viewing the platform
  if (isFounder && !currentCampusSlug) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <DatabaseNotice dbConfigured={dbConfigured} dbError={dbError} />
        <Navbar
          currentCampus={null}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
          campusesList={campusesList}
          onSelectCampus={handleSelectCampus}
        />
        <FounderDashboard
          currentUser={currentUser}
          onSelectCampus={(slug) => handleSelectCampus(slug)}
          onExit={() => setCurrentCampusSlug(null)}
        />
      </div>
    );
  }

  // If on main root site (no campus slug selected)
  if (!currentCampusSlug) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <DatabaseNotice dbConfigured={dbConfigured} dbError={dbError} />
        <Navbar
          currentCampus={null}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
          campusesList={campusesList}
          onSelectCampus={handleSelectCampus}
        />
        <MainSiteLanding
          campuses={campusesList}
          onCampusCreated={(campus) => {
            setCampusesList((prev) => [campus, ...prev]);
            handleSelectCampus(campus.slug);
          }}
          onSelectCampus={(slug) => handleSelectCampus(slug)}
          onOpenFounderLogin={() => setAuthModal({ open: true, mode: 'founder' })}
        />

        <CampusAuthModal
          campus={null}
          initialMode={authModal.mode}
          isOpen={authModal.open}
          onClose={() => setAuthModal({ ...authModal, open: false })}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  // CAMPUS PORTAL VIEW (Dedicated Isolated Campus Space)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DatabaseNotice dbConfigured={dbConfigured} dbError={dbError} />
      <Navbar
        currentCampus={currentCampus}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
        campusesList={campusesList}
        onSelectCampus={handleSelectCampus}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Campus Header & Role Action Bar */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Building2 className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                {currentCampus ? currentCampus.name : currentCampusSlug}
              </h1>
              {currentCampus && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 capitalize border border-slate-700">
                  {currentCampus.type.replace('_', ' ')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
              <span className="text-indigo-400 font-bold">
                {currentCampusSlug}.campusconnect.com
              </span>
              <span>·</span>
              <span>All reported issues & resolution status</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Switcher based on Role */}
            {isAdminOrHigher && (
              <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-1 text-xs font-medium">
                <button
                  onClick={() => setActiveView('feed')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeView === 'feed'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Campus Feed
                </button>
                <button
                  onClick={() => setActiveView('admin')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeView === 'admin'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Admin & Dispatch
                </button>
              </div>
            )}

            {isWorker && (
              <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-1 text-xs font-medium">
                <button
                  onClick={() => setActiveView('feed')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeView === 'feed'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Issues
                </button>
                <button
                  onClick={() => setActiveView('worker')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeView === 'worker'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Worker Station
                </button>
              </div>
            )}

            {/* Raise Issue Trigger */}
            <button
              onClick={() => {
                if (!currentUser) {
                  setAuthModal({ open: true, mode: 'login' });
                } else {
                  setShowRaiseModal(true);
                }
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Raise an Issue</span>
            </button>
          </div>
        </div>

        {/* View Switch: Admin Panel vs Worker Station vs Public Feed */}
        {activeView === 'admin' && isAdminOrHigher && currentCampus && currentUser ? (
          <AdminPanel
            campus={currentCampus}
            currentUser={currentUser}
            issues={issues}
            onSelectIssue={(issue) => setSelectedIssue(issue)}
            onRefreshData={fetchIssues}
          />
        ) : activeView === 'worker' && isWorker && currentUser ? (
          <WorkerDashboard
            currentUser={currentUser}
            issues={issues}
            onOpenDetails={(issue) => setSelectedIssue(issue)}
            onRefreshData={fetchIssues}
          />
        ) : (
          /* General Issues Feed */
          <div className="space-y-6">
            {/* Search and Filters Bar */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
              {/* Search input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search issues by title, room, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>

              {/* Category, Status & Urgency Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Cleanliness">Cleanliness</option>
                  <option value="Internet/Wi-Fi">Internet/Wi-Fi</option>
                  <option value="Security">Security</option>
                  <option value="General Maintenance">General Maintenance</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>

                <select
                  value={selectedUrgency}
                  onChange={(e) => setSelectedUrgency(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 outline-none"
                >
                  <option value="all">All Urgencies</option>
                  <option value="critical">Critical Hazard</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <button
                  onClick={fetchIssues}
                  className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Refresh issues"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Issues Cards Grid */}
            {issues.length === 0 ? (
              <div className="py-20 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 space-y-3">
                <Sparkles className="w-10 h-10 text-indigo-400 mx-auto opacity-70" />
                <h3 className="font-bold text-base text-white">No Issues Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                    ? 'No issues match your current filters. Try clearing search criteria.'
                    : 'All clear on this campus! Be the first to report an issue or maintenance need.'}
                </p>
                <button
                  onClick={() => {
                    if (!currentUser) setAuthModal({ open: true, mode: 'login' });
                    else setShowRaiseModal(true);
                  }}
                  className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs inline-flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Raise First Issue</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {issues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    currentUser={currentUser}
                    onUpvote={async () => fetchIssues()}
                    onOpenDetails={(iss) => setSelectedIssue(iss)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {currentCampusSlug && (
        <RaiseIssueModal
          campusSlug={currentCampusSlug}
          isOpen={showRaiseModal}
          onClose={() => setShowRaiseModal(false)}
          onIssueCreated={handleIssueCreated}
        />
      )}

      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          currentUser={currentUser}
          staffList={staffList}
          isOpen={Boolean(selectedIssue)}
          onClose={() => setSelectedIssue(null)}
          onIssueUpdated={handleIssueUpdated}
        />
      )}

      <CampusAuthModal
        campus={currentCampus}
        initialMode={authModal.mode}
        isOpen={authModal.open}
        onClose={() => setAuthModal({ ...authModal, open: false })}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
