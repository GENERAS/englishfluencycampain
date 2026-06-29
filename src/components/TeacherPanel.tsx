import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, 
  Plus, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Calendar, 
  AlertCircle, 
  Check, 
  Info, 
  ChevronRight, 
  GraduationCap, 
  ShieldAlert, 
  RefreshCw,
  Upload
} from "lucide-react";
import { Lesson, LessonTracking, UserProfile } from "../types";
import { getLessons, getLessonTrackings, createTeacherLesson, uploadPdfFile } from "../firebase-utils";
import { useToast } from "./Toast";

interface TeacherPanelProps {
  user: UserProfile;
}

export const TeacherPanel: React.FC<TeacherPanelProps> = ({ user }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "create" | "my-lessons">("overview");

  // State
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [trackings, setTrackings] = useState<LessonTracking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Form State
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonCategory, setLessonCategory] = useState<"grammar" | "vocabulary" | "challenge" | "prompt">("grammar");
  const [lessonDifficulty, setLessonDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [lessonBody, setLessonBody] = useState("");
  const [lessonResources, setLessonResources] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        showToast("Please upload a PDF file only.", "error");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast("PDF must be smaller than 10MB.", "error");
        return;
      }

      setIsUploadingPdf(true);
      try {
        const fileUrl = await uploadPdfFile(file);
        if (lessonResources) {
          setLessonResources(prev => `${prev}, ${fileUrl}`);
        } else {
          setLessonResources(fileUrl);
        }
        showToast(`Successfully uploaded PDF: ${file.name}! Added to Study Materials.`, "success");
      } catch (err) {
        console.error("PDF upload failed:", err);
        showToast("Failed to upload PDF. Please try again.", "error");
      } finally {
        setIsUploadingPdf(false);
      }
    }
  };

  // Time-locked publication values
  const [lastCreatedLesson, setLastCreatedLesson] = useState<Lesson | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [canPublish, setCanPublish] = useState<boolean>(true);

  // Calculate next Monday date formatted
  const getNextMondayFormatted = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(today.getTime() + daysUntilNextMonday * 24 * 60 * 60 * 1000);
    return nextMonday.toLocaleDateString("en-US", { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const fetchedLessons = await getLessons();
      const fetchedTrackings = await getLessonTrackings();
      setLessons(fetchedLessons);
      setTrackings(fetchedTrackings);

      // Check last lesson added by this specific teacher
      const teacherLessons = fetchedLessons.filter(l => l.createdBy === user.userId);
      if (teacherLessons.length > 0) {
        // Sort by creation date (latest first)
        const sorted = [...teacherLessons].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const latest = sorted[0];
        setLastCreatedLesson(latest);

        // Check 7 days limit rule
        const msSinceLast = Date.now() - new Date(latest.createdAt).getTime();
        const limitMs = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
        if (msSinceLast < limitMs) {
          const remainingMs = limitMs - msSinceLast;
          const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
          setDaysRemaining(remainingDays);
          setCanPublish(false);
        } else {
          setDaysRemaining(0);
          setCanPublish(true);
        }
      } else {
        setLastCreatedLesson(null);
        setDaysRemaining(0);
        setCanPublish(true);
      }
    } catch (err) {
      console.error("Error loading teacher panel data:", err);
      showToast("Could not load latest lessons or student metrics.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.userId]);

  // Handle Lesson Submission
  const handleCreateLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canPublish) {
      showToast(`Rule Violation: You must wait ${daysRemaining} more days before publishing a new lesson.`, "error");
      return;
    }

    if (!lessonTitle.trim()) {
      showToast("Lesson title is required.", "error");
      return;
    }

    if (!lessonBody.trim()) {
      showToast("Lesson content is required.", "error");
      return;
    }

    setIsPublishing(true);
    try {
      const resourcesList = lessonResources
        ? lessonResources.split(",").map(r => r.trim()).filter(Boolean)
        : [];

      const targetMonday = getNextMondayFormatted();

      await createTeacherLesson(
        lessonTitle,
        lessonCategory,
        lessonDifficulty,
        lessonBody,
        resourcesList,
        user.userId,
        user.name,
        targetMonday
      );

      showToast("Your lesson has been drafted and submitted to Administrators for verification!", "success");
      
      // Clear fields
      setLessonTitle("");
      setLessonBody("");
      setLessonResources("");
      
      // Reload and switch tab
      await loadData();
      setActiveTab("my-lessons");
    } catch (err) {
      console.error("Error publishing teacher lesson:", err);
      showToast("Failed to submit lesson. Please try again.", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  // Filter lessons created by this teacher
  const myLessons = lessons.filter(l => l.createdBy === user.userId);

  // Calculate metrics
  const totalMyLessons = myLessons.length;
  const verifiedMyLessons = myLessons.filter(l => l.status === "approved").length;
  const pendingMyLessons = myLessons.filter(l => l.status === "pending").length;

  // Track enrollments & completions for teacher's lessons
  const getLessonStats = (lessonId: string) => {
    const lessonTrackings = trackings.filter(t => t.lessonId === lessonId);
    const enrolledCount = lessonTrackings.length; // Enrolled status + completed status
    const completedCount = lessonTrackings.filter(t => t.status === "completed").length;
    return { enrolledCount, completedCount, students: lessonTrackings };
  };

  // Calculate aggregate metrics across all teacher's lessons
  const aggregateMetrics = myLessons.reduce((acc, lesson) => {
    const stats = getLessonStats(lesson.id);
    acc.totalEnrollments += stats.enrolledCount;
    acc.totalCompletions += stats.completedCount;
    return acc;
  }, { totalEnrollments: 0, totalCompletions: 0 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome & Role Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10">
          <GraduationCap className="h-64 w-64 text-white" />
        </div>
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-bold text-indigo-200 border border-indigo-500/30">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ES Rubengera TSS Campaign Faculty
          </div>
          <h1 className="text-2xl font-extrabold sm:text-3xl tracking-tight">Teacher Campaign Workspace</h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
            Welcome, <strong>Teacher {user.name}</strong>. Create grammar lectures, prompt challenges, and track your students' learning progress and lesson completions.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-2">
        <div className="flex gap-2">
          {[
            { id: "overview", label: "Overview & Analytics", icon: TrendingUp },
            { id: "create", label: "Create Course / Lesson", icon: Plus },
            { id: "my-lessons", label: "My Syllabus & Classes", icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all border cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-950 bg-slate-50 border border-slate-200/60 px-3.5 py-2 rounded-xl transition cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Stats
        </button>
      </div>

      {/* Main Content Areas */}
      {isLoading ? (
        <div className="py-24 text-center">
          <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-bold text-slate-500">Loading campaign stats & teacher records...</p>
        </div>
      ) : (
        <>
          {/* OVERVIEW & ANALYTICS TAB */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stat Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Lessons Created</div>
                  <div className="text-2xl font-extrabold text-slate-900">{totalMyLessons}</div>
                  <p className="text-[10px] text-slate-500 leading-none">All grammar & challenge drafts</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Verified & Active Lessons</div>
                  <div className="text-2xl font-extrabold text-emerald-600">{verifiedMyLessons}</div>
                  <p className="text-[10px] text-slate-500 leading-none">Approved by campaign administrators</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-650">Total Enrolled Students</div>
                  <div className="text-2xl font-extrabold text-blue-600">{aggregateMetrics.totalEnrollments}</div>
                  <p className="text-[10px] text-slate-500 leading-none">Cumulative student enrollment</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Course Completions</div>
                  <div className="text-2xl font-extrabold text-indigo-600">{aggregateMetrics.totalCompletions}</div>
                  <p className="text-[10px] text-slate-500 leading-none">Fully solved lesson quick checks</p>
                </div>
              </div>

              {/* Weekly Schedule Alert Callout */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-6 w-6 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Campaign Publication Cycle</h3>
                    <p className="text-xs text-blue-700 leading-relaxed mt-0.5 max-w-xl">
                      To build an uniform national campaign schedule, the next campaign lesson is scheduled to publish on <strong>{getNextMondayFormatted()} (Monday)</strong>.
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-white px-3.5 py-2 border border-blue-100 text-center shrink-0">
                  <span className="text-[10px] text-blue-600 font-bold block uppercase tracking-wider">Next Release Cycle</span>
                  <span className="text-xs font-extrabold text-slate-800">Every Monday Morning</span>
                </div>
              </div>

              {/* 7-Days publication rule lock indicator */}
              {!canPublish && (
                <div className="bg-orange-50/70 border border-orange-200/50 rounded-2xl p-5 flex items-start gap-3">
                  <AlertCircle className="h-5.5 w-5.5 text-orange-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wide">Publication Time-Lock Engaged</h4>
                    <p className="text-xs text-orange-700 leading-relaxed max-w-2xl">
                      Faculty members can only draft or publish one syllabus course/lesson every 7 days. Your last course was submitted on <strong>{lastCreatedLesson ? new Date(lastCreatedLesson.createdAt).toLocaleDateString() : ""}</strong>. You must wait <strong>{daysRemaining} more days</strong> before your next submission lock opens.
                    </p>
                  </div>
                </div>
              )}

              {/* Class Enrollment List and Engagement */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Student Engagement & Evaluation Log</h3>
                </div>

                {trackings.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-medium">
                    No student enrollment metrics available yet. Once students begin reading and completing lessons, metrics will populate.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                          <th className="py-3 px-2">Student Name</th>
                          <th className="py-3 px-2">Course / Lesson Target</th>
                          <th className="py-3 px-2">Enrollment Status</th>
                          <th className="py-3 px-2">Enrolled Date</th>
                          <th className="py-3 px-2">Completed Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                        {trackings.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 px-2 font-bold text-slate-900">{t.userName}</td>
                            <td className="py-3 px-2 text-slate-600">{t.lessonTitle}</td>
                            <td className="py-3 px-2">
                              {t.status === "completed" ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                  <Check className="h-3 w-3" /> Fully Completed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                                  <Clock className="h-3 w-3 animate-spin-slow" /> Enrolled (Studying)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-2 text-slate-400">{new Date(t.enrolledAt).toLocaleDateString()}</td>
                            <td className="py-3 px-2 text-slate-400">
                              {t.completedAt ? new Date(t.completedAt).toLocaleDateString() : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CREATE LESSON FORM TAB */}
          {activeTab === "create" && (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-start justify-between border-b border-slate-50 pb-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Plus className="h-5 w-5 text-indigo-600" />
                    Draft New Course / Lesson
                  </h3>
                  <p className="text-xs text-slate-400">Create custom grammar lessons, speaking challenges, or essay writing prompts.</p>
                </div>

                {/* Status lock badge */}
                {canPublish ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    <CheckCircle className="h-3.5 w-3.5" /> Lock Status: Open
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-orange-700 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full uppercase tracking-wider shadow-xs animate-pulse">
                    <AlertCircle className="h-3.5 w-3.5" /> Locked: Wait {daysRemaining} days
                  </span>
                )}
              </div>

              {/* Warning panel if locked */}
              {!canPublish && (
                <div className="bg-orange-50/50 border border-orange-200/40 rounded-xl p-4 flex items-start gap-3">
                  <Info className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-800 leading-relaxed">
                    You cannot submit another lesson yet. EFC curriculum regulations mandate that teachers must wait <strong>7 days</strong> between course additions. Your last submission was on <strong>{lastCreatedLesson ? new Date(lastCreatedLesson.createdAt).toLocaleDateString() : ""}</strong>.
                  </p>
                </div>
              )}

              <form onSubmit={handleCreateLessonSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Lesson / Course Title
                    </label>
                    <input
                      type="text"
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      placeholder="e.g. Master the Present Perfect Continuous"
                      className="w-full text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-indigo-500 outline-none transition"
                      disabled={!canPublish}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Content Category
                    </label>
                    <select
                      value={lessonCategory}
                      onChange={(e) => setLessonCategory(e.target.value as any)}
                      className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white focus:border-indigo-500 outline-none transition"
                      disabled={!canPublish}
                    >
                      <option value="grammar">📚 Grammar Class</option>
                      <option value="vocabulary">📖 Vocabulary Guide</option>
                      <option value="challenge">🎙️ Speaking Challenge</option>
                      <option value="prompt">✏️ Writing Prompt</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Target Proficiency Level
                    </label>
                    <select
                      value={lessonDifficulty}
                      onChange={(e) => setLessonDifficulty(e.target.value as any)}
                      className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white focus:border-indigo-500 outline-none transition"
                      disabled={!canPublish}
                    >
                      <option value="Beginner">Beginner (ESL 1-2)</option>
                      <option value="Intermediate">Intermediate (ESL 3-4)</option>
                      <option value="Advanced">Advanced (ESL 5)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Target Publication Cycle Monday
                    </label>
                    <div className="w-full text-xs font-bold text-slate-600 border border-slate-100 bg-slate-50 rounded-xl px-3.5 py-2.5 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      {getNextMondayFormatted()}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Lesson Content / Learning Materials (Supports Heading Styles)
                  </label>
                  <textarea
                    value={lessonBody}
                    onChange={(e) => setLessonBody(e.target.value)}
                    placeholder="Draft the lesson content here. Start paragraphs with ### for subtitles, or * for bullet items."
                    rows={8}
                    className="w-full text-xs font-medium text-slate-800 border border-slate-200 rounded-xl p-3.5 focus:border-indigo-500 outline-none transition resize-none leading-relaxed"
                    disabled={!canPublish}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Study Materials / External Resource URLs (Optional, Comma-Separated)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={lessonResources}
                      onChange={(e) => setLessonResources(e.target.value)}
                      placeholder="e.g. https://dictionary.cambridge.org, https://britishcouncil.org"
                      className="flex-1 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-indigo-500 outline-none transition"
                      disabled={!canPublish}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePdfUpload}
                      accept="application/pdf"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPdf || !canPublish}
                      className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 hover:border-slate-300 font-bold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingPdf ? (
                        <div className="h-4 w-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span>Upload PDF</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    You can input resource links directly or click "Upload PDF" to upload course materials for students.
                  </p>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 text-white font-extrabold text-xs px-6 py-3 hover:bg-indigo-500 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-40"
                    disabled={isPublishing || !canPublish}
                  >
                    {isPublishing ? (
                      <>
                        <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting for Approval...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Draft & Submit Lesson
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MY SYLLABUS & LESSONS TAB */}
          {activeTab === "my-lessons" && (
            <div className="space-y-6">
              {myLessons.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-xs font-medium space-y-3">
                  <BookOpen className="h-10 w-10 text-slate-300 mx-auto" />
                  <p>You haven't added any lessons or courses yet.</p>
                  <button
                    onClick={() => setActiveTab("create")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 mt-2 hover:underline"
                  >
                    Draft your first syllabus now
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myLessons.map((lesson) => {
                    const stats = getLessonStats(lesson.id);
                    return (
                      <div key={lesson.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between gap-5">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-400 capitalize bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md">
                              {lesson.category}
                            </span>

                            {lesson.status === "approved" ? (
                              <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                Active & Approved
                              </span>
                            ) : (
                              <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                Pending Approval
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{lesson.title}</h4>
                            <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold">
                              <span>Proficiency: {lesson.difficultyLevel}</span>
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                              <span>Scheduled: {lesson.weeklyScheduleDate || "Monday release"}</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {lesson.contentBody}
                          </p>
                        </div>

                        {/* Stats for this lesson */}
                        <div className="border-t border-slate-50 pt-3.5 flex items-center justify-between text-xs font-bold bg-slate-50/50 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl border-t">
                          <div className="flex items-center gap-1.5 text-blue-700">
                            <Users className="h-4 w-4 text-blue-500" />
                            Enrolled: {stats.enrolledCount}
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-700">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            Completed: {stats.completedCount}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default TeacherPanel;
