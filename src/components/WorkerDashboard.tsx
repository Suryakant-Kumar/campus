import React, { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Issue, User, IssueStatus } from '../types';
import { updateIssueStatus } from '../api';

interface WorkerDashboardProps {
  currentUser: User;
  issues: Issue[];
  onOpenDetails: (issue: Issue) => void;
  onRefreshData: () => void;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  currentUser,
  issues,
  onOpenDetails,
  onRefreshData,
}) => {
  const [filter, setFilter] = useState<'my_tasks' | 'pool' | 'resolved'>('my_tasks');

  const myAssigned = issues.filter(
    (i) => i.assigned_to === currentUser.id && i.status !== 'resolved'
  );
  const unassignedPool = issues.filter(
    (i) => !i.assigned_to && i.status !== 'resolved'
  );
  const myResolved = issues.filter(
    (i) => i.assigned_to === currentUser.id && i.status === 'resolved'
  );

  const displayedIssues =
    filter === 'my_tasks'
      ? myAssigned
      : filter === 'pool'
      ? unassignedPool
      : myResolved;

  const handleQuickStatusChange = async (issueId: string, status: IssueStatus) => {
    try {
      await updateIssueStatus(issueId, { status });
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Staff Worker Station</h2>
            <p className="text-xs text-slate-400">
              Welcome {currentUser.name} · Department: {currentUser.department || 'General Maintenance'}
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <button
            onClick={() => setFilter('my_tasks')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              filter === 'my_tasks'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Assigned to Me ({myAssigned.length})
          </button>

          <button
            onClick={() => setFilter('pool')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              filter === 'pool'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Unassigned Pool ({unassignedPool.length})
          </button>

          <button
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              filter === 'resolved'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({myResolved.length})
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedIssues.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
            {filter === 'my_tasks'
              ? 'No tickets currently assigned to you. Check the unassigned pool!'
              : filter === 'pool'
              ? 'Unassigned pool is empty. All campus tickets are assigned!'
              : 'You have not marked any tickets resolved yet.'}
          </div>
        ) : (
          displayedIssues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => onOpenDetails(issue)}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {issue.category}
                  </span>
                  <span
                    className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                      issue.urgency === 'critical'
                        ? 'bg-rose-500/20 text-rose-300'
                        : issue.urgency === 'high'
                        ? 'bg-orange-500/20 text-orange-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {issue.urgency}
                  </span>
                </div>

                <h3 className="font-bold text-white text-sm line-clamp-1">{issue.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{issue.description}</p>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-medium text-slate-300">{issue.location}</span>
                </div>

                {issue.ai_analysis && (
                  <div className="mt-2.5 p-2 rounded-lg bg-slate-950 text-[11px] text-slate-400 border border-slate-800/80">
                    <span className="text-indigo-400 font-semibold block text-[10px]">
                      AI Worker Summary:
                    </span>
                    <span className="line-clamp-2">{issue.ai_analysis.actionableSummary}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    issue.status === 'in_progress'
                      ? 'bg-amber-500/20 text-amber-300'
                      : issue.status === 'resolved'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-sky-500/20 text-sky-300'
                  }`}
                >
                  {issue.status.replace('_', ' ')}
                </span>

                {issue.status === 'open' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickStatusChange(issue.id, 'in_progress');
                    }}
                    className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition"
                  >
                    Start Work
                  </button>
                )}

                {issue.status === 'in_progress' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetails(issue);
                    }}
                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer transition"
                  >
                    Complete Ticket
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
