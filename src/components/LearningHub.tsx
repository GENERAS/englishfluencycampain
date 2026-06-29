import React, { useEffect, useState } from "react";
import { BookOpen, FileText, Mic, Star, Sparkles, Brain, Check, ChevronRight, Award, Target, Flame, CheckSquare, MessageSquare, AlertCircle, Calendar, PenTool, Download, Trash2, Cloud, Wifi } from "lucide-react";
import { Lesson, UserProfile } from "../types";
import { getLessons, submitDailyReflection, completeDailyTask, enrollInLesson, completeLesson, getLessonTrackings } from "../firebase-utils";
import { CURRICULUM_MODULES, EFC_STAGES, CurriculumModule, EFC_12_WEEK_PROGRAM, WeekModule } from "../data/curriculumData";
import { DAILY_LEARNING_PATH } from "../data/dailyLearningPathData";
import { useToast } from "./Toast";

interface LearningHubProps {
  user: UserProfile | null;
  onSelectPrompt: (type: "writing" | "speaking", promptText: string) => void;
  onOpenAuth: () => void;
  onUserUpdate?: (updatedProfile: UserProfile) => void;
}

export const LearningHub: React.FC<LearningHubProps> = ({ user, onSelectPrompt, onOpenAuth, onUserUpdate }) => {
  const { showToast } = useToast();
  // Tabs: "dailyPath" | "twelveWeek" | "curriculum" | "custom"
  const [activeTab, setActiveTab] = useState<"dailyPath" | "twelveWeek" | "curriculum" | "custom">("dailyPath");
  
  // 12-Week state
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [completedWeekTopics, setCompletedWeekTopics] = useState<{ [weekNum: number]: { [topic: string]: boolean } }>({});

  // Custom lessons from database state
  const [customLessons, setCustomLessons] = useState<Lesson[]>([]);
  const [selectedCustomLesson, setSelectedCustomLesson] = useState<Lesson | null>(null);
  const [activeCustomCategory, setActiveCustomCategory] = useState<"all" | "grammar" | "vocabulary" | "challenge" | "prompt" | "downloaded">("all");
  const [customLessonsLoading, setCustomLessonsLoading] = useState(true);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [enrolledLessonIds, setEnrolledLessonIds] = useState<string[]>([]);

  // PWA Offline Downloads State
  const [downloadedLessonIds, setDownloadedLessonIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("efc_downloaded_lessons_list");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleToggleDownloadLesson = (lesson: Lesson) => {
    if (downloadedLessonIds.includes(lesson.id)) {
      // Remove download
      const newList = downloadedLessonIds.filter(id => id !== lesson.id);
      setDownloadedLessonIds(newList);
      localStorage.setItem("efc_downloaded_lessons_list", JSON.stringify(newList));
      
      try {
        const storedData = localStorage.getItem("efc_downloaded_lessons_data");
        const parsedData = storedData ? JSON.parse(storedData) : {};
        delete parsedData[lesson.id];
        localStorage.setItem("efc_downloaded_lessons_data", JSON.stringify(parsedData));
      } catch {}
      
      showToast("Lesson removed from offline downloads.", "info");
    } else {
      // Add download
      const newList = [...downloadedLessonIds, lesson.id];
      setDownloadedLessonIds(newList);
      localStorage.setItem("efc_downloaded_lessons_list", JSON.stringify(newList));
      
      try {
        const storedData = localStorage.getItem("efc_downloaded_lessons_data");
        const parsedData = storedData ? JSON.parse(storedData) : {};
        parsedData[lesson.id] = lesson;
        localStorage.setItem("efc_downloaded_lessons_data", JSON.stringify(parsedData));
      } catch {}
      
      showToast("Lesson downloaded for offline use!", "success");
    }
  };

  
  // Custom lesson quick check state
  const [customAnswers, setCustomAnswers] = useState<{ [key: string]: string }>({});
  const [customChecked, setCustomChecked] = useState(false);

  // Curriculum state
  const [selectedCurriculumModule, setSelectedCurriculumModule] = useState<CurriculumModule>(CURRICULUM_MODULES[0]);
  const [completedTopics, setCompletedTopics] = useState<{ [moduleId: string]: { [topic: string]: boolean } }>({});
  const [curriculumAnswers, setCurriculumAnswers] = useState<{ [moduleId: string]: string }>({});
  const [curriculumChecked, setCurriculumChecked] = useState<{ [moduleId: string]: boolean }>({});

  // Daily Learning Path state
  const [currentPathDay, setCurrentPathDay] = useState<number>(1);
  const [vocabQuizAnswers, setVocabQuizAnswers] = useState<{ [key: string]: string }>({});
  const [vocabQuizChecked, setVocabQuizChecked] = useState(false);
  const [grammarAnswers, setGrammarAnswers] = useState<{ [index: number]: string }>({});
  const [grammarChecked, setGrammarChecked] = useState(false);
  const [engagementChecked, setEngagementChecked] = useState({ comment: false, debate: false, activity: false });
  const [reflectionLearned, setReflectionLearned] = useState("");
  const [reflectionDifficult, setReflectionDifficult] = useState("");
  const [reflectionImprove, setReflectionImprove] = useState("");
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);
  const [reflectionSubmitting, setReflectionSubmitting] = useState(false);
  const [reflectionToast, setReflectionToast] = useState<string | null>(null);
  const [expandedWordIndex, setExpandedWordIndex] = useState<number | null>(null);

  // Reset day-specific interactive states when switching day
  useEffect(() => {
    setVocabQuizAnswers({});
    setVocabQuizChecked(false);
    setGrammarAnswers({});
    setGrammarChecked(false);
    setEngagementChecked({ comment: false, debate: false, activity: false });
    setReflectionLearned("");
    setReflectionDifficult("");
    setReflectionImprove("");
    setReflectionSubmitted(false);
    setExpandedWordIndex(null);
    setReflectionToast(null);
  }, [currentPathDay]);

  // Load completedTopics and completedWeekTopics per user from localStorage on mount/user change
  useEffect(() => {
    if (user?.userId) {
      try {
        const key = `efc_completed_topics_${user.userId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          setCompletedTopics(JSON.parse(stored));
        } else {
          setCompletedTopics({});
        }
      } catch (err) {
        console.warn("Failed to load completed topics:", err);
      }
    } else {
      setCompletedTopics({});
    }
  }, [user?.userId]);

  useEffect(() => {
    if (user?.userId) {
      try {
        const key = `efc_completed_week_topics_${user.userId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          setCompletedWeekTopics(JSON.parse(stored));
        } else {
          setCompletedWeekTopics({});
        }
      } catch (err) {
        console.warn("Failed to load completed week topics:", err);
      }
    } else {
      setCompletedWeekTopics({});
    }
  }, [user?.userId]);

  // Persist completedTopics and completedWeekTopics when they change
  useEffect(() => {
    if (user?.userId && Object.keys(completedTopics).length > 0) {
      try {
        const key = `efc_completed_topics_${user.userId}`;
        localStorage.setItem(key, JSON.stringify(completedTopics));
      } catch (err) {
        console.warn("Failed to save completed topics:", err);
      }
    }
  }, [completedTopics, user?.userId]);

  useEffect(() => {
    if (user?.userId && Object.keys(completedWeekTopics).length > 0) {
      try {
        const key = `efc_completed_week_topics_${user.userId}`;
        localStorage.setItem(key, JSON.stringify(completedWeekTopics));
      } catch (err) {
        console.warn("Failed to save completed week topics:", err);
      }
    }
  }, [completedWeekTopics, user?.userId]);

  // Progression path math
  const userXp = user?.xp || 0;
  const getStageForXp = (xp: number) => {
    if (xp >= 1000) return 5;
    if (xp >= 600) return 4;
    if (xp >= 300) return 3;
    if (xp >= 100) return 2;
    return 1;
  };
  const activeStageNum = getStageForXp(userXp);
  const activeStage = EFC_STAGES.find((s) => s.stage === activeStageNum) || EFC_STAGES[0];

  // Load custom lessons from Firestore in background
  useEffect(() => {
    async function loadCustomLessons() {
      try {
        let list = await getLessons();
        
        // Merge offline downloaded custom lessons in case of network issues
        try {
          const storedData = localStorage.getItem("efc_downloaded_lessons_data");
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            const downloadedLessons = Object.values(parsedData) as Lesson[];
            const existingIds = new Set(list.map(l => l.id));
            downloadedLessons.forEach(dl => {
              if (!existingIds.has(dl.id)) {
                list.push(dl);
              }
            });
          }
        } catch (err) {
          console.warn("Failed to merge offline downloaded lessons:", err);
        }

        // Filter out pending lessons so only verified/approved ones are shown to students
        const approved = list.filter(l => l.status !== "pending");
        setCustomLessons(approved);
        
        if (approved.length > 0) {
          const firstLesson = approved[0];
          setSelectedCustomLesson(firstLesson);
          if (user?.userId) {
            await enrollInLesson(user.userId, user.name, firstLesson.id, firstLesson.title);
            setEnrolledLessonIds([firstLesson.id]);
          }
        }

        // Also fetch trackings to identify completed lessons
        if (user?.userId) {
          const trackings = await getLessonTrackings();
          const userTrackings = trackings.filter(t => t.userId === user.userId);
          const completedIds = userTrackings.filter(t => t.status === "completed").map(t => t.lessonId);
          const enrolledIds = userTrackings.map(t => t.lessonId);
          setCompletedLessonIds(completedIds);
          setEnrolledLessonIds(enrolledIds);
        }
      } catch (err) {
        console.error("Failed to load custom lessons or trackings:", err);
      } finally {
        setCustomLessonsLoading(false);
      }
    }
    loadCustomLessons();
  }, [user?.userId]);

  const handleSelectCustomLesson = async (lesson: Lesson) => {
    setSelectedCustomLesson(lesson);
    if (user?.userId) {
      try {
        await enrollInLesson(user.userId, user.name, lesson.id, lesson.title);
        if (!enrolledLessonIds.includes(lesson.id)) {
          setEnrolledLessonIds(prev => [...prev, lesson.id]);
        }
      } catch (err) {
        console.error("Failed to enroll in lesson:", err);
      }
    }
  };

  // Filter custom lessons
  const filteredCustomLessons = customLessons.filter((l) => {
    if (activeCustomCategory === "downloaded") {
      return downloadedLessonIds.includes(l.id);
    }
    return activeCustomCategory === "all" || l.category === activeCustomCategory;
  });

  // Handle topic completion toggle
  const toggleTopicCompleted = (moduleId: string, topic: string) => {
    setCompletedTopics((prev) => {
      const moduleTopics = prev[moduleId] || {};
      return {
        ...prev,
        [moduleId]: {
          ...moduleTopics,
          [topic]: !moduleTopics[topic]
        }
      };
    });
  };

  const getDifficultyBadgeColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      case "Intermediate":
        return "bg-amber-50 text-amber-700 border-amber-200/50";
      case "Advanced":
        return "bg-rose-50 text-rose-700 border-rose-200/50";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/50";
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case "grammar":
        return "📝";
      case "vocabulary":
        return "📖";
      case "challenge":
        return "🎙️";
      case "prompt":
        return "✏️";
      default:
        return "🎓";
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-blue-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10">
          <BookOpen className="h-64 w-64 text-white" />
        </div>
        <div className="max-w-2xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-blue-200">
            <div className="active-indicator"></div>
            National English Fluency Campaign Curriculum
          </div>
          <h1 className="text-2xl font-extrabold sm:text-3xl tracking-tight">Campaign Curriculum Library</h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
            A comprehensive, action-based syllabus to eliminate English fear. Practice daily, take on interactive speaking and writing tasks, and lead your peer community.
          </p>
        </div>
      </div>

      {/* Interactive EFC Progression Path Widget */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              <h2 className="text-base font-extrabold text-slate-900">Your EFC Progression Path</h2>
            </div>
            <p className="text-xs text-slate-500">
              Your English status develops as you earn XP through active speaking and writing.
            </p>
          </div>
          {user ? (
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400">Current Rank:</span>
              <span className={`px-3 py-1 rounded-full border text-xs font-extrabold ${activeStage.accent}`}>
                {activeStage.name}
              </span>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 underline"
            >
              Sign up to track your progression stage →
            </button>
          )}
        </div>

        {/* Horizontal Track representing the 5 stages */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          {EFC_STAGES.map((stg) => {
            const isCompleted = activeStageNum >= stg.stage;
            const isActive = activeStageNum === stg.stage;
            return (
              <div
                key={stg.stage}
                className={`relative rounded-2xl border p-4 transition-all duration-300 flex flex-col justify-between h-full ${
                  isActive
                    ? "border-blue-200 bg-blue-50/20 shadow-xs ring-1 ring-blue-100"
                    : isCompleted
                    ? "border-slate-100 bg-slate-50/50 opacity-80"
                    : "border-slate-100 bg-white opacity-40"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      Stage {stg.stage}
                    </span>
                    {isCompleted ? (
                      <Check className="h-4 w-4 text-emerald-500 bg-emerald-50 rounded-full p-0.5" />
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400">
                        {stg.xpRequired} XP
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-extrabold text-slate-800 leading-tight">
                    {stg.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {stg.desc}
                  </p>
                </div>
                
                {/* Visual Active Status Bar at the bottom */}
                <div className="mt-4 pt-2">
                  <div className={`h-1.5 w-full rounded-full ${
                    isActive ? "bg-blue-600" : isCompleted ? "bg-emerald-500" : "bg-slate-200"
                  }`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs Select Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-2">
        <button
          onClick={() => setActiveTab("dailyPath")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "dailyPath"
              ? "bg-amber-500 text-white shadow-md shadow-amber-500/10"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
          }`}
        >
          <Flame className="h-4 w-4 text-amber-500" />
          EFC Daily Learning Path
        </button>
        <button
          onClick={() => setActiveTab("twelveWeek")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "twelveWeek"
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Calendar className="h-4 w-4 text-blue-500" />
          12-Week Fluency Roadmap (Interactive)
        </button>
        <button
          onClick={() => setActiveTab("curriculum")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "curriculum"
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Sparkles className="h-4 w-4 text-orange-500" />
          Campaign Core Curriculum (22 Modules)
        </button>
        <button
          onClick={() => setActiveTab("custom")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "custom"
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <FileText className="h-4 w-4 text-emerald-500" />
          Classroom Custom Lessons
        </button>
      </div>

      {/* Tab 0: EFC Daily Learning Path */}
      {activeTab === "dailyPath" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Daily Content Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Horizontal Day Switcher */}
            <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm">
              <div className="text-center sm:text-left mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  Weekly Program Schedule
                </span>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Every active student follows the same structure. Select a day to practice:</p>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {DAILY_LEARNING_PATH.map((day) => {
                  const isSelected = currentPathDay === day.dayNum;
                  return (
                    <button
                      key={day.dayNum}
                      onClick={() => setCurrentPathDay(day.dayNum)}
                      className={`rounded-xl p-2.5 text-center transition-all flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 border-slate-900 text-white shadow-md"
                          : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-[9px] font-extrabold uppercase tracking-widest block opacity-70">Day</span>
                      <span className="text-sm font-extrabold">{day.dayNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Day Overview Card */}
            {(() => {
              const currentDay = DAILY_LEARNING_PATH.find((d) => d.dayNum === currentPathDay) || DAILY_LEARNING_PATH[0];
              return (
                <div className="space-y-6">
                  {/* Day Header Banner */}
                  <div className="rounded-3xl border border-amber-100 bg-gradient-to-r from-amber-50/40 via-amber-50/10 to-white p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-600">
                        <Flame className="h-4.5 w-4.5 animate-bounce" />
                        Active Day {currentDay.dayNum} Challenge
                      </div>
                      <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                        {currentDay.theme}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        {currentDay.subtitle}
                      </p>
                    </div>
                    <div className="bg-amber-100/50 border border-amber-200/50 px-4 py-2.5 rounded-2xl max-w-xs text-xs font-bold text-amber-900 leading-relaxed">
                      🎯 <span className="text-amber-800">Objective:</span> {currentDay.objective}
                    </div>
                  </div>

                  {/* STEP 1: Daily Vocabulary */}
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                      <h3 className="text-xs font-extrabold text-slate-850 uppercase tracking-wider flex items-center gap-2">
                        <span className="h-6 w-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs font-mono">1</span>
                        Daily Vocabulary (5–10 minutes)
                      </h3>
                      <span className="text-[10px] text-blue-600 bg-blue-50 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        +5 Words & Meanings
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Learn the 5 new active words below. Click on any word to expand its formal definition and real classroom example sentence:
                    </p>

                    {/* Vocabulary Word Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      {currentDay.vocabulary.map((vocab, index) => {
                        const isExpanded = expandedWordIndex === index;
                        return (
                          <div key={vocab.word} className="space-y-1">
                            <button
                              onClick={() => setExpandedWordIndex(isExpanded ? null : index)}
                              className={`w-full text-left rounded-xl p-3 border transition-all cursor-pointer ${
                                isExpanded
                                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                                  : "bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <div className="text-xs font-extrabold tracking-tight truncate">{vocab.word}</div>
                              <div className={`text-[9px] font-extrabold uppercase tracking-widest mt-0.5 ${isExpanded ? "text-blue-100" : "text-slate-400"}`}>
                                {vocab.type}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Word Details Drawer */}
                    {expandedWordIndex !== null && (() => {
                      const activeVocab = currentDay.vocabulary[expandedWordIndex];
                      return (
                        <div className="bg-blue-50/30 border border-blue-100/60 rounded-2xl p-4 space-y-2 animate-fadeIn">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-blue-900">{activeVocab.word}</span>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded-md uppercase tracking-wider">{activeVocab.type}</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            <span className="font-bold text-slate-900">Meaning:</span> {activeVocab.meaning}
                          </p>
                          <p className="text-xs text-slate-600 leading-relaxed italic bg-white border border-blue-50 p-2.5 rounded-xl">
                            " {activeVocab.example} "
                          </p>
                        </div>
                      );
                    })()}

                    {/* Interactive Vocabulary Quiz */}
                    <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-4.5 mt-2 space-y-4">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4.5 w-4.5 text-blue-600" />
                        <span className="text-xs font-extrabold text-slate-800">Day {currentDay.dayNum} Vocabulary Quiz</span>
                      </div>

                      {currentDay.vocabQuiz.map((q, qIdx) => {
                        const selectedAnswer = vocabQuizAnswers[q.id];
                        return (
                          <div key={q.id} className="space-y-2 pb-3 last:pb-0 border-b border-slate-200/50 last:border-0">
                            <div className="text-xs font-bold text-slate-800 flex items-start gap-1">
                              <span className="font-mono text-[10px] text-slate-400 mt-0.5">Q1.{qIdx + 1}</span>
                              {q.questionText}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {q.options.map((opt) => {
                                const isSelected = selectedAnswer === opt.key;
                                return (
                                  <button
                                    key={opt.key}
                                    disabled={vocabQuizChecked}
                                    onClick={() => setVocabQuizAnswers((prev) => ({ ...prev, [q.id]: opt.key }))}
                                    className={`rounded-xl px-4 py-2.5 text-xs font-bold text-left border transition-all ${
                                      isSelected
                                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                        : "bg-white border-slate-100 text-slate-600 hover:bg-slate-100 cursor-pointer"
                                    }`}
                                  >
                                    <span className="font-mono mr-1.5 text-slate-400 font-extrabold">{opt.key.toUpperCase()}</span>
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>

                            {vocabQuizChecked && (
                              <div className={`p-3 rounded-xl text-xs font-semibold ${
                                selectedAnswer === q.correctAnswer
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                                  : "bg-rose-50 text-rose-800 border border-rose-100"
                              }`}>
                                {selectedAnswer === q.correctAnswer ? (
                                  <div className="flex items-start gap-1.5">
                                    <Check className="h-4.5 w-4.5 text-emerald-600 mt-0.5 shrink-0" />
                                    <div>
                                      <span className="font-bold block text-slate-900">Correct Answer!</span>
                                      {q.explanation}
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="font-bold block text-slate-900">Incorrect</span>
                                    The correct answer is '{q.options.find((o) => o.key === q.correctAnswer)?.label}'. {q.explanation}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {!vocabQuizChecked && (
                        <button
                          onClick={async () => {
                            setVocabQuizChecked(true);
                            if (user) {
                              try {
                                const updatedProfile = await completeDailyTask(user.userId, "vocabulary");
                                if (onUserUpdate) {
                                  onUserUpdate(updatedProfile);
                                }
                              } catch (err) {
                                console.warn("Streak completeDailyTask vocab failed", err);
                              }
                            }
                          }}
                          disabled={Object.keys(vocabQuizAnswers).length < currentDay.vocabQuiz.length}
                          className="rounded-xl bg-slate-950 text-white text-xs font-bold px-4 py-2.5 hover:bg-slate-800 transition cursor-pointer disabled:opacity-40"
                        >
                          Check Quiz Answers
                        </button>
                      )}
                    </div>
                  </div>

                  {/* STEP 2: Grammar Practice */}
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                      <h3 className="text-xs font-extrabold text-slate-850 uppercase tracking-wider flex items-center gap-2">
                        <span className="h-6 w-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs font-mono">2</span>
                        Grammar Practice (10–15 minutes)
                      </h3>
                      <span className="text-[10px] text-purple-600 bg-purple-50 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Study & Test
                      </span>
                    </div>

                    {/* Concept Box */}
                    <div className="bg-purple-50/30 border border-purple-100/60 rounded-2xl p-5 space-y-2">
                      <h4 className="text-xs font-extrabold text-purple-950 uppercase tracking-wide flex items-center gap-1.5">
                        <Brain className="h-4.5 w-4.5 text-purple-600" />
                        Grammar Concept: {currentDay.grammarTitle}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        {currentDay.grammarExplanation}
                      </p>
                    </div>

                    {/* Grammar Exercises */}
                    <div className="space-y-4">
                      {currentDay.grammarExercises.map((ex, exIdx) => {
                        const answer = grammarAnswers[exIdx] || "";
                        return (
                          <div key={exIdx} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40 space-y-3">
                            <div className="text-xs font-bold text-slate-850 flex items-start gap-2">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-extrabold uppercase text-slate-500 font-mono">
                                Ex {exIdx + 1}
                              </span>
                              {ex.questionText}
                            </div>

                            {/* Multiple Choice Exercise */}
                            {ex.type === "multiple-choice" && ex.options && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {ex.options.map((opt) => {
                                  const isSelected = answer === opt.key;
                                  return (
                                    <button
                                      key={opt.key}
                                      disabled={grammarChecked}
                                      onClick={() => setGrammarAnswers((prev) => ({ ...prev, [exIdx]: opt.key }))}
                                      className={`rounded-xl px-4 py-2.5 text-xs font-bold text-left border transition-all ${
                                        isSelected
                                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                          : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50 cursor-pointer"
                                      }`}
                                    >
                                      <span className="font-mono mr-1.5 text-slate-400 font-extrabold">{opt.key.toUpperCase()}</span>
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Text inputs for Fill-in-the-blank and Sentence-correction */}
                            {(ex.type === "fill-in-the-blank" || ex.type === "sentence-correction") && (
                              <input
                                type="text"
                                disabled={grammarChecked}
                                value={answer}
                                onChange={(e) => setGrammarAnswers((prev) => ({ ...prev, [exIdx]: e.target.value }))}
                                placeholder={ex.placeholder || "Type your response here..."}
                                className="w-full text-xs font-bold px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                              />
                            )}

                            {/* Verification Feedback Block */}
                            {grammarChecked && (() => {
                              const isCorrect = ex.type === "multiple-choice"
                                ? answer === ex.correctAnswer
                                : answer.toLowerCase().trim() === ex.correctAnswer.toLowerCase().trim();
                              return (
                                <div className={`p-3 rounded-xl text-xs font-semibold ${
                                  isCorrect
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                                    : "bg-rose-50 text-rose-800 border border-rose-100"
                                }`}>
                                  {isCorrect ? (
                                    <div className="flex items-start gap-1.5">
                                      <Check className="h-4.5 w-4.5 text-emerald-600 mt-0.5 shrink-0" />
                                      <div>
                                        <span className="font-bold block text-slate-900">Correct!</span>
                                        {ex.explanation}
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="font-bold block text-slate-900">Let's Try Again</span>
                                      Expected response: <strong className="text-slate-900 font-extrabold font-mono">"{ex.correctAnswer}"</strong>. {ex.explanation}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}

                      {!grammarChecked && (
                        <button
                          onClick={() => setGrammarChecked(true)}
                          disabled={Object.keys(grammarAnswers).length < currentDay.grammarExercises.length}
                          className="rounded-xl bg-slate-950 text-white text-xs font-bold px-4 py-2.5 hover:bg-slate-800 transition cursor-pointer disabled:opacity-40"
                        >
                          Check Grammar Answers
                        </button>
                      )}
                    </div>
                  </div>

                  {/* STEP 3 & STEP 4: Speaking & Writing Workouts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* STEP 3: Speaking */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                          <h3 className="text-xs font-extrabold text-slate-850 uppercase tracking-wider flex items-center gap-2">
                            <span className="h-6 w-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs font-mono">3</span>
                            Speaking Task (10–15 mins)
                          </h3>
                        </div>
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full block w-fit">
                          Audio Record
                        </span>
                        <p className="text-xs text-slate-850 font-extrabold leading-relaxed">
                          {currentDay.speakingTask}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-50 mt-4">
                        {user ? (
                          <button
                            onClick={() => onSelectPrompt("speaking", currentDay.speakingTask)}
                            className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 text-xs shadow-sm cursor-pointer transition flex items-center justify-center gap-2"
                          >
                            <Mic className="h-4 w-4" />
                            Launch Speech Recorder
                          </button>
                        ) : (
                          <button
                            onClick={onOpenAuth}
                            className="w-full rounded-xl bg-slate-900 text-white text-xs font-bold py-2.5 hover:bg-slate-800 cursor-pointer"
                          >
                            Login to Submit Record
                          </button>
                        )}
                      </div>
                    </div>

                    {/* STEP 4: Writing */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                          <h3 className="text-xs font-extrabold text-slate-850 uppercase tracking-wider flex items-center gap-2">
                            <span className="h-6 w-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono">4</span>
                            Writing Task (10–20 mins)
                          </h3>
                        </div>
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full block w-fit">
                          Paragraph/Letter
                        </span>
                        <p className="text-xs text-slate-850 font-extrabold leading-relaxed">
                          {currentDay.writingTask}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-50 mt-4">
                        {user ? (
                          <button
                            onClick={() => onSelectPrompt("writing", currentDay.writingTask)}
                            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 text-xs shadow-sm cursor-pointer transition flex items-center justify-center gap-2"
                          >
                            <PenTool className="h-4 w-4" />
                            Write Response Essay
                          </button>
                        ) : (
                          <button
                            onClick={onOpenAuth}
                            className="w-full rounded-xl bg-slate-900 text-white text-xs font-bold py-2.5 hover:bg-slate-800 cursor-pointer"
                          >
                            Login to Draft Essay
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* STEP 5: Community Engagement */}
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                      <h3 className="text-xs font-extrabold text-slate-850 uppercase tracking-wider flex items-center gap-2">
                        <span className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs font-mono">5</span>
                        Community Engagement (5–10 minutes)
                      </h3>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Social Interaction
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      English is a social tool! To foster collaboration, complete the following three interactive community duties:
                    </p>

                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { key: "comment", label: "Comment on at least one classmate's speaking or writing submission.", desc: "Provide polite feedback and encourage their progress." },
                        { key: "debate", label: "Respond to at least one active debate discussion inside the Debate Arena.", desc: "Practice stating your opinion with clear contrast linkers." },
                        { key: "activity", label: "Participate in an active community campaign activity or help a peer.", desc: "Build the team spirit that defines EFC Rwanda." }
                      ].map((item) => {
                        const isDone = (engagementChecked as any)[item.key];
                        return (
                          <button
                            key={item.key}
                            onClick={() => setEngagementChecked(prev => ({ ...prev, [item.key]: !isDone }))}
                            className={`text-left p-3.5 rounded-2xl border flex items-start gap-3 transition-all cursor-pointer ${
                              isDone
                                ? "bg-emerald-50/30 border-emerald-100 text-slate-900"
                                : "bg-slate-50/50 border-slate-100 hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className={`mt-0.5 h-5 w-5 rounded-md flex items-center justify-center border shrink-0 transition-all ${
                              isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-white"
                            }`}>
                              {isDone && <Check className="h-3 w-3" />}
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-xs font-extrabold leading-tight">{item.label}</div>
                              <div className="text-[10px] text-slate-400 font-normal">{item.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* STEP 6: Reflection Form */}
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                      <h3 className="text-xs font-extrabold text-slate-850 uppercase tracking-wider flex items-center gap-2">
                        <span className="h-6 w-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs font-mono">6</span>
                        Self-Evaluation & Reflection (2 minutes)
                      </h3>
                      <span className="text-[10px] text-orange-600 bg-orange-50 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        +20 XP Award
                      </span>
                    </div>

                    {reflectionToast && (
                      <div className="p-4 rounded-xl text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span>{reflectionToast}</span>
                      </div>
                    )}

                    {reflectionSubmitted ? (
                      <div className="bg-emerald-50/30 border border-emerald-100 p-6 rounded-2xl text-center space-y-3">
                        <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                          <Check className="h-6 w-6" />
                        </div>
                        <div className="text-sm font-extrabold text-slate-850">Reflection Submitted Successfully!</div>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-semibold">
                          Excellent work! You have successfully recorded your thoughts and earned <strong>+20 XP</strong>. Keep up this incredible momentum.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            1. What did I learn today?
                          </label>
                          <textarea
                            value={reflectionLearned}
                            onChange={(e) => setReflectionLearned(e.target.value)}
                            placeholder="Describe the vocabulary words, grammar structures, or ideas you discovered..."
                            className="w-full text-xs font-semibold p-3.5 border border-slate-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 h-20"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            2. What was difficult about speaking/writing English today?
                          </label>
                          <textarea
                            value={reflectionDifficult}
                            onChange={(e) => setReflectionDifficult(e.target.value)}
                            placeholder={currentDay.reflectionPrompt}
                            className="w-full text-xs font-semibold p-3.5 border border-slate-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 h-20"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            3. What will I improve tomorrow?
                          </label>
                          <textarea
                            value={reflectionImprove}
                            onChange={(e) => setReflectionImprove(e.target.value)}
                            placeholder="What is your strategy for tomorrow's routine?"
                            className="w-full text-xs font-semibold p-3.5 border border-slate-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 h-20"
                          />
                        </div>

                        {user ? (
                          <button
                            onClick={async () => {
                              if (!reflectionLearned || !reflectionDifficult || !reflectionImprove) {
                                alert("Please fill out all reflection questions before submitting.");
                                return;
                              }
                              setReflectionSubmitting(true);
                              try {
                                await submitDailyReflection(
                                  user.userId,
                                  reflectionLearned,
                                  reflectionDifficult,
                                  reflectionImprove
                                );
                                setReflectionSubmitted(true);
                                setReflectionToast("Reflection submitted successfully! +20 XP awarded.");
                              } catch (err) {
                                console.error(err);
                              } finally {
                                setReflectionSubmitting(false);
                              }
                            }}
                            disabled={reflectionSubmitting || !reflectionLearned || !reflectionDifficult || !reflectionImprove}
                            className="w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-40 py-3 text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                          >
                            {reflectionSubmitting ? "Saving Reflection..." : "Submit Daily Reflection & Earn +20 XP"}
                          </button>
                        ) : (
                          <button
                            onClick={onOpenAuth}
                            className="w-full rounded-2xl bg-slate-900 text-white text-xs font-bold py-3 hover:bg-slate-800 cursor-pointer"
                          >
                            Login to Submit Reflection
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Right Column: Weekly & Monthly Requirements Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Weekly Requirements Card */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-blue-600 border-b border-slate-50 pb-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-850">
                  Weekly Requirement
                </h4>
              </div>

              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                To graduation levels, every student must complete the following items every week:
              </p>

              <div className="space-y-2">
                {[
                  { label: "Complete all daily activities", done: vocabQuizChecked && grammarChecked && reflectionSubmitted },
                  { label: "Submit at least one speech recording", done: false },
                  { label: "Submit at least one writing essay", done: false },
                  { label: "Participate in one community debate", done: false }
                ].map((req, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl p-3 border text-xs font-bold flex items-center justify-between transition ${
                      req.done
                        ? "bg-emerald-50/40 border-emerald-100 text-slate-800"
                        : "bg-slate-50/30 border-slate-100 text-slate-600"
                    }`}
                  >
                    <span>{req.label}</span>
                    <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center border shrink-0 transition-all ${
                      req.done ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                    }`}>
                      {req.done && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Requirements Card */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 border-b border-slate-50 pb-3">
                <Award className="h-5 w-5 text-indigo-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-850">
                  Monthly Requirement
                </h4>
              </div>

              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Unlock official English Certificates by completing monthly campaign hurdles:
              </p>

              <div className="space-y-2">
                {[
                  { label: "Complete the Speaking Challenge", desc: "Speak continuously for 3 minutes on a chosen topic." },
                  { label: "Complete the Writing Challenge", desc: "Submit a 250-word argumentative essay." },
                  { label: "Participate in a campaign event", desc: "Join live virtual debate or collaboration webinars." }
                ].map((req, idx) => (
                  <div key={idx} className="rounded-xl p-3.5 border border-slate-100 bg-slate-50/30 space-y-1">
                    <div className="text-xs font-extrabold text-slate-850 flex items-center justify-between">
                      <span>{req.label}</span>
                      <span className="text-[9px] font-extrabold uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200/50">PENDING</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal leading-relaxed">{req.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Campaign Curriculum */}
      {activeTab === "twelveWeek" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Index Column: Weeks 1 - 12 */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm max-h-[600px] overflow-y-auto space-y-3">
              <div className="flex items-center gap-2 px-2 pb-2 border-b border-slate-100">
                <Calendar className="h-4.5 w-4.5 text-blue-600" />
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">12-Week Roadmap</h3>
              </div>
              <div className="space-y-1.5 pt-1">
                {EFC_12_WEEK_PROGRAM.map((wk) => {
                  const isCurrent = selectedWeek === wk.week;
                  const weekDone = completedWeekTopics[wk.week] || {};
                  const doneCount = Object.values(weekDone).filter(Boolean).length;
                  const totalTopics = wk.topics.length;
                  const percentDone = totalTopics > 0 ? Math.round((doneCount / totalTopics) * 100) : 0;
                  
                  return (
                    <button
                      key={wk.week}
                      onClick={() => setSelectedWeek(wk.week)}
                      className={`w-full text-left rounded-xl p-3 border text-xs font-bold transition-all flex items-start gap-3 cursor-pointer ${
                        isCurrent
                          ? "border-blue-500 bg-blue-50/20 text-slate-950"
                          : "border-slate-100 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`h-6 w-6 rounded-lg font-mono text-xs flex items-center justify-center shrink-0 ${
                        isCurrent ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        W{wk.week}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-slate-850 font-bold leading-tight">
                          {wk.title.replace(`Week ${wk.week}: `, "")}
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-slate-400 font-normal truncate max-w-[120px]">
                            {wk.objective}
                          </span>
                          {percentDone > 0 && (
                            <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md shrink-0 ml-1.5">
                              {percentDone}%
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Weekly Detail Board */}
          <div className="lg:col-span-8">
            {(() => {
              const currentWk = EFC_12_WEEK_PROGRAM.find(w => w.week === selectedWeek) || EFC_12_WEEK_PROGRAM[0];
              return (
                <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                  {/* Title & Objective header */}
                  <div className="flex flex-col gap-3 border-b border-slate-100 pb-5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50">
                        Fluency Program Roadmap
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100">
                        Week {currentWk.week} of 12
                      </span>
                    </div>
                    
                    <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl tracking-tight">
                      {currentWk.title}
                    </h2>
                    
                    <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex items-start gap-3">
                      <Target className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold text-slate-800 block text-xs uppercase tracking-wider mb-0.5">Weekly Objective</span>
                        {currentWk.objective}
                      </div>
                    </div>
                  </div>

                  {/* Syllabus topics list */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-emerald-500" />
                      Study Topics Checklist
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentWk.topics.map((topic, i) => {
                        const isDone = completedWeekTopics[currentWk.week]?.[topic] || false;
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setCompletedWeekTopics(prev => {
                                const weekDone = prev[currentWk.week] || {};
                                return {
                                  ...prev,
                                  [currentWk.week]: {
                                    ...weekDone,
                                    [topic]: !weekDone[topic]
                                  }
                                };
                              });
                            }}
                            className={`text-left text-xs font-semibold p-3.5 rounded-xl border flex items-center gap-3 transition cursor-pointer select-none ${
                              isDone
                                ? "bg-emerald-50/40 border-emerald-100 text-slate-800"
                                : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center border shrink-0 transition-all ${
                              isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                            }`}>
                              {isDone && <Check className="h-3 w-3" />}
                            </div>
                            <span>{topic}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Vocabulary & Grammar side-by-side or stacked */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Grammar Card */}
                    {currentWk.grammar && currentWk.grammar.length > 0 && (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/20 p-5 space-y-3">
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <Brain className="h-4 w-4 text-purple-500" />
                          Weekly Grammar Focus
                        </h4>
                        <div className="space-y-1.5">
                          {currentWk.grammar.map((g, i) => (
                            <div key={i} className="text-xs text-slate-700 bg-white border border-slate-100/50 p-2.5 rounded-xl font-bold flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                              {g}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vocabulary Card */}
                    {currentWk.vocabulary && currentWk.vocabulary.length > 0 && (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/20 p-5 space-y-3">
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-amber-500" />
                          Vocabulary Focus
                        </h4>
                        <div className="space-y-1.5">
                          {currentWk.vocabulary.map((v, i) => (
                            <div key={i} className="text-xs text-slate-700 bg-white border border-slate-100/50 p-2.5 rounded-xl font-bold flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                              {v}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Interactive Action Practice tasks */}
                  <div className="space-y-4 border-t border-slate-100 pt-5">
                    <h3 className="text-xs font-extrabold text-slate-850 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-blue-600" />
                      Weekly Speaking & Writing Workouts
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {/* Speaking Tasks */}
                      {currentWk.speakingTasks && currentWk.speakingTasks.map((task, i) => (
                        <div key={`spk-${i}`} className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/30 to-white p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5 text-center sm:text-left">
                            <div className="h-9 w-9 rounded-xl bg-blue-100 border border-blue-200/50 flex items-center justify-center shrink-0 text-blue-600 mt-0.5">
                              <Mic className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-extrabold uppercase tracking-widest text-blue-600 block text-left">Speaking Task</span>
                              <p className="text-xs text-slate-850 font-extrabold leading-relaxed text-left">
                                {task}
                              </p>
                            </div>
                          </div>
                          {user ? (
                            <button
                              onClick={() => onSelectPrompt("speaking", task)}
                              className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 text-xs shadow-sm cursor-pointer transition shrink-0"
                            >
                              Launch Recorder
                            </button>
                          ) : (
                            <button
                              onClick={onOpenAuth}
                              className="rounded-xl bg-slate-900 text-white text-xs font-bold px-4 py-2.5 hover:bg-slate-800 cursor-pointer shrink-0"
                            >
                              Join Campaign
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Writing Tasks */}
                      {currentWk.writingTasks && currentWk.writingTasks.map((task, i) => (
                        <div key={`wrt-${i}`} className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/30 to-white p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5 text-center sm:text-left">
                            <div className="h-9 w-9 rounded-xl bg-indigo-100 border border-indigo-200/50 flex items-center justify-center shrink-0 text-indigo-600 mt-0.5">
                              <PenTool className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 block text-left">Writing Task</span>
                              <p className="text-xs text-slate-850 font-extrabold leading-relaxed text-left">
                                {task}
                              </p>
                            </div>
                          </div>
                          {user ? (
                            <button
                              onClick={() => onSelectPrompt("writing", task)}
                              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 text-xs shadow-sm cursor-pointer transition shrink-0"
                            >
                              Write Response
                            </button>
                          ) : (
                            <button
                              onClick={onOpenAuth}
                              className="rounded-xl bg-slate-900 text-white text-xs font-bold px-4 py-2.5 hover:bg-slate-800 cursor-pointer shrink-0"
                            >
                              Join Campaign
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Debate Tasks */}
                      {currentWk.debate && currentWk.debate.map((task, i) => (
                        <div key={`deb-${i}`} className="rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50/30 to-white p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5 text-center sm:text-left">
                            <div className="h-9 w-9 rounded-xl bg-purple-100 border border-purple-200/50 flex items-center justify-center shrink-0 text-purple-600 mt-0.5">
                              <MessageSquare className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-extrabold uppercase tracking-widest text-purple-600 block text-left">EFC Weekly Debate</span>
                              <p className="text-xs text-slate-850 font-extrabold leading-relaxed text-left">
                                {task}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-extrabold text-purple-600 bg-purple-50 px-2.5 py-1.5 rounded-xl text-center shrink-0">
                            Visit Debate Arena to participate!
                          </span>
                        </div>
                      ))}

                      {/* Showcase activities (Week 12 specific) */}
                      {currentWk.activities && currentWk.activities.map((act, i) => (
                        <div key={`act-${i}`} className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/30 to-white p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5 text-center sm:text-left">
                            <div className="h-9 w-9 rounded-xl bg-emerald-100 border border-emerald-200/50 flex items-center justify-center shrink-0 text-emerald-600 mt-0.5">
                              <Award className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 block text-left">Showcase Activity</span>
                              <p className="text-xs text-slate-850 font-bold leading-relaxed text-left">
                                {act}
                              </p>
                            </div>
                          </div>
                          {user ? (
                            <button
                              onClick={() => onSelectPrompt(i === 0 ? "speaking" : "writing", act)}
                              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 text-xs shadow-sm cursor-pointer transition shrink-0"
                            >
                              Launch Showcase
                            </button>
                          ) : (
                            <button
                              onClick={onOpenAuth}
                              className="rounded-xl bg-slate-900 text-white text-xs font-bold px-4 py-2.5 hover:bg-slate-800 cursor-pointer shrink-0"
                            >
                              Join Campaign
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Outcome */}
                  {currentWk.outcome && (
                    <div className="rounded-2xl bg-amber-50/30 border border-amber-100 p-5 mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-amber-700">
                        <Flame className="h-5 w-5" />
                        <span className="text-xs font-extrabold uppercase tracking-widest">Graduation Milestones</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {currentWk.outcome}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Tab 2: Campaign Curriculum */}
      {activeTab === "curriculum" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left index of levels & 22 modules */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm max-h-[600px] overflow-y-auto space-y-5">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-2">Syllabus Index</h3>
              
              {/* Beginner Section */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 px-2 text-xs font-extrabold text-emerald-600 uppercase tracking-wider">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  Level 1: Beginner
                </div>
                <div className="space-y-1 pt-1.5">
                  {CURRICULUM_MODULES.filter((m) => m.level === "Beginner").map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => setSelectedCurriculumModule(mod)}
                      className={`w-full text-left rounded-xl p-3 border text-xs font-bold transition-all flex items-start gap-3 cursor-pointer ${
                        selectedCurriculumModule.id === mod.id
                          ? "border-blue-500 bg-blue-50/20 text-slate-950"
                          : "border-slate-100 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="shrink-0 text-slate-400 font-mono">0{mod.num}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-slate-850">{mod.title}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">{mod.goal}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Intermediate Section */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 px-2 text-xs font-extrabold text-amber-600 uppercase tracking-wider border-t border-slate-100 pt-4">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  Level 2: Intermediate
                </div>
                <div className="space-y-1 pt-1.5">
                  {CURRICULUM_MODULES.filter((m) => m.level === "Intermediate").map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => setSelectedCurriculumModule(mod)}
                      className={`w-full text-left rounded-xl p-3 border text-xs font-bold transition-all flex items-start gap-3 cursor-pointer ${
                        selectedCurriculumModule.id === mod.id
                          ? "border-blue-500 bg-blue-50/20 text-slate-950"
                          : "border-slate-100 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="shrink-0 text-slate-400 font-mono">{mod.num < 10 ? `0${mod.num}` : mod.num}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-slate-850">{mod.title}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">{mod.goal}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Section */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 px-2 text-xs font-extrabold text-rose-600 uppercase tracking-wider border-t border-slate-100 pt-4">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  Level 3: Advanced
                </div>
                <div className="space-y-1 pt-1.5">
                  {CURRICULUM_MODULES.filter((m) => m.level === "Advanced").map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => setSelectedCurriculumModule(mod)}
                      className={`w-full text-left rounded-xl p-3 border text-xs font-bold transition-all flex items-start gap-3 cursor-pointer ${
                        selectedCurriculumModule.id === mod.id
                          ? "border-blue-500 bg-blue-50/20 text-slate-950"
                          : "border-slate-100 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="shrink-0 text-slate-400 font-mono">{mod.num}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-slate-850">{mod.title}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">{mod.goal}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Modules Section */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 px-2 text-xs font-extrabold text-purple-600 uppercase tracking-wider border-t border-slate-100 pt-4">
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  Special Modules
                </div>
                <div className="space-y-1 pt-1.5">
                  {CURRICULUM_MODULES.filter((m) => m.level === "Special").map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => setSelectedCurriculumModule(mod)}
                      className={`w-full text-left rounded-xl p-3 border text-xs font-bold transition-all flex items-start gap-3 cursor-pointer ${
                        selectedCurriculumModule.id === mod.id
                          ? "border-blue-500 bg-blue-50/20 text-slate-950"
                          : "border-slate-100 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="shrink-0 text-slate-400 font-mono">{mod.num}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-slate-850">{mod.title}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">{mod.goal}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Active curriculum module details */}
          <div className="lg:col-span-8">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100">
                      Module {selectedCurriculumModule.num}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${getDifficultyBadgeColor(selectedCurriculumModule.level)}`}>
                      {selectedCurriculumModule.level} Level
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl tracking-tight">
                    {selectedCurriculumModule.title}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold bg-blue-50/30 border border-blue-50 px-3 py-1.5 rounded-xl w-fit">
                    <Target className="h-4 w-4 shrink-0" />
                    <span>Goal: {selectedCurriculumModule.goal}</span>
                  </div>
                </div>
              </div>

              {/* Topics checklists */}
              <div className="rounded-2xl border border-slate-50 bg-slate-50/30 p-5 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-emerald-500" />
                  Module Sub-Topics Checklist
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {selectedCurriculumModule.topics.map((topic, i) => {
                    const isDone = completedTopics[selectedCurriculumModule.id]?.[topic] || false;
                    return (
                      <button
                        key={i}
                        onClick={() => toggleTopicCompleted(selectedCurriculumModule.id, topic)}
                        className={`text-left text-xs font-semibold p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer select-none ${
                          isDone
                            ? "bg-emerald-50/40 border-emerald-100 text-slate-800"
                            : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center border shrink-0 transition-all ${
                          isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                        }`}>
                          {isDone && <Check className="h-3 w-3" />}
                        </div>
                        <span>{topic}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Content Body */}
              <div className="prose prose-indigo max-w-none text-slate-600 space-y-4">
                {selectedCurriculumModule.contentBody.split("\n\n").map((para, idx) => {
                  if (para.startsWith("###")) {
                    return (
                      <h3 key={idx} className="text-base sm:text-lg font-extrabold text-slate-900 pt-3">
                        {para.replace("###", "")}
                      </h3>
                    );
                  }
                  if (para.startsWith("####")) {
                    return (
                      <h4 key={idx} className="text-xs font-extrabold uppercase tracking-wider text-slate-500 pt-1.5">
                        {para.replace("####", "")}
                      </h4>
                    );
                  }
                  if (para.startsWith("* ")) {
                    return (
                      <ul key={idx} className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                        {para.split("\n").map((li, i) => (
                          <li key={i}>{li.replace("* ", "").replace("*", "")}</li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p key={idx} className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                      {para}
                    </p>
                  );
                })}
              </div>

              {/* Interactive Module Question */}
              {selectedCurriculumModule.interactiveQuestion && (
                <div className="rounded-2xl bg-blue-50/20 border border-blue-100/40 p-5 mt-6 space-y-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Brain className="h-5 w-5" />
                    <span className="text-xs font-extrabold uppercase tracking-widest">Active Lesson Practice</span>
                  </div>
                  
                  <div className="space-y-3 pt-1">
                    <div className="text-xs sm:text-sm text-slate-900 font-extrabold leading-relaxed">
                      {selectedCurriculumModule.interactiveQuestion.questionText}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2.5">
                      {selectedCurriculumModule.interactiveQuestion.options.map((opt) => {
                        const answerKey = selectedCurriculumModule.id;
                        const isSelected = curriculumAnswers[answerKey] === opt.key;
                        const isChecked = curriculumChecked[answerKey];
                        const isCorrect = opt.key === selectedCurriculumModule.interactiveQuestion?.correctKey;
                        
                        return (
                          <button
                            key={opt.key}
                            disabled={isChecked}
                            onClick={() => setCurriculumAnswers(prev => ({ ...prev, [answerKey]: opt.key }))}
                            className={`rounded-xl px-4 py-3 text-xs font-semibold text-left border transition-all ${
                              isSelected
                                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50 cursor-pointer"
                            }`}
                          >
                            <span className="font-mono text-slate-400 mr-2 uppercase">{opt.key}.</span>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    {curriculumChecked[selectedCurriculumModule.id] && (
                      <div className={`p-4 rounded-xl text-xs font-semibold ${
                        curriculumAnswers[selectedCurriculumModule.id] === selectedCurriculumModule.interactiveQuestion.correctKey
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                          : "bg-rose-50 text-rose-800 border border-rose-100"
                      }`}>
                        <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                          {curriculumAnswers[selectedCurriculumModule.id] === selectedCurriculumModule.interactiveQuestion.correctKey ? (
                            <span className="text-emerald-600">✓ Correct!</span>
                          ) : (
                            <span className="text-rose-600">✗ Let's study again!</span>
                          )}
                        </div>
                        <p className="font-normal text-slate-600 leading-relaxed">
                          {selectedCurriculumModule.interactiveQuestion.explanation}
                        </p>
                      </div>
                    )}

                    {!curriculumChecked[selectedCurriculumModule.id] && (
                      <button
                        onClick={() => setCurriculumChecked(prev => ({ ...prev, [selectedCurriculumModule.id]: true }))}
                        disabled={!curriculumAnswers[selectedCurriculumModule.id]}
                        className="rounded-xl bg-blue-600 text-white font-bold px-5 py-2.5 text-xs hover:bg-blue-500 disabled:opacity-40 transition-all shadow-sm cursor-pointer"
                      >
                        Submit Practice Answer
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Action Prompt - MAKE THEM SPEAK OR WRITE */}
              {selectedCurriculumModule.actionPrompt && (
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-tr from-blue-50/40 via-purple-50/20 to-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                  <div className="space-y-1.5 text-center sm:text-left">
                    <span className="inline-block text-[9px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                      Make You {selectedCurriculumModule.actionPrompt.type}
                    </span>
                    <div className="text-sm font-extrabold text-slate-900">Are you ready to practice?</div>
                    <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                      {selectedCurriculumModule.actionPrompt.promptText}
                    </p>
                  </div>
                  {user ? (
                    <button
                      onClick={() =>
                        onSelectPrompt(
                          selectedCurriculumModule.actionPrompt!.type === "speaking" ? "speaking" : "writing",
                          selectedCurriculumModule.actionPrompt!.promptText
                        )
                      }
                      className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 text-xs shadow-md transition duration-200 cursor-pointer active:scale-95 shrink-0 animate-pulse"
                    >
                      {selectedCurriculumModule.actionPrompt.buttonLabel}
                    </button>
                  ) : (
                    <button
                      onClick={onOpenAuth}
                      className="rounded-xl bg-slate-900 text-white text-xs font-bold px-5 py-3 hover:bg-slate-800 cursor-pointer shrink-0"
                    >
                      Join Campaign to Respond
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Custom Classroom Lessons */}
      {activeTab === "custom" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 px-1">Filter Custom Topics</h2>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5 lg:grid-cols-1">
                {[
                  { id: "all", label: "All Custom Lessons" },
                  { id: "downloaded", label: "Downloaded Offline" },
                  { id: "grammar", label: "Grammar Core" },
                  { id: "vocabulary", label: "Vocabulary Lists" },
                  { id: "challenge", label: "Speaking Challenges" },
                  { id: "prompt", label: "Writing Prompts" }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCustomCategory(cat.id as any)}
                    className={`w-full text-left rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      activeCustomCategory === cat.id
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 px-1">Custom Lessons Index</h3>
              
              {customLessonsLoading ? (
                <div className="space-y-2 py-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-12 w-full animate-pulse rounded-xl bg-slate-50"></div>
                  ))}
                </div>
              ) : filteredCustomLessons.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No custom classroom lessons uploaded yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {filteredCustomLessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        handleSelectCustomLesson(lesson);
                        setCustomChecked(false);
                        setCustomAnswers({});
                      }}
                      className={`w-full text-left rounded-xl p-3.5 border transition-all flex items-start gap-3 cursor-pointer ${
                        selectedCustomLesson?.id === lesson.id
                          ? "border-blue-500 bg-blue-50/20 shadow-xs"
                          : "border-slate-100 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-lg shrink-0 mt-0.5">{getCategoryEmoji(lesson.category)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-bold text-slate-850 truncate">{lesson.title}</div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {completedLessonIds.includes(lesson.id) && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md uppercase shrink-0">
                                <Check className="h-2.5 w-2.5" /> Done
                              </span>
                            )}
                            {downloadedLessonIds.includes(lesson.id) && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md uppercase shrink-0">
                                <Cloud className="h-2.5 w-2.5" /> Saved
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 capitalize">{lesson.category}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border text-slate-500 capitalize bg-slate-50">
                            {lesson.difficultyLevel}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Custom Active Lesson Reader */}
          <div className="lg:col-span-8">
            {selectedCustomLesson ? (
              <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{getCategoryEmoji(selectedCustomLesson.category)}</span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                        {selectedCustomLesson.category} LESSON
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl tracking-tight">
                      {selectedCustomLesson.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${getDifficultyBadgeColor(selectedCustomLesson.difficultyLevel)}`}>
                      {selectedCustomLesson.difficultyLevel}
                    </span>
                    <button
                      onClick={() => handleToggleDownloadLesson(selectedCustomLesson)}
                      className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                        downloadedLessonIds.includes(selectedCustomLesson.id)
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shadow-sm"
                      }`}
                      title={downloadedLessonIds.includes(selectedCustomLesson.id) ? "Delete downloaded copy" : "Save this lesson for reading offline"}
                    >
                      {downloadedLessonIds.includes(selectedCustomLesson.id) ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span>Saved Offline</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3 shrink-0 animate-bounce" style={{ animationDuration: '2s' }} />
                          <span>Save Offline</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Body Content */}
                <div className="prose prose-indigo max-w-none text-slate-600 space-y-4">
                  {selectedCustomLesson.contentBody.split("\n\n").map((para, idx) => {
                    if (para.startsWith("###")) {
                      return <h3 key={idx} className="text-base sm:text-lg font-extrabold text-slate-900 pt-3">{para.replace("###", "")}</h3>;
                    }
                    if (para.startsWith("####")) {
                      return <h4 key={idx} className="text-xs font-extrabold uppercase tracking-wider text-slate-500 pt-1.5">{para.replace("####", "")}</h4>;
                    }
                    if (para.startsWith("* ")) {
                      return (
                        <ul key={idx} className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                          {para.split("\n").map((li, i) => (
                            <li key={i}>{li.replace("* ", "").replace("*", "")}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={idx} className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">{para}</p>;
                  })}
                </div>

                {/* Grammar Check */}
                {selectedCustomLesson.category === "grammar" && (
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 mt-6 space-y-4">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Brain className="h-5 w-5" />
                      <span className="text-xs font-extrabold uppercase tracking-widest">Quick Check Exercise</span>
                    </div>
                    <p className="text-xs text-slate-500">Choose the correct grammatical structure to complete the sentence:</p>
                    
                    <div className="space-y-3 pt-1">
                      <div className="text-xs sm:text-sm text-slate-800 font-bold">
                        "I ________ my high school essay letter yet, but I am editing it now."
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { key: "a", label: "have not submitted" },
                          { key: "b", label: "did not submit" },
                          { key: "c", label: "has not submitted" }
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            disabled={customChecked}
                            onClick={() => setCustomAnswers(prev => ({ ...prev, q1: opt.key }))}
                            className={`rounded-xl px-4 py-2.5 text-xs font-bold text-left border transition-all ${
                              customAnswers["q1"] === opt.key
                                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50 cursor-pointer"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {customChecked && (
                        <div className={`p-4 rounded-xl text-xs font-semibold ${
                          customAnswers["q1"] === "a" 
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                            : "bg-rose-50 text-rose-800 border border-rose-100"
                        }`}>
                          {customAnswers["q1"] === "a" ? (
                            <div className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                              <div>
                                <span className="font-bold block text-slate-900 mb-0.5">Correct!</span>
                                We use "have not" with first-person "I" for present perfect actions.
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="font-bold block text-slate-900 mb-0.5">Incorrect</span>
                              The correct answer is 'have not submitted'. Please try again!
                            </div>
                          )}
                        </div>
                      )}

                      {!customChecked && (
                        <button
                          onClick={() => setCustomChecked(true)}
                          disabled={!customAnswers["q1"]}
                          className="rounded-xl bg-slate-900 text-white font-bold px-4 py-2 text-xs hover:bg-slate-800 disabled:opacity-40 cursor-pointer shadow-sm"
                        >
                          Check Answer
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Custom practice launching */}
                {(selectedCustomLesson.category === "challenge" || selectedCustomLesson.category === "prompt") && (
                  <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                    <div className="space-y-1.5 text-center sm:text-left">
                      <div className="text-xs font-extrabold text-blue-950 uppercase tracking-widest">Active Challenge Submission</div>
                      <p className="text-xs text-blue-700">Submit your work directly to the campaign evaluation queue.</p>
                    </div>
                    {user ? (
                      <button
                        onClick={() =>
                          onSelectPrompt(
                            selectedCustomLesson.category === "challenge" ? "speaking" : "writing",
                            selectedCustomLesson.title
                          )
                        }
                        className="rounded-xl bg-blue-600 text-white text-xs font-bold px-5 py-3 shadow-md hover:bg-blue-500 active:scale-95 transition cursor-pointer shrink-0 animate-pulse"
                      >
                        {selectedCustomLesson.category === "challenge" ? "Record Audio Response" : "Draft Essay Now"}
                      </button>
                    ) : (
                      <button
                        onClick={onOpenAuth}
                        className="rounded-xl bg-slate-900 text-white text-xs font-bold px-5 py-3 hover:bg-slate-800 cursor-pointer shrink-0"
                      >
                        Login to Respond
                      </button>
                    )}
                  </div>
                )}

                {/* Lesson completion status */}
                {selectedCustomLesson && (
                  completedLessonIds.includes(selectedCustomLesson.id) ? (
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5 flex items-center justify-between gap-4 mt-6">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-emerald-500 p-1.5 text-white shrink-0">
                          <Check className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">Lesson Fully Completed!</h4>
                          <p className="text-xs text-emerald-700 leading-none mt-0.5">Congratulations on mastering this campaign lesson!</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-slate-50 border border-slate-200/60 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                      <div className="space-y-1 text-center sm:text-left">
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Finished Studying?</h4>
                        <p className="text-xs text-slate-500">Mark this module complete to track your progress and notify your teacher.</p>
                      </div>
                      {user ? (
                        <button
                          onClick={async () => {
                            if (!selectedCustomLesson) return;
                            try {
                              await completeLesson(user.userId, selectedCustomLesson.id);
                              if (!completedLessonIds.includes(selectedCustomLesson.id)) {
                                setCompletedLessonIds(prev => [...prev, selectedCustomLesson.id]);
                              }
                              // Award student bonus XP
                              if (onUserUpdate) {
                                const currentXp = user.xp || 0;
                                const updatedProfile = {
                                  ...user,
                                  xp: currentXp + 50
                                };
                                onUserUpdate(updatedProfile);
                              }
                            } catch (err) {
                              console.error("Failed to complete lesson:", err);
                            }
                          }}
                          className="rounded-xl bg-slate-950 text-white hover:bg-slate-800 text-xs font-extrabold px-5 py-3 shadow-xs active:scale-95 transition cursor-pointer shrink-0"
                        >
                          ✔ Mark as Completed (+50 XP)
                        </button>
                      ) : (
                        <button
                          onClick={onOpenAuth}
                          className="rounded-xl bg-slate-950 text-white text-xs font-extrabold px-5 py-3 shrink-0"
                        >
                          Login to Mark Completed
                        </button>
                      )}
                    </div>
                  )
                )}

                {/* Custom study materials */}
                {selectedCustomLesson.resources && selectedCustomLesson.resources.length > 0 && (
                  <div className="border-t border-slate-100 pt-5 space-y-2">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Classroom Study Materials</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCustomLesson.resources.map((res, i) => (
                        <span key={i} className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-slate-500">
                          {res}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 text-slate-400 font-medium">
                No custom lessons available. Check back soon!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default LearningHub;
