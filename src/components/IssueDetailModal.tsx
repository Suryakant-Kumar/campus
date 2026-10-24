import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Sparkles,
  ThumbsUp,
  Send,
  Lock,
  Wrench,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Radio,
  Camera,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { Issue, IssueComment, IssueStatus, StaffMember, User } from '../types';
import {
  getIssueComments,
  postIssueComment,
  toggleIssueUpvote,
  updateIssueStatus,
  assignIssueWorker,
  uploadPhotoOnline,
} from '../api';

interface IssueDetailModalProps {
  issue: Issue;
  currentUser: User | null;
  staffList: StaffMember[];
  isOpen: boolean;
  onClose: () => void;
  onIssueUpdated: (updated: Issue) => void;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issue,
  currentUser,
  staffList,
  isOpen,
  onClose,
  onIssueUpdated,
}) => {
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  // Status & resolution states
  const [newStatus, setNewStatus] = useState<IssueStatus>(issue.status);
  const [resolutionNotes, setResolutionNotes] = useState(issue.resolution_notes || '');
  const [resolutionPhotoUrl, setResolutionPhotoUrl] = useState<string | null>(
    issue.resolution_photo_url || null
  );
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(issue.assigned_to || '');
  const [assigningWorker, setAssigningWorker] = useState(false);

  const commentsEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const isStaff = currentUser && ['worker', 'co_admin', 'admin', 'founder'].includes(currentUser.role);
  const canAssign = currentUser && ['co_admin', 'admin', 'founder'].includes(currentUser.role);
  const workersOnly = staffList.filter((s) => s.role === 'worker');

  // Fetch comments and poll every 4 seconds
  useEffect(() => {
    let isMounted = true;

    const fetchComments = async () => {
      try {
        const data = await getIssueComments(issue.id);
        if (isMounted) {
          setComments(data);
        }
      } catch (err) {
        console.error('Failed to poll comments:', err);
      }
    };

    fetchComments();
    const interval = setInterval(fetchComments, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [issue.id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setCommentLoading(true);
    try {
      const added = await postIssueComment(issue.id, newComment.trim(), isInternalComment);
      setComments((prev) => [...prev, added]);
      setNewComment('');
      setIsInternalComment(false);
      onIssueUpdated({
        ...issue,
        comments_count: (issue.comments_count || 0) + 1,
      });
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleToggleUpvote = async () => {
    if (!currentUser) return;
    try {
      const res = await toggleIssueUpvote(issue.id);
      onIssueUpdated({
        ...issue,
        has_upvoted: res.hasUpvoted,
        upvotes_count: res.upvotesCount,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to toggle upvote');
    }
  };

  const handleStatusUpdate = async () => {
    setUpdatingStatus(true);
    try {
      const res = await updateIssueStatus(issue.id, {
        status: newStatus,
        resolutionNotes: newStatus === 'resolved' ? resolutionNotes : undefined,
        resolutionPhotoUrl: newStatus === 'resolved' ? resolutionPhotoUrl || undefined : undefined,
      });
      onIssueUpdated({
        ...issue,
        status: res.issue.status,
        resolution_notes: res.issue.resolution_notes,
        resolution_photo_url: res.issue.resolution_photo_url,
        resolved_at: res.issue.resolved_at,
      });
      alert(`Issue status successfully updated to "${newStatus}".`);
    } catch (err: any) {
      alert(err.message || 'Failed to update issue status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleWorkerAssignment = async (workerId: string) => {
    setSelectedWorkerId(workerId);
    setAssigningWorker(true);
    try {
      const res = await assignIssueWorker(issue.id, workerId || null);
      const worker = staffList.find((s) => s.id === workerId);
      onIssueUpdated({
        ...issue,
        assigned_to: res.issue.assigned_to,
        status: res.issue.status,
        worker_name: worker ? worker.name : null,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to assign worker');
    } finally {
      setAssigningWorker(false);
    }
  };

  const handleResolutionPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await uploadPhotoOnline(reader.result as string, file.name);
        setResolutionPhotoUrl(res.url);
      } catch (err: any) {
        alert(err.message || 'Photo upload failed');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              {issue.category}
            </span>
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${
                issue.status === 'resolved'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : issue.status === 'in_progress'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
              }`}
            >
              {issue.status.replace('_', ' ')}
            </span>
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              {issue.urgency} Urgency
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Live Sync (4s)</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Two columns on desktop */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* Left Column: Issue details, AI analysis, Photos (7 cols) */}
          <div className="lg:col-span-7 p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white leading-snug">{issue.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{issue.location}</span>
                </span>
                <span>·</span>
                <span>Reported by {issue.creator_name || 'Campus Member'}</span>
                <span>·</span>
                <span>{new Date(issue.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
              {issue.description}
            </div>

            {/* Photo Attachment if present */}
            {issue.photo_url && (
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Attached Issue Photo
                </h4>
                <div className="rounded-xl overflow-hidden border border-slate-800 max-w-sm">
                  <img
                    src={issue.photo_url}
                    alt="Issue attachment"
                    className="w-full h-auto max-h-64 object-cover"
                  />
                </div>
              </div>
            )}

            {/* Gemini AI Triage Analysis Card */}
            {issue.ai_analysis && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Gemini AI Safety & Triage Analysis</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {issue.ai_analysis.aiProvider === 'gemini' ? 'Gemini 3.8 Flash' : 'Keyword Fallback'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Clarity Score</span>
                    <span className="font-bold text-white text-sm">
                      {issue.ai_analysis.clarityScore} / 10
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Inferred Urgency</span>
                    <span className="font-bold text-amber-300 capitalize text-sm">
                      {issue.ai_analysis.urgency}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                    Actionable Worker Summary
                  </span>
                  <p className="text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                    {issue.ai_analysis.actionableSummary}
                  </p>
                </div>

                {issue.ai_analysis.tags && issue.ai_analysis.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {issue.ai_analysis.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Resolved Status Card if already resolved */}
            {issue.status === 'resolved' && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Issue Marked Resolved</span>
                </div>
                {issue.resolution_notes && (
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    <strong>Resolution Notes:</strong> {issue.resolution_notes}
                  </p>
                )}
                {issue.resolution_photo_url && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-emerald-500/30 max-w-xs">
                    <img
                      src={issue.resolution_photo_url}
                      alt="Resolution proof"
                      className="w-full h-auto max-h-48 object-cover"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Staff Resolution & Assignment Controls (Workers, Co-Admins, Admins) */}
            {isStaff && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                    <Wrench className="w-3.5 h-3.5 text-amber-400" />
                    <span>Staff Controls</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 capitalize">
                    Your Role: {currentUser?.role}
                  </span>
                </div>

                {/* Worker Assigner (Co-Admin & Admin only) */}
                {canAssign && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Assign Worker
                    </label>
                    <select
                      value={selectedWorkerId}
                      onChange={(e) => handleWorkerAssignment(e.target.value)}
                      disabled={assigningWorker}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Unassigned (Ticket in pool) --</option>
                      {workersOnly.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} {w.department ? `(${w.department})` : ''} - {w.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Status Switcher & Resolution details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Update Ticket Status
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['open', 'in_progress', 'resolved', 'rejected'] as IssueStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setNewStatus(st)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-medium capitalize border transition cursor-pointer ${
                            newStatus === st
                              ? 'bg-indigo-600 text-white border-indigo-500'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {newStatus === 'resolved' && (
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Resolution Notes *
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Explain what repairs were completed..."
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-indigo-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Proof of Resolution Photo (Online Storage)
                        </label>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleResolutionPhotoUpload}
                          className="hidden"
                        />
                        {resolutionPhotoUrl ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={resolutionPhotoUrl}
                              alt="Proof preview"
                              className="w-16 h-16 object-cover rounded-lg border border-slate-700"
                            />
                            <button
                              type="button"
                              onClick={() => setResolutionPhotoUrl(null)}
                              className="text-xs text-rose-400 hover:underline"
                            >
                              Remove photo
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Attach after-repair photo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleStatusUpdate}
                    disabled={updatingStatus}
                    className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs shadow transition cursor-pointer"
                  >
                    {updatingStatus ? 'Updating ticket...' : 'Confirm Status Change'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Discussion / Chat Thread (5 cols) */}
          <div className="lg:col-span-5 flex flex-col h-full bg-slate-950/40">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span>Discussion & Updates</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
                  {comments.length}
                </span>
              </h3>

              {/* Upvote button */}
              <button
                onClick={handleToggleUpvote}
                disabled={!currentUser}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                  issue.has_upvoted
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${issue.has_upvoted ? 'text-indigo-400 fill-indigo-400/30' : ''}`} />
                <span>{issue.upvotes_count || 0} Upvotes</span>
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[300px] max-h-[480px]">
              {comments.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No comments yet. Start the conversation!
                </div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl text-xs space-y-1 ${
                      c.is_internal
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200'
                        : c.user_id === currentUser?.id
                        ? 'bg-indigo-950/30 border border-indigo-800/40 text-slate-200'
                        : 'bg-slate-900 border border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white">{c.user_name}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                            c.user_role === 'admin'
                              ? 'bg-purple-500/20 text-purple-300'
                              : c.user_role === 'worker'
                              ? 'bg-amber-500/20 text-amber-300'
                              : c.user_role === 'co_admin'
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {c.user_role}
                        </span>
                        {c.is_internal && (
                          <span className="flex items-center gap-0.5 text-[9px] text-amber-400 font-semibold">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Staff Note</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="leading-relaxed whitespace-pre-wrap">{c.content}</p>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment Form */}
            {currentUser ? (
              <form onSubmit={handlePostComment} className="p-4 border-t border-slate-800 shrink-0 space-y-2 bg-slate-900/60">
                {isStaff && (
                  <label className="flex items-center gap-2 text-[11px] text-slate-400 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="flex items-center gap-1 text-amber-300">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Make this an internal staff note (hidden from regular members)</span>
                    </span>
                  </label>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={
                      isInternalComment
                        ? 'Type internal staff note...'
                        : 'Post an update or question...'
                    }
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
                  />
                  <button
                    type="submit"
                    disabled={commentLoading || !newComment.trim()}
                    className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition cursor-pointer"
                    title="Send comment"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-500">
                Log in to join the discussion on this issue.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
