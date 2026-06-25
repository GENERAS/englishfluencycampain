import React, { useEffect, useState } from "react";
import { BookOpen, FileText, Mic, Star, Sparkles, Brain, Check, ChevronRight } from "lucide-react";
import { Lesson, UserProfile } from "../types";
import { getLessons } from "../firebase-utils";

interface LearningHubProps {
  user: UserProfile | null;
  onSelectPrompt: (type: "writing" | "speaking", promptText: string) => void;
  onOpenAuth: () => void;
}

export const LearningHub: React.FC<LearningHubProps> = ({ user, onSelectPrompt, onOpenAuth }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeCategory, setActiveCategory] = useState<"all" | "grammar" | "vocabulary" | "challenge" | "prompt">("all");
  const [loading, setLoading] = useState(true);
  const [exerciseAnswers, setExerciseAnswers] = useState<{ [key: string]: string }>({});
  const [exerciseChecked, setExerciseChecked] = useState(false);

  useEffect(() => {
    async function loadLessons() {
      try {
        const list = await getLessons();
        setLessons(list);
        if (list.length > 0) {
          setSelectedLesson(list[0]);
        }
      } catch (err) {
        console.error("Failed to load lessons:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLessons();
  }, []);

  const filteredLessons = lessons.filter(
    (l) => activeCategory === "all" || l.category === activeCategory
  );

  const handleAnswerChange = (qIndex: string, val: string) => {
    setExerciseAnswers((prev) => ({ ...prev, [qIndex]: val }));
  };

  const checkExercise = () => {
    setExerciseChecked(true);
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome Banner */}
      <div className="relative mb-8 overflow-hidden rounded-2xl sidebar-gradient p-6 sm:p-8 text-white sleek-shadow">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10">
          <BookOpen className="h-64 w-64 text-white" />
        </div>
        <div className="max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-blue-200">
            <div className="active-indicator"></div>
            Active Classroom Modules
          </div>
          <h1 className="text-2xl font-extrabold sm:text-3xl tracking-tight">Campaign Curriculum Library</h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Read grammar blueprints, expand your argument vocabularies, and take on speaking & writing prompts to earn XP and level up!
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Lessons List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 sleek-shadow">
            <h2 className="text-sm font-bold text-slate-800 mb-3">Topic Filter</h2>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5 lg:grid-cols-1">
              {[
                { id: "all", label: "All Curriculums" },
                { id: "grammar", label: "Grammar Core" },
                { id: "vocabulary", label: "Vocabulary lists" },
                { id: "challenge", label: "Speaking Challenges" },
                { id: "prompt", label: "Writing Prompts" }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`w-full text-left rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                    activeCategory === cat.id
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-100"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 sleek-shadow">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Curriculum Index</h3>
            
            {loading ? (
              <div className="space-y-2 py-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-12 w-full animate-pulse rounded-xl bg-slate-50"></div>
                ))}
              </div>
            ) : filteredLessons.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No lessons found in this category.
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {filteredLessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setSelectedLesson(lesson);
                      setExerciseChecked(false);
                      setExerciseAnswers({});
                    }}
                    className={`w-full text-left rounded-xl p-3 border transition-all flex items-start gap-3 cursor-pointer ${
                      selectedLesson?.id === lesson.id
                        ? "border-blue-500 bg-blue-50/20 shadow-xs"
                        : "border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{getCategoryEmoji(lesson.category)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 truncate">{lesson.title}</div>
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

        {/* Right Content Area: Active Lesson Reader */}
        <div className="lg:col-span-8">
          {selectedLesson ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 sleek-shadow space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{getCategoryEmoji(selectedLesson.category)}</span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                      {selectedLesson.category} LESSON
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl tracking-tight">
                    {selectedLesson.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getDifficultyBadgeColor(selectedLesson.difficultyLevel)}`}>
                    {selectedLesson.difficultyLevel}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="prose prose-indigo max-w-none text-slate-700 space-y-4">
                {selectedLesson.contentBody.split("\n\n").map((para, idx) => {
                  if (para.startsWith("###")) {
                    return <h3 key={idx} className="text-lg font-bold text-slate-900 pt-3">{para.replace("###", "")}</h3>;
                  }
                  if (para.startsWith("####")) {
                    return <h4 key={idx} className="text-base font-bold text-slate-800 pt-1">{para.replace("####", "")}</h4>;
                  }
                  if (para.startsWith("* ")) {
                    return (
                      <ul key={idx} className="list-disc pl-5 space-y-1 text-sm">
                        {para.split("\n").map((li, i) => (
                          <li key={i}>{li.replace("* ", "").replace("*", "")}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={idx} className="text-sm leading-relaxed whitespace-pre-line">{para}</p>;
                })}
              </div>

              {/* Interactive Quick Practice Exercise block */}
              {selectedLesson.category === "grammar" && (
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-5 mt-6 space-y-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Brain className="h-5 w-5" />
                    <span className="text-sm font-bold">Quick Check Exercise</span>
                  </div>
                  <p className="text-xs text-slate-500">Choose the correct Present Perfect form to complete the sentence:</p>
                  
                  <div className="space-y-3 pt-1">
                    <div className="text-sm text-slate-800 font-semibold">
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
                          disabled={exerciseChecked}
                          onClick={() => handleAnswerChange("q1", opt.key)}
                          className={`rounded-lg px-4 py-2 text-xs font-bold text-left border transition-all ${
                            exerciseAnswers["q1"] === opt.key
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {exerciseChecked && (
                      <div className={`p-3 rounded-lg text-xs font-semibold ${
                        exerciseAnswers["q1"] === "a" 
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}>
                        {exerciseAnswers["q1"] === "a" ? (
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            Correct! We use "have not" with first-person "I" for present perfect actions.
                          </div>
                        ) : (
                          "Incorrect. The correct answer is 'have not submitted'. Please try again!"
                        )}
                      </div>
                    )}

                    {!exerciseChecked && (
                      <button
                        onClick={checkExercise}
                        disabled={!exerciseAnswers["q1"]}
                        className="rounded-lg bg-slate-900 text-white font-bold px-4 py-2 text-xs hover:bg-slate-800 disabled:opacity-40"
                      >
                        Check Answer
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Prompt Quick Launch Actions */}
              {(selectedLesson.category === "challenge" || selectedLesson.category === "prompt") && (
                <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="text-sm font-bold text-blue-950">Ready to Submit?</div>
                    <p className="text-xs text-blue-700">Submit your writing or speaking directly to teacher evaluation queue.</p>
                  </div>
                  {user ? (
                    <button
                      onClick={() =>
                        onSelectPrompt(
                          selectedLesson.category === "challenge" ? "speaking" : "writing",
                          selectedLesson.title
                        )
                      }
                      className="rounded-xl bg-blue-600 text-white text-xs font-bold px-5 py-3 shadow-md shadow-blue-100 hover:bg-blue-500 active:scale-95 transition cursor-pointer shrink-0 animate-pulse"
                    >
                      {selectedLesson.category === "challenge" ? "Record Speech Audio" : "Draft Essay Now"}
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

              {/* Extra Study resources */}
              {selectedLesson.resources && selectedLesson.resources.length > 0 && (
                <div className="border-t border-slate-100 pt-5 space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Extra Study Materials</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLesson.resources.map((res, i) => (
                      <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-500">
                        {res}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 text-slate-400 font-medium">
              No lessons selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default LearningHub;
