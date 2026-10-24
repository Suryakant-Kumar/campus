import React, { useState } from 'react';
import {
  ThumbsUp,
  MessageSquare,
  MapPin,
  Clock,
  Sparkles,
  AlertOctagon,
  CheckCircle2,
  Hourglass,
  XCircle,
  UserCheck,
  ShieldAlert,
  Tag,
  Wrench,
} from 'lucide-react';
import { Issue, IssueStatus, IssueUrgency, User } from '../types';

interface IssueCardProps {
  issue: Issue;
  currentUser: User | null;
  onUpvote: (issueId: string) => void;
  onOpenDetails: (issue: Issue) => void;
}

const STATUS_CONFIG: Record<
  IssueStatus,
  { label: string; bg: string; text: string; icon: React.FC<{ className?: string }> }
> = {
  open: { label: 'Open', bg: 'bg-sky-500/10 border-sky-500/30', text: 'text-sky-400', icon: AlertOctagon },
  in_progress: { label: 'In Progress', bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', icon: Hourglass },
  resolved: { label: 'Resolved', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Rejected', bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-400', icon: XCircle },
};

const URGENCY_CONFIG: Record<
  IssueUrgency,
  { label: string; bg: string; text: string }
> = {
  critical: { label: 'Critical Hazard', bg: 'bg-rose-500/20 border-rose-500/40 text-rose-300' },
  high: { label: 'High Priority', bg: 'bg-orange-500/20 border-orange-500/40 text-orange-300' },
  medium: { label: 'Medium', bg: 'bg-amber-500/20 border-amber-500/30 text-amber-300' },
  low: { label: 'Low', bg: 'bg-slate-700/40 border-slate-700 text-slate-300' },
};

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  currentUser,
  onUpvote,
  onOpenDetails,
}) => {
  const [upvoting, setUpvoting] = useState(false);
  const statusInfo = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
  const urgencyInfo = URGENCY_CONFIG[issue.urgency] || URGENCY_CONFIG.medium;
  const StatusIcon = statusInfo.icon;

  const handleUpvoteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    setUpvoting(true);
    try {
      await onUpvote(issue.id);
    } finally {
      setUpvoting(false);
    }
  };

  return (
    <div
      onClick={() => onOpenDetails(issue)}
      className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between group"
    >
      <div>
        {/* Top Header: Category, Status, Urgency */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              {issue.category}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold ${statusInfo.bg} ${statusInfo.text}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{statusInfo.label}</span>
            </span>
          </div>

          <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${urgencyInfo.bg}`}>
            {urgencyInfo.label}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition line-clamp-2">
          {issue.title}
        </h3>
        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
          {issue.description}
        </p>

        {/* AI Triage Banner if available */}
        {issue.ai_analysis && (
          <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-medium text-indigo-300">
                  AI Triage · Clarity {issue.ai_analysis.clarityScore}/10
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                  {issue.ai_analysis.aiProvider === 'gemini' ? 'Gemini 3.8 Flash' : 'Keyword Engine'}
                </span>
              </div>
              <p className="text-slate-400 line-clamp-1 mt-0.5">
                {issue.ai_analysis.actionableSummary}
              </p>
            </div>
          </div>
        )}

        {/* AI Flag Warning */}
        {issue.ai_flagged && (
          <div className="mt-2.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="line-clamp-1">Flagged by AI: {issue.ai_flag_reason || 'Safety review'}</span>
          </div>
        )}

        {/* Location & Photo Preview */}
        <div className="mt-3.5 flex items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{issue.location}</span>
          </div>

          {issue.photo_url && (
            <div className="shrink-0">
              <img
                src={issue.photo_url}
                alt="Issue attachment"
                className="w-10 h-10 object-cover rounded-lg border border-slate-700/80"
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer: Worker Assignment, Creator, Upvotes & Comments */}
      <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          {issue.worker_name ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              <Wrench className="w-3 h-3 text-amber-400" />
              <span>Assigned: {issue.worker_name}</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-500">Unassigned worker</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Upvote button */}
          <button
            onClick={handleUpvoteClick}
            disabled={!currentUser || upvoting}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
              issue.has_upvoted
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/60'
            } ${!currentUser ? 'opacity-60 cursor-not-allowed' : ''}`}
            title={currentUser ? 'Upvote this issue' : 'Sign in to upvote'}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${issue.has_upvoted ? 'text-indigo-400 fill-indigo-400/30' : ''}`} />
            <span>{issue.upvotes_count || 0}</span>
          </button>

          {/* Comments count */}
          <div className="flex items-center gap-1 text-slate-400" title="Comments count">
            <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
            <span>{issue.comments_count || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
