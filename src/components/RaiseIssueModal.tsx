import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Camera,
  MapPin,
  Upload,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Cpu,
} from 'lucide-react';
import { createIssue, uploadPhotoOnline } from '../api';
import { Issue } from '../types';

interface RaiseIssueModalProps {
  campusSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onIssueCreated: (newIssue: Issue) => void;
}

const CATEGORIES = [
  'Electricity',
  'Plumbing',
  'Cleanliness',
  'Internet/Wi-Fi',
  'Security',
  'Furniture/Carpentry',
  'HVAC & Air Conditioning',
  'Noise Complaint',
  'Structural Damage',
  'General Maintenance',
];

export const RaiseIssueModal: React.FC<RaiseIssueModalProps> = ({
  campusSlug,
  isOpen,
  onClose,
  onIssueCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Photo size exceeds 10MB limit.');
      return;
    }

    setUploadingPhoto(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          // Stateless upload to online storage (Vercel Blob / Supabase)
          const res = await uploadPhotoOnline(base64, file.name);
          setPhotoUrl(res.url);
        } catch (err: any) {
          setError(err.message || 'Photo upload failed.');
        } finally {
          setUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingPhoto(false);
      setError('Failed to process image.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !location.trim()) {
      setError('Title, description, and specific location are required.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await createIssue(campusSlug, {
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        photoUrl,
      });

      onIssueCreated(res.issue);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit issue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Raise Campus Issue</h2>
              <p className="text-xs text-slate-400">
                AI will inspect clarity, check safety, and estimate urgency.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Issue Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Water leak in 3rd floor restroom"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Specific Location / Room *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Room 304, Block B"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition"
                />
                <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Detailed Description *</label>
            <textarea
              required
              rows={4}
              placeholder="Describe the problem, when it started, and any hazards or details workers should know..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition leading-relaxed resize-none"
            />
          </div>

          {/* Online Photo Upload */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Issue Photo (Online Storage - Vercel Blob / Supabase)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {photoUrl ? (
              <div className="relative inline-block rounded-xl overflow-hidden border border-slate-800 group">
                <img src={photoUrl} alt="Issue preview" className="w-32 h-32 object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-md bg-rose-600 text-white hover:bg-rose-500 transition shadow"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 text-center cursor-pointer transition bg-slate-950/40"
              >
                {uploadingPhoto ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-indigo-400">
                    <span className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"></span>
                    <span>Uploading photo to online cloud storage...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-xs text-slate-400">
                    <Upload className="w-5 h-5 text-indigo-400" />
                    <span>Upload photo proof (stored online, zero local disk)</span>
                    <span className="text-[10px] text-slate-500">PNG, JPG up to 10MB</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Notice */}
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2">
            <Cpu className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Upon submission, Gemini AI server-side model checks the report for clarity, categorizes priority, and generates instructions for facility workers.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingPhoto}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>AI Triage Running...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Submit Issue</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
