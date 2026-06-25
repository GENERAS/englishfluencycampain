import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  Users,
  FileText,
  Mic,
  CheckCircle,
  XCircle,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  BarChart2,
  Calendar,
  Send,
  Trash
} from "lucide-react";
import {
  UserProfile,
  WritingSubmission,
  SpeakingSubmission,
  Report
} from "../types";
import {
  getAllUsers,
  getWritings,
  submitWritingReview,
  getSpeakingSubmissions,
  submitSpeakingReview,
  getReports,
  resolveReport,
  createLesson,
  updateUserRole,
  updateGlobalSettings
} from "../firebase-utils";
import { useToast } from "./Toast";


// Import Recharts for beautiful real analytical dashboards
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AdminPanelProps {
  user: UserProfile;
  logoUrl?: string;
  onLogoChange?: (url: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ user, logoUrl = "", onLogoChange }) => {
  const [activeTab, setActiveTab] = useState<"submissions" | "users" | "moderation" | "lessons" | "analytics" | "branding">("submissions");
  const { showToast } = useToast();

  // Branding logo upload states
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Selected file must be an image.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be less than 5MB.", "error");
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setLogoPreviewUrl(url);
  };

  const handleUploadLogo = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      const res = await fetch("https://api.imgbb.com/1/upload?key=199b956cd12ea8527e5aa4df90aa4ee9", {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Failed to upload to ImgBB");
      const result = await res.json();
      const url = result.data.url;
      
      await updateGlobalSettings({ logoUrl: url });
      if (onLogoChange) onLogoChange(url);
      
      showToast("Website logo updated successfully!", "success");
      setSelectedFile(null);
      setLogoPreviewUrl(null);
    } catch (err: any) {
      console.error("Upload logo failed:", err);
      showToast("Failed to upload website logo.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetLogo = async () => {
    setIsUploading(true);
    try {
      await updateGlobalSettings({ logoUrl: "" });
      if (onLogoChange) onLogoChange("");
      showToast("Website logo reset to default.", "success");
      setSelectedFile(null);
      setLogoPreviewUrl(null);
    } catch (err) {
      console.error("Reset logo failed:", err);
      showToast("Failed to reset website logo.", "error");
    } finally {
      setIsUploading(false);
    }
  };


  // Submissions Data
  const [pendingWritings, setPendingWritings] = useState<WritingSubmission[]>([]);
  const [pendingSpeakings, setPendingSpeakings] = useState<SpeakingSubmission[]>([]);
  const [selectedWriting, setSelectedWriting] = useState<WritingSubmission | null>(null);
  const [selectedSpeaking, setSelectedSpeaking] = useState<SpeakingSubmission | null>(null);

  // Grading State
  const [writeFeedback, setWriteFeedback] = useState("");
  const [writeScores, setWriteScores] = useState({ grammar: 20, vocabulary: 20, structure: 20, clarity: 20 });
  const [speakFeedback, setSpeakFeedback] = useState("");
  const [speakScores, setSpeakScores] = useState({ pronunciation: 20, fluency: 20, vocabulary: 20, grammar: 20 });
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

  // Users & Reports
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [reportsList, setReportsList] = useState<Report[]>([]);

  // Create Lesson State
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonCategory, setLessonCategory] = useState("grammar");
  const [lessonDifficulty, setLessonDifficulty] = useState("Intermediate");
  const [lessonBody, setLessonBody] = useState("");
  const [lessonResources, setLessonResources] = useState("");
  const [lessonSuccess, setLessonSuccess] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  const loadAdminData = async () => {
    try {
      if (activeTab === "submissions") {
        const writings = await getWritings("pending");
        setPendingWritings(writings);
        const speakings = await getSpeakingSubmissions("pending");
        setPendingSpeakings(speakings);
      } else if (activeTab === "users") {
        const users = await getAllUsers();
        setUsersList(users);
      } else if (activeTab === "moderation") {
        const reports = await getReports();
        setReportsList(reports);
      }
    } catch (err) {
      console.error("Error loading admin information:", err);
    }
  };

  const handleRoleChange = async (userId: string, newRole: any) => {
    try {
      await updateUserRole(userId, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u.userId === userId ? { ...u, role: newRole } : u))
      );
      showToast(`User role updated to ${newRole} successfully!`, "success");
    } catch (err) {
      console.error("Failed to update user role:", err);
      showToast("Failed to update user role.", "error");
    }
  };

  // Grade Writing Submission
  const handleGradeWriting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWriting) return;
    setIsSubmittingGrade(true);
    try {
      const totalScore = Math.round(
        (writeScores.grammar + writeScores.vocabulary + writeScores.structure + writeScores.clarity)
      );
      await submitWritingReview(
        selectedWriting.id,
        writeFeedback.trim(),
        { ...writeScores, total: totalScore },
        user.userId
      );
      setSelectedWriting(null);
      setWriteFeedback("");
      loadAdminData();
      showToast("Writing submission evaluated and score updated!", "success");
    } catch (err) {
      console.error("Failed to grade writing:", err);
      showToast("Failed to grade writing submission.", "error");
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  // Grade Speaking Submission
  const handleGradeSpeaking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpeaking) return;
    setIsSubmittingGrade(true);
    try {
      const totalScore = Math.round(
        (speakScores.pronunciation + speakScores.fluency + speakScores.vocabulary + speakScores.grammar)
      );
      await submitSpeakingReview(
        selectedSpeaking.id,
        speakFeedback.trim(),
        { ...speakScores, total: totalScore },
        user.userId
      );
      setSelectedSpeaking(null);
      setSpeakFeedback("");
      loadAdminData();
      showToast("Voice submission evaluated and score updated!", "success");
    } catch (err) {
      console.error("Failed to grade speaking:", err);
      showToast("Failed to grade voice submission.", "error");
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  // Handle Moderation Flags
  const handleResolveFlag = async (reportId: string, action: "delete" | "dismiss") => {
    try {
      await resolveReport(reportId, action);
      loadAdminData();
      showToast(`Report successfully resolved with action: ${action}`, "success");
    } catch (err) {
      console.error("Error resolving flag report:", err);
      showToast("Failed to resolve flag report.", "error");
    }
  };

  // Add Lesson
  const handleCreateLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle || !lessonBody) return;
    try {
      const resourcesArray = lessonResources
        ? lessonResources.split(",").map((r) => r.trim())
        : [];
      await createLesson(
        lessonTitle,
        lessonCategory,
        lessonDifficulty,
        lessonBody,
        resourcesArray
      );
      setLessonSuccess(true);
      setLessonTitle("");
      setLessonBody("");
      setLessonResources("");
      showToast("New education curriculum lesson created!", "success");
      setTimeout(() => setLessonSuccess(false), 3000);
    } catch (err) {
      console.error("Error creating lesson:", err);
      showToast("Failed to create new lesson.", "error");
    }
  };

  // Data Calculations for Admin Real Analytics
  const getAnalyticsData = () => {
    // 1. Group users by levels
    const beginnerCount = usersList.filter((u) => u.level === "Beginner").length || 1;
    const intermediateCount = usersList.filter((u) => u.level === "Intermediate").length || 0;
    const advancedCount = usersList.filter((u) => u.level === "Advanced").length || 0;

    const levelData = [
      { name: "Beginner", value: beginnerCount },
      { name: "Intermediate", value: intermediateCount },
      { name: "Advanced", value: advancedCount }
    ];

    // 2. XP leaderboard
    const sortedByXP = [...usersList]
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 5)
      .map((u) => ({ name: u.name, XP: u.xp }));

    return { levelData, sortedByXP };
  };

  const { levelData, sortedByXP } = getAnalyticsData();
  const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome Banner */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-slate-900 p-6 sm:p-8 text-white sleek-shadow flex flex-wrap justify-between items-center gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 px-3 py-1 text-xs font-bold text-blue-300">
            <ShieldAlert className="h-4 w-4" />
            Administrative Portal
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">National Program Moderator Panel</h1>
          <p className="text-xs text-slate-300">
            Review student audio, grade academic essays, publish curriculums, and manage platform safety flags.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 mb-8 gap-1.5">
        {[
          { id: "submissions", label: "Review Submissions Queue", icon: FileText },
          { id: "users", label: "Registered Users", icon: Users },
          { id: "lessons", label: "Publish Lessons", icon: GraduationCap },
          { id: "moderation", label: "Safety Flag Queue", icon: AlertTriangle },
          { id: "analytics", label: "Platform Analytics", icon: BarChart2 },
          { id: "branding", label: "Branding & Logo", icon: Sparkles }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Panel Content */}
      <div className="space-y-6">
        {activeTab === "submissions" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Submissions Queue Left Sidebar */}
            <div className="lg:col-span-5 space-y-6">
              {/* Writings Block */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 sleek-shadow space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Pending Essays & Letters ({pendingWritings.length})
                </h3>
                
                {pendingWritings.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400 font-medium">
                    No pending written essays to review!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {pendingWritings.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => {
                          setSelectedWriting(w);
                          setSelectedSpeaking(null);
                        }}
                        className={`w-full text-left rounded-xl p-3 border transition flex items-center justify-between cursor-pointer ${
                          selectedWriting?.id === w.id
                            ? "border-blue-500 bg-blue-50/20"
                            : "border-slate-100 hover:bg-slate-50"
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 block truncate">{w.title}</span>
                          <span className="text-[10px] text-slate-400 font-medium">By: {w.userName}</span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 capitalize">
                          {w.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Speakings Block */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 sleek-shadow space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Pending Audio Submissions ({pendingSpeakings.length})
                </h3>

                {pendingSpeakings.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400 font-medium">
                    No pending voice recordings to review!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {pendingSpeakings.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedSpeaking(s);
                          setSelectedWriting(null);
                        }}
                        className={`w-full text-left rounded-xl p-3 border transition flex items-center justify-between cursor-pointer ${
                          selectedSpeaking?.id === s.id
                            ? "border-blue-500 bg-blue-50/20"
                            : "border-slate-100 hover:bg-slate-50"
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 block truncate">{s.promptText}</span>
                          <span className="text-[10px] text-slate-400 font-medium">By: {s.userName}</span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100/50">
                          Audio
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Active Grading Console Right Panel */}
            <div className="lg:col-span-7">
              {selectedWriting ? (
                <div className="rounded-2xl border border-slate-100 bg-white p-6 sleek-shadow space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Evaluate Essay</h3>
                    <h4 className="text-lg font-bold text-blue-600 mt-1">{selectedWriting.title}</h4>
                    <span className="text-[11px] text-slate-400">Authored by {selectedWriting.userName}</span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/50 text-xs text-slate-600 leading-relaxed font-sans max-h-[180px] overflow-y-auto whitespace-pre-wrap">
                    {selectedWriting.content}
                  </div>

                  {/* Grading Rubric */}
                  <form onSubmit={handleGradeWriting} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "grammar", label: "Grammar Core (0-25)" },
                        { key: "vocabulary", label: "Vocab Range (0-25)" },
                        { key: "structure", label: "Structure & Flow (0-25)" },
                        { key: "clarity", label: "Expression Clarity (0-25)" }
                      ].map((item) => (
                        <div key={item.key}>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            {item.label}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="25"
                            required
                            value={(writeScores as any)[item.key]}
                            onChange={(e) =>
                              setWriteScores({ ...writeScores, [item.key]: parseInt(e.target.value) || 0 })
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Mentor Feedback Summary
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Excellent grammar. Expand your paragraph transitions for smoother reading..."
                        value={writeFeedback}
                        onChange={(e) => setWriteFeedback(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-blue-500 resize-none"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedWriting(null)}
                        className="rounded-lg border border-slate-200 text-slate-500 font-semibold px-4 py-2 text-xs hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingGrade}
                        className="rounded-lg bg-blue-600 text-white font-bold px-5 py-2 text-xs hover:bg-blue-500 disabled:opacity-40 cursor-pointer"
                      >
                        {isSubmittingGrade ? "Saving Review..." : "Publish Assessment"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : selectedSpeaking ? (
                <div className="rounded-2xl border border-slate-100 bg-white p-6 sleek-shadow space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Evaluate Pronunciation</h3>
                    <h4 className="text-lg font-bold text-blue-600 mt-1">{selectedSpeaking.promptText}</h4>
                    <span className="text-[11px] text-slate-400">Submitted by {selectedSpeaking.userName}</span>
                  </div>

                  {/* Audio Player */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Voice Record Playback:</span>
                    <audio src={selectedSpeaking.audioUrl} controls className="h-10 rounded-lg" />
                  </div>

                  {/* Rubric */}
                  <form onSubmit={handleGradeSpeaking} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "pronunciation", label: "Pronunciation (0-25)" },
                        { key: "fluency", label: "Vocal Fluency (0-25)" },
                        { key: "vocabulary", label: "Vocab Choice (0-25)" },
                        { key: "grammar", label: "Grammar Logic (0-25)" }
                      ].map((item) => (
                        <div key={item.key}>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            {item.label}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="25"
                            required
                            value={(speakScores as any)[item.key]}
                            onChange={(e) =>
                              setSpeakScores({ ...speakScores, [item.key]: parseInt(e.target.value) || 0 })
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Mentor Feedback Summary
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Vocal pacing was highly articulate. Keep working on clear end-consonant sounds..."
                        value={speakFeedback}
                        onChange={(e) => setSpeakFeedback(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-blue-500 resize-none"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedSpeaking(null)}
                        className="rounded-lg border border-slate-200 text-slate-500 font-semibold px-4 py-2 text-xs hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingGrade}
                        className="rounded-lg bg-blue-600 text-white font-bold px-5 py-2 text-xs hover:bg-blue-500 disabled:opacity-40 cursor-pointer"
                      >
                        {isSubmittingGrade ? "Saving Review..." : "Publish Assessment"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-24 text-center text-slate-400 font-medium text-xs">
                  Select a student submission from the left panel to begin academic grading.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Management */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Roster Controls & Stats Header */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 sleek-shadow text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Users</span>
                <span className="text-xl font-extrabold text-slate-800">{usersList.length}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 sleek-shadow text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Students</span>
                <span className="text-xl font-extrabold text-blue-600">
                  {usersList.filter(u => u.role === "student" || !u.role).length}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 sleek-shadow text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Teachers</span>
                <span className="text-xl font-extrabold text-emerald-600">
                  {usersList.filter(u => u.role === "teacher").length}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 sleek-shadow text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Administrators</span>
                <span className="text-xl font-extrabold text-purple-600">
                  {usersList.filter(u => u.role === "admin").length}
                </span>
              </div>
            </div>

            {/* Special Super Admin Info Bar */}
            {user.email?.toLowerCase() === "generaskagiraneza@gmail.com" && (
              <div className="bg-blue-50 border border-blue-200/60 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wide">Super Admin Mode Active</h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Welcome, <strong>{user.name}</strong>. As the Super Administrator, you have total access. You can manage student, teacher, and administrator accounts instantly by changing their roles in the table dropdowns below.
                  </p>
                </div>
              </div>
            )}

            {/* Active Classroom Roster Table with Search */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 sleek-shadow space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Active Classroom Roster</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Filter registered students, teachers, and admins instantly.</p>
                </div>
                <div className="w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Search by name, email, school..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs outline-none focus:border-blue-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">User Info</th>
                      <th className="py-3 px-4">School</th>
                      <th className="py-3 px-4">Current Role</th>
                      <th className="py-3 px-4">Level</th>
                      <th className="py-3 px-4">Accumulated XP</th>
                      <th className="py-3 px-4">Badges</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.filter((usr) => {
                      const term = userSearchTerm.toLowerCase();
                      return (
                        (usr.name || "").toLowerCase().includes(term) ||
                        (usr.email || "").toLowerCase().includes(term) ||
                        (usr.school || "").toLowerCase().includes(term) ||
                        (usr.role || "student").toLowerCase().includes(term)
                      );
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                          No registered users found matching your search.
                        </td>
                      </tr>
                    ) : (
                      usersList
                        .filter((usr) => {
                          const term = userSearchTerm.toLowerCase();
                          return (
                            (usr.name || "").toLowerCase().includes(term) ||
                            (usr.email || "").toLowerCase().includes(term) ||
                            (usr.school || "").toLowerCase().includes(term) ||
                            (usr.role || "student").toLowerCase().includes(term)
                          );
                        })
                        .map((usr) => {
                          const isSuperAdminUser = usr.email?.toLowerCase() === "generaskagiraneza@gmail.com";
                          const isCurrentSuperAdmin = user.email?.toLowerCase() === "generaskagiraneza@gmail.com";
                          
                          return (
                            <tr key={usr.userId} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                              <td className="py-3.5 px-4 font-bold text-slate-800">
                                <div className="space-y-0.5">
                                  <span className="block font-bold text-slate-800">{usr.name}</span>
                                  <span className="block text-[10px] text-slate-400 font-mono font-medium">{usr.email || "No email"}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 font-medium">{usr.school}</td>
                              <td className="py-3.5 px-4 font-bold">
                                {isSuperAdminUser ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] bg-indigo-50 text-indigo-700 border-indigo-100 font-extrabold uppercase tracking-wide">
                                    <Sparkles className="h-3 w-3" />
                                    Super Admin
                                  </span>
                                ) : isCurrentSuperAdmin ? (
                                  <select
                                    value={usr.role || "student"}
                                    onChange={(e) => handleRoleChange(usr.userId, e.target.value as any)}
                                    className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold outline-none bg-white text-slate-700 focus:border-blue-500 cursor-pointer"
                                  >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                ) : (
                                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                                    usr.role === "admin"
                                      ? "bg-purple-50 text-purple-700 border-purple-100"
                                      : usr.role === "teacher"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                      : "bg-blue-50 text-blue-700 border-blue-100"
                                  }`}>
                                    {usr.role === "admin" ? "Admin" : usr.role === "teacher" ? "Teacher" : "Student"}
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-bold">
                                <span className="px-2 py-0.5 rounded-full border text-[10px] bg-slate-50 text-slate-700 border-slate-100">
                                  {usr.level || "Beginner"}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-extrabold text-slate-800">{usr.xp || 0} XP</td>
                              <td className="py-3.5 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {(usr.badges || []).map((badge, idx) => (
                                    <span key={idx} className="bg-slate-100 text-[9px] font-bold px-1.5 py-0.5 rounded-md text-slate-600">
                                      {badge}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Create Lessons */}
        {activeTab === "lessons" && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 sleek-shadow space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Publish Classroom Curriculum</h3>
              <p className="text-xs text-slate-500">Create grammar lessons, vocabulary guides, or writing prompts instantly.</p>
            </div>

            {lessonSuccess && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-xs font-semibold">
                Classroom module successfully added to students' Learning Hub!
              </div>
            )}

            <form onSubmit={handleCreateLessonSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Module Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Letter Writing: Structuring formal complaints"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                    <select
                      value={lessonCategory}
                      onChange={(e) => setLessonCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white outline-none focus:border-blue-500"
                    >
                      <option value="grammar">Grammar</option>
                      <option value="vocabulary">Vocabulary</option>
                      <option value="challenge">Challenge</option>
                      <option value="prompt">Prompt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Level</label>
                    <select
                      value={lessonDifficulty}
                      onChange={(e) => setLessonDifficulty(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white outline-none focus:border-blue-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Content Body (supports Markdown format)</label>
                <textarea
                  rows={8}
                  required
                  placeholder="### Structuring a Formal Letter... Use appropriate vocabulary like Assert, Compelling..."
                  value={lessonBody}
                  onChange={(e) => setLessonBody(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-4 text-sm font-sans focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Resources (Comma separated links)</label>
                <input
                  type="text"
                  placeholder="e.g., Cambridge English, Oxford Advanced Learner Booklet"
                  value={lessonResources}
                  onChange={(e) => setLessonResources(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={!lessonTitle || !lessonBody}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white font-bold px-6 py-3.5 text-xs shadow-md hover:bg-slate-800 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                Publish Curriculum Module
              </button>
            </form>
          </div>
        )}

        {/* Safety Flags Queue */}
        {activeTab === "moderation" && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 sleek-shadow">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Classroom Content Safety Flag Queue</h3>
            {reportsList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium text-xs">
                Safety queue is completely clear! No reports flagged.
              </div>
            ) : (
              <div className="space-y-4">
                {reportsList.map((report) => (
                  <div key={report.id} className="rounded-xl border border-slate-100 p-4 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-rose-50 border border-rose-100 text-rose-700">
                          Flagged {report.targetType}
                        </span>
                        <span className="text-[10px] text-slate-400">By: {report.reportedBy}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-1">
                        Reason: {report.reason}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate italic">"{report.contentPreview || "Target ID: " + report.targetId}"</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleResolveFlag(report.id, "dismiss")}
                        className="rounded-lg border border-slate-200 text-slate-600 font-bold px-3.5 py-1.5 text-xs hover:bg-slate-50 cursor-pointer"
                      >
                        Dismiss Flag
                      </button>
                      <button
                        onClick={() => handleResolveFlag(report.id, "delete")}
                        className="rounded-lg bg-rose-600 text-white font-bold px-3.5 py-1.5 text-xs hover:bg-rose-505 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash className="h-3.5 w-3.5" />
                        Moderate & Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Dashboard with real-time Recharts */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Level progression breakdown */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 sleek-shadow">
              <h3 className="text-sm font-bold text-slate-800 mb-4">English level Progression Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={levelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {levelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 text-[11px] font-bold text-slate-500 pt-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Beginner ({levelData[0].value})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span>Intermediate ({levelData[1].value})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span>Advanced ({levelData[2].value})</span>
                </div>
              </div>
            </div>

            {/* Performance Leaderboard */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 sleek-shadow">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Student XP Accumulation</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedByXP}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="XP" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Brand & Logo Management */}
        {activeTab === "branding" && (
          <div className="mx-auto max-w-2xl bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 sleek-shadow space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Custom Website Logo Settings</h2>
              <p className="text-xs text-slate-500 mt-1">
                As an Administrator, you can customize the main website logo. Upload your professional logo below to replace the default globe icon.
              </p>
            </div>

            {/* Current Logo Preview */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block">Current Active Logo</span>
                <span className="text-[10px] text-slate-400">Displayed in the header and navigation menus</span>
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-100 sleek-shadow">
                {logoUrl ? (
                  <img src={logoUrl} alt="Website Logo" className="h-8 max-w-[120px] object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white flex items-center justify-center font-extrabold text-xs">
                    EN
                  </div>
                )}
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">
                  {logoUrl ? "Custom Logo" : "Default Globe"}
                </span>
              </div>
            </div>

            {/* File Upload Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition flex flex-col items-center justify-center gap-3 cursor-pointer ${
                isDragging ? "border-blue-500 bg-blue-50/50" : "border-slate-200 hover:border-slate-300"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                accept="image/*"
                className="hidden"
              />
              <div className="h-12 w-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {selectedFile ? `Selected: ${selectedFile.name}` : "Drag & drop your logo here, or browse local device"}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Supports PNG, JPG, SVG, GIF up to 5MB</p>
              </div>
            </div>

            {/* File Preview */}
            {logoPreviewUrl && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 block">Preview of selected file:</span>
                <div className="border border-slate-100 rounded-xl p-4 flex items-center justify-center bg-slate-50">
                  <img src={logoPreviewUrl} alt="Logo Preview" className="h-12 max-w-[200px] object-contain" />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              {logoUrl && (
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleResetLogo}
                  className="rounded-xl border border-slate-200 text-slate-600 font-bold px-4 py-2.5 text-xs hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  Reset to Default
                </button>
              )}
              <button
                type="button"
                disabled={!selectedFile || isUploading}
                onClick={handleUploadLogo}
                className="rounded-xl bg-blue-600 text-white font-bold px-5 py-2.5 text-xs hover:bg-blue-500 disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-md"
              >
                {isUploading ? (
                  <>
                    <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Uploading Logo...
                  </>
                ) : (
                  "Upload & Save Logo"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminPanel;
