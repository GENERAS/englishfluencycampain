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
  Trash,
  Trophy
} from "lucide-react";
import {
  UserProfile,
  WritingSubmission,
  SpeakingSubmission,
  Report,
  Founder,
  Lesson
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
  updateUserProfileDetails,
  updateGlobalSettings,
  getFounders,
  createFounder,
  updateFounder,
  deleteFounder,
  uploadImageToCloudinary,
  isAdminEmail,
  getLessons,
  approveLesson,
  getWeeklyXp
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
  const [activeTab, setActiveTab] = useState<"submissions" | "users" | "moderation" | "lessons" | "analytics" | "branding" | "founders">("submissions");
  const { showToast } = useToast();

  // Branding logo upload states
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cloudinaryPreset, setCloudinaryPreset] = useState<string>(
    localStorage.getItem("cloudinary_upload_preset") || "ml_default"
  );
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState<string>(
    localStorage.getItem("cloudinary_cloud_name") || "dzllg8zxm"
  );
  const [cloudinaryApiKey, setCloudinaryApiKey] = useState<string>(
    localStorage.getItem("cloudinary_api_key") || "375193569628911"
  );
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
      // Use the Cloudinary upload function!
      const url = await uploadImageToCloudinary(selectedFile, cloudinaryPreset);
      
      await updateGlobalSettings({ logoUrl: url });
      if (onLogoChange) onLogoChange(url);
      
      showToast("Website logo updated successfully using Cloudinary!", "success");
      setSelectedFile(null);
      setLogoPreviewUrl(null);
    } catch (err: any) {
      console.error("Upload logo failed:", err);
      showToast("Failed to upload website logo to Cloudinary.", "error");
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
  const [adminLessons, setAdminLessons] = useState<Lesson[]>([]);
  const [isApprovingLesson, setIsApprovingLesson] = useState<string | null>(null);

  // Founders & Developers State
  const [foundersList, setFoundersList] = useState<Founder[]>([]);
  const [isLoadingFounders, setIsLoadingFounders] = useState(false);
  const [selectedFounder, setSelectedFounder] = useState<Founder | null>(null);
  const [founderName, setFounderName] = useState("");
  const [founderRole, setFounderRole] = useState("");
  const [founderSchool, setFounderSchool] = useState("");
  const [founderBio, setFounderBio] = useState("");
  const [founderImageUrl, setFounderImageUrl] = useState("");
  const [founderDisplayOrder, setFounderDisplayOrder] = useState(1);
  const [isSubmittingFounder, setIsSubmittingFounder] = useState(false);
  const [isUploadingFounderPhoto, setIsUploadingFounderPhoto] = useState(false);

  // Weekly Spotlight States
  const [spotlightUser, setSpotlightUser] = useState<UserProfile | null>(null);
  const [spotlightReasonText, setSpotlightReasonText] = useState("");
  const [spotlightWeekText, setSpotlightWeekText] = useState("");
  const [isSubmittingSpotlight, setIsSubmittingSpotlight] = useState(false);

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
      } else if (activeTab === "founders") {
        setIsLoadingFounders(true);
        const list = await getFounders();
        setFoundersList(list);
        setIsLoadingFounders(false);
      } else if (activeTab === "lessons") {
        const list = await getLessons();
        setAdminLessons(list);
      }
    } catch (err) {
      console.error("Error loading admin information:", err);
      if (activeTab === "founders") {
        setIsLoadingFounders(false);
      }
    }
  };

  const handleApproveLesson = async (lessonId: string) => {
    setIsApprovingLesson(lessonId);
    try {
      await approveLesson(lessonId);
      showToast("Teacher lesson successfully verified & approved!", "success");
      setAdminLessons((prev) =>
        prev.map((l) => (l.id === lessonId ? { ...l, status: "approved" } : l))
      );
    } catch (err) {
      console.error("Failed to approve lesson:", err);
      showToast("Failed to verify/approve lesson.", "error");
    } finally {
      setIsApprovingLesson(null);
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

  const handleSaveSpotlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotlightUser) return;
    if (!spotlightReasonText.trim()) {
      showToast("Please provide a spotlight commendation reason.", "error");
      return;
    }
    setIsSubmittingSpotlight(true);
    try {
      const updates = {
        weeklySpotlight: true,
        spotlightReason: spotlightReasonText.trim(),
        spotlightWeek: spotlightWeekText.trim() || `Week of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      };
      await updateUserProfileDetails(spotlightUser.userId, updates);
      setUsersList((prev) =>
        prev.map((u) => (u.userId === spotlightUser.userId ? { ...u, ...updates } : u))
      );
      showToast(`${spotlightUser.name} has been promoted to Weekly Student Spotlight! 🌟`, "success");
      setSpotlightUser(null);
      setSpotlightReasonText("");
      setSpotlightWeekText("");
    } catch (err) {
      console.error("Failed to pin student spotlight:", err);
      showToast("Failed to promote student to spotlight.", "error");
    } finally {
      setIsSubmittingSpotlight(false);
    }
  };

  const handleRemoveSpotlight = async (userId: string, userName: string) => {
    try {
      const updates = {
        weeklySpotlight: false,
        spotlightReason: "",
        spotlightWeek: ""
      };
      await updateUserProfileDetails(userId, updates);
      setUsersList((prev) =>
        prev.map((u) => (u.userId === userId ? { ...u, ...updates } : u))
      );
      showToast(`Removed ${userName} from Student Spotlight.`, "info");
      if (spotlightUser?.userId === userId) {
        setSpotlightUser(null);
      }
    } catch (err) {
      console.error("Failed to remove student spotlight:", err);
      showToast("Failed to remove spotlight.", "error");
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

  // Submit Founder Form (Add or Edit)
  const handleSubmitFounder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!founderName || !founderRole || !founderSchool || !founderBio) {
      showToast("Please fill in all required founder fields.", "error");
      return;
    }
    
    setIsSubmittingFounder(true);
    try {
      const founderData = {
        name: founderName.trim(),
        role: founderRole.trim(),
        school: founderSchool.trim(),
        bio: founderBio.trim(),
        imageUrl: founderImageUrl.trim() || undefined,
        displayOrder: Number(founderDisplayOrder) || 1
      };

      if (selectedFounder) {
        // Edit Mode
        await updateFounder(selectedFounder.id, founderData);
        showToast("Founder updated successfully!", "success");
      } else {
        // Create Mode
        await createFounder(founderData);
        showToast("New Founder added successfully!", "success");
      }

      // Reset Form
      setFounderName("");
      setFounderRole("");
      setFounderSchool("");
      setFounderBio("");
      setFounderImageUrl("");
      setFounderDisplayOrder(foundersList.length + 2);
      setSelectedFounder(null);
      
      // Reload Data
      loadAdminData();
    } catch (err) {
      console.error("Failed to submit founder:", err);
      showToast("Failed to submit founder.", "error");
    } finally {
      setIsSubmittingFounder(false);
    }
  };

  // Delete Founder
  const handleDeleteFounder = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this founder/developer? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteFounder(id);
      showToast("Founder successfully removed.", "success");
      loadAdminData();
    } catch (err) {
      console.error("Failed to delete founder:", err);
      showToast("Failed to delete founder.", "error");
    }
  };

  // Select Founder for Editing
  const handleEditFounderSelect = (founder: Founder) => {
    setSelectedFounder(founder);
    setFounderName(founder.name);
    setFounderRole(founder.role);
    setFounderSchool(founder.school);
    setFounderBio(founder.bio);
    setFounderImageUrl(founder.imageUrl || "");
    setFounderDisplayOrder(founder.displayOrder);
  };

  // Cancel edit mode
  const handleCancelFounderEdit = () => {
    setSelectedFounder(null);
    setFounderName("");
    setFounderRole("");
    setFounderSchool("");
    setFounderBio("");
    setFounderImageUrl("");
    setFounderDisplayOrder(foundersList.length + 1);
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
          { id: "branding", label: "Branding & Logo", icon: Sparkles },
          { id: "founders", label: "Manage Founders", icon: Users }
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
            {user.email && isAdminEmail(user.email) && (
              <div className="bg-blue-50 border border-blue-200/60 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wide">Super Admin Mode Active</h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Welcome, <strong>{user.name}</strong>. As a Super Administrator, you have total access. You can manage student, teacher, and administrator accounts instantly by changing their roles in the table dropdowns below.
                  </p>
                </div>
              </div>
            )}

            {/* Top Weekly Learners Quick-Pin Card Deck */}
            <div className="bg-gradient-to-br from-amber-500/5 to-yellow-500/5 border border-amber-250/50 rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-amber-900 tracking-tight flex items-center gap-2">
                  <Trophy className="h-4.5 w-4.5 text-amber-600 fill-amber-500/15" />
                  Top Weekly Learners (Pin Candidates)
                </h3>
                <p className="text-[11px] text-amber-700 leading-normal mt-0.5">
                  These students have accumulated the most XP over the last 7 days. Pin them to the EFC homepage to display them to all visitors!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {usersList
                  .filter((u) => !u.role || u.role === "student")
                  .map((u) => ({ ...u, weeklyXpVal: getWeeklyXp(u) }))
                  .sort((a, b) => b.weeklyXpVal - a.weeklyXpVal)
                  .slice(0, 3)
                  .map((usr, idx) => {
                    const isPinned = usr.weeklySpotlight;
                    return (
                      <div key={usr.userId} className="bg-white rounded-xl border border-slate-150 p-4 flex flex-col justify-between shadow-xs relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-amber-500/10 rounded-bl-lg px-2 py-0.5 text-[9px] font-extrabold text-amber-700 font-mono">
                          #{idx + 1} This Week
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center text-xs">
                              {usr.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800 line-clamp-1">{usr.name}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{usr.school}</div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-xs border-t border-slate-100/50 pt-2 font-mono">
                            <span className="text-slate-500 font-sans font-medium text-[10px] uppercase tracking-wide">Recent Milestones</span>
                            <span className="font-extrabold text-amber-600">{usr.weeklyXpVal} XP</span>
                          </div>
                        </div>
                        <div className="pt-3">
                          {isPinned ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveSpotlight(usr.userId, usr.name)}
                              className="w-full text-center text-[10px] font-extrabold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 py-1.5 rounded-lg transition"
                            >
                              Unpin from Homepage ✕
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSpotlightUser(usr);
                                setSpotlightReasonText(`${usr.name} topped our weekly academic standings this week with an exceptional milestone of ${usr.weeklyXpVal} XP earned! Connect with them to share speaking, listening, and debating techniques.`);
                                setSpotlightWeekText(`Week of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
                              }}
                              className="w-full text-center text-[10px] font-extrabold text-slate-900 bg-amber-100 hover:bg-amber-200 border border-amber-250 py-1.5 rounded-lg transition cursor-pointer active:scale-95 shadow-sm"
                            >
                              Pin to Homepage 👑
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

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
                      <th className="py-3 px-4 text-center">Weekly Spotlight</th>
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
                          const isSuperAdminUser = usr.email ? isAdminEmail(usr.email) : false;
                          const isCurrentSuperAdmin = user.email ? isAdminEmail(user.email) : false;
                          
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
                              <td className="py-3.5 px-4 text-center">
                                {(!usr.role || usr.role === "student") ? (
                                  usr.weeklySpotlight ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-slate-950 font-extrabold px-2 py-0.5 text-[9px] uppercase tracking-wider animate-pulse">
                                        👑 Active
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSpotlight(usr.userId, usr.name)}
                                        className="text-[9px] font-bold text-rose-500 hover:underline hover:text-rose-600 transition cursor-pointer"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSpotlightUser(usr);
                                        setSpotlightReasonText("");
                                        setSpotlightWeekText(`Week of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
                                      }}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-amber-700 bg-slate-50 hover:bg-amber-50 border border-slate-200/60 hover:border-amber-200/60 px-2.5 py-1.2 rounded-xl transition cursor-pointer"
                                    >
                                      Pin 👑
                                    </button>
                                  )
                                ) : (
                                  <span className="text-slate-300 font-mono">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Spotlight Modal Dialog */}
            {spotlightUser && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500/10" />
                      Pin Weekly Student Spotlight
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSpotlightUser(null)}
                      className="text-slate-400 hover:text-slate-600 font-extrabold text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveSpotlight} className="space-y-4">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Target Student</div>
                      <div className="text-sm font-bold text-slate-800 mt-1">{spotlightUser.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{spotlightUser.school} • {spotlightUser.xp} XP</div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Commendation Reason / Praise
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={spotlightReasonText}
                          onChange={(e) => setSpotlightReasonText(e.target.value)}
                          placeholder="e.g. Generas has demonstrated extreme dedication this week by completing all speaking challenges, maintaining a 7-day streak, and actively helping other students revise their essay drafts. An exemplary EFC student!"
                          className="w-full text-xs font-medium text-slate-800 border border-slate-200 rounded-xl p-3 focus:border-blue-500 outline-none transition leading-relaxed resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Active Spotlight Week
                        </label>
                        <input
                          type="text"
                          required
                          value={spotlightWeekText}
                          onChange={(e) => setSpotlightWeekText(e.target.value)}
                          placeholder="e.g. Week of Jun 26, 2026"
                          className="w-full text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 focus:border-blue-500 outline-none transition bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSpotlightUser(null)}
                        className="rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 font-bold text-xs px-5 py-2.5 transition cursor-pointer"
                        disabled={isSubmittingSpotlight}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-slate-900 text-white font-extrabold text-xs px-6 py-2.5 hover:bg-slate-800 active:scale-95 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-80"
                        disabled={isSubmittingSpotlight}
                      >
                        {isSubmittingSpotlight ? (
                          <>
                            <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Pinning...
                          </>
                        ) : (
                          "Confirm Spotlight 🌟"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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

            {/* Pending Teacher Lessons Verification */}
            <div className="border-t border-slate-100 pt-8 mt-8 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="h-5 w-5 text-indigo-600 animate-pulse" />
                  Teacher Course & Lesson Verification Queue
                </h3>
                <p className="text-xs text-slate-500">
                  Review and verify lesson drafts submitted by school teachers before they go live on the platform every Monday.
                </p>
              </div>

              {adminLessons.filter(l => l.status === "pending").length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs font-semibold text-slate-400">
                  No teacher course or lesson drafts are currently pending verification.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {adminLessons.filter(l => l.status === "pending").map((lesson) => (
                    <div key={lesson.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-extrabold text-slate-900">{lesson.title}</h4>
                          <p className="text-xs text-slate-500">
                            Submitted by <strong>Teacher {lesson.createdByTeacherName || "Faculty Member"}</strong> on {new Date(lesson.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-100 uppercase capitalize">
                            {lesson.category}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-100 uppercase">
                            {lesson.difficultyLevel}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Lesson Body & Syllabus:</h5>
                        <div className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                          {lesson.contentBody}
                        </div>
                      </div>

                      {lesson.resources && lesson.resources.length > 0 && (
                        <div className="space-y-1">
                          <h5 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Reference Materials:</h5>
                          <div className="flex flex-wrap gap-1.5">
                            {lesson.resources.map((res, i) => (
                              <span key={i} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {res}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center bg-white border border-slate-200/50 rounded-lg px-4 py-3">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-indigo-500" />
                          Release Target Monday: <strong className="text-indigo-950">{lesson.weeklyScheduleDate || "Next Monday Cycle"}</strong>
                        </span>

                        <button
                          onClick={() => handleApproveLesson(lesson.id)}
                          disabled={isApprovingLesson === lesson.id}
                          className="rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-extrabold px-4 py-2 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isApprovingLesson === lesson.id ? (
                            <>
                              <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Verify & Approve Course
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

            {/* Cloudinary Integration Credentials Status */}
            <div className="bg-blue-50/50 rounded-2xl border border-blue-100/50 p-4 space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Cloudinary Upload Service: Active</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Cloud Name
                  </label>
                  <input
                    type="text"
                    placeholder="dzllg8zxm"
                    value={cloudinaryCloudName}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setCloudinaryCloudName(val);
                      localStorage.setItem("cloudinary_cloud_name", val);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    API Key
                  </label>
                  <input
                    type="text"
                    placeholder="375193569628911"
                    value={cloudinaryApiKey}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setCloudinaryApiKey(val);
                      localStorage.setItem("cloudinary_api_key", val);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Cloudinary Upload Preset (Unsigned)
                </label>
                <input
                  type="text"
                  placeholder="ml_default"
                  value={cloudinaryPreset}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setCloudinaryPreset(val);
                    localStorage.setItem("cloudinary_upload_preset", val);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-blue-500"
                />
                <span className="text-[9px] text-slate-400 block mt-1 leading-normal">
                  To enable direct browser-based uploads, make sure your Cloudinary settings have an "unsigned" upload preset named <code className="bg-slate-150 px-1 py-0.5 rounded text-slate-700 font-mono">ml_default</code> (or type your custom preset above).
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

        {activeTab === "founders" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Form (Add or Edit) */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4 sticky top-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider border border-blue-100">
                    {selectedFounder ? "Edit Mode" : "Creation Mode"}
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {selectedFounder ? "Update Founder Details" : "Register New Founder"}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Provide the academic credentials, biographic profile, and portrait picture of the young leader.
                  </p>
                </div>

                <form onSubmit={handleSubmitFounder} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alice Kanyana"
                      value={founderName}
                      onChange={(e) => setFounderName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Active Role *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Platform Architect"
                        value={founderRole}
                        onChange={(e) => setFounderRole(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Display Order (Rank) *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={founderDisplayOrder}
                        onChange={(e) => setFounderDisplayOrder(Number(e.target.value) || 1)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">High School Affiliation *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gisenyi High School"
                      value={founderSchool}
                      onChange={(e) => setFounderSchool(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Portrait/Image Photo (Optional)</label>
                    <div className="flex flex-col sm:flex-row items-stretch gap-2">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={founderImageUrl}
                        onChange={(e) => setFounderImageUrl(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                      
                      {/* Cloudinary Instant Photo Upload Button */}
                      <div className="relative">
                        <input
                          type="file"
                          id="founder-photo-file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              if (file.size > 5 * 1024 * 1024) {
                                showToast("Founder portrait must be less than 5MB.", "error");
                                return;
                              }
                              setIsUploadingFounderPhoto(true);
                              try {
                                const url = await uploadImageToCloudinary(file, cloudinaryPreset);
                                setFounderImageUrl(url);
                                showToast("Founder photo uploaded to Cloudinary!", "success");
                              } catch (err) {
                                console.error("Founder photo upload failed:", err);
                                showToast("Failed to upload founder photo.", "error");
                              } finally {
                                setIsUploadingFounderPhoto(false);
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          disabled={isUploadingFounderPhoto}
                          onClick={() => document.getElementById("founder-photo-file")?.click()}
                          className="h-full rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm min-h-[38px]"
                        >
                          {isUploadingFounderPhoto ? (
                            <>
                              <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5" />
                              Upload Image
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Live Preview of Founder Image */}
                    {founderImageUrl && (
                      <div className="mt-2.5 flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                        <div className="h-12 w-12 rounded-xl overflow-hidden border border-slate-100 shadow-xs flex-shrink-0 bg-white">
                          <img src={founderImageUrl} alt="Founder Preview" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-500 block">Previewing Image</span>
                          <span className="text-[9px] text-slate-400 block truncate font-mono">{founderImageUrl}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFounderImageUrl("")}
                          className="ml-auto text-[10px] font-extrabold text-red-600 hover:underline px-2"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 block mt-1.5 leading-relaxed">
                      Upload a square portrait of the pioneer, or paste a direct image URL. Left blank, default initials fallback will be used.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Inspiring Biography (Bio) *</label>
                    <textarea
                      required
                      rows={4}
                      maxLength={300}
                      placeholder="Share their story and contribution to the campaign..."
                      value={founderBio}
                      onChange={(e) => setFounderBio(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                      <span>Maximum 300 characters</span>
                      <span>{founderBio.length}/300</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {selectedFounder && (
                      <button
                        type="button"
                        onClick={handleCancelFounderEdit}
                        className="flex-1 rounded-xl border border-slate-200 text-slate-600 font-bold px-4 py-2.5 text-xs hover:bg-slate-50 cursor-pointer text-center"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmittingFounder}
                      className="flex-2 rounded-xl bg-blue-600 text-white font-bold px-5 py-2.5 text-xs hover:bg-blue-500 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-md"
                    >
                      {isSubmittingFounder ? (
                        <>
                          <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Saving...
                        </>
                      ) : selectedFounder ? (
                        "Update Founder Profile"
                      ) : (
                        "Add Campaign Founder"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column: List of Current Founders */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Active Founders & Developers ({foundersList.length})</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    These profiles are loaded in order of display order and presented in the campaign's main landing page.
                  </p>
                </div>

                {isLoadingFounders ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                      Retrieving Campaign Profiles...
                    </p>
                  </div>
                ) : foundersList.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl p-6">
                    <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-600">No founders registered yet</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Use the creation form on the left to register the pioneering leaders.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {foundersList.map((founder) => (
                      <div key={founder.id} className="py-4 flex gap-4 first:pt-0 last:pb-0 group">
                        {/* Avatar */}
                        {founder.imageUrl ? (
                          <div className="h-12 w-12 rounded-xl overflow-hidden border border-slate-100 shadow-xs flex-shrink-0 bg-slate-50">
                            <img src={founder.imageUrl} alt={founder.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-50 to-indigo-100 border border-indigo-100 flex items-center justify-center text-blue-700 font-extrabold text-sm shadow-xs flex-shrink-0">
                            {founder.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                          </div>
                        )}

                        {/* Text Info */}
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                                {founder.name}
                                <span className="font-mono bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                                  Rank #{founder.displayOrder}
                                </span>
                              </h4>
                              <p className="text-[11px] font-bold text-orange-600 mt-0.5">
                                {founder.role} • <span className="text-slate-400 font-medium">{founder.school}</span>
                              </p>
                            </div>

                            {/* Actions Buttons */}
                            <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleEditFounderSelect(founder)}
                                className="h-7 w-7 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center bg-white transition hover:scale-105 cursor-pointer"
                                title="Edit Profile"
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFounder(founder.id)}
                                className="h-7 w-7 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 flex items-center justify-center bg-white transition hover:scale-105 cursor-pointer"
                                title="Delete Profile"
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 leading-relaxed font-normal italic">
                            "{founder.bio}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminPanel;
