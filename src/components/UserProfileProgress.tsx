import React, { useState } from "react";
import { Award, Zap, BookOpen, Mic, CheckCircle, Award as CertificateIcon, Sparkles, Printer } from "lucide-react";
import { UserProfile, WritingSubmission, SpeakingSubmission } from "../types";

interface UserProfileProgressProps {
  user: UserProfile;
  writings: WritingSubmission[];
  speakings: SpeakingSubmission[];
}

export const UserProfileProgress: React.FC<UserProfileProgressProps> = ({
  user,
  writings,
  speakings
}) => {
  const [showCertificate, setShowCertificate] = useState(false);

  // Filter reviewed submissions
  const reviewedWritings = writings.filter((w) => w.status === "reviewed");
  const reviewedSpeakings = speakings.filter((s) => s.status === "reviewed");
  
  const feedbackCount = reviewedWritings.length + reviewedSpeakings.length;

  // Calculate Average Score
  const getAverageScore = () => {
    let total = 0;
    let count = 0;
    reviewedWritings.forEach((w) => {
      if (w.score) {
        total += w.score.total;
        count++;
      }
    });
    reviewedSpeakings.forEach((s) => {
      if (s.score) {
        total += s.score.total;
        count++;
      }
    });
    return count > 0 ? Math.round(total / count) : 0;
  };

  const avgScore = getAverageScore();

  // Defined Badges List with matching criteria
  const ALL_BADGES = [
    { id: "Writer", title: "Creative Writer", desc: "Submitted at least 1 essay or letter", color: "bg-indigo-500", icon: BookOpen },
    { id: "Speaker", title: "Active Speaker", desc: "Submitted at least 1 voice recording", color: "bg-violet-500", icon: Mic },
    { id: "Active Learner", title: "Active Scholar", desc: "Submitted 3+ writing or speaking tasks", color: "bg-emerald-500", icon: Zap },
    { id: "Top Performer", title: "Apex Fluency", desc: "Earned an 90+ score on any task", color: "bg-amber-500", icon: Sparkles }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Grid structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Profile Card Sidebar (Col 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center sleek-shadow space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-extrabold text-2xl uppercase">
              {user.name.substring(0, 2)}
            </div>
            
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-800">{user.name}</h2>
              <p className="text-xs font-semibold text-slate-400">{user.email}</p>
              <div className="text-[10px] font-bold text-blue-600 mt-1 capitalize">{user.role} Account</div>
            </div>

            <div className="border-t border-slate-50 pt-4 flex justify-around text-slate-700">
              <div className="text-center">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">XP Points</div>
                <div className="text-xl font-extrabold font-mono text-slate-800">{user.xp}</div>
              </div>
              <div className="h-10 w-px bg-slate-100"></div>
              <div className="text-center">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Daily Streak</div>
                <div className="text-xl font-extrabold font-mono text-slate-800 flex items-center gap-1 justify-center">
                  <Zap className="h-4.5 w-4.5 text-amber-500 fill-amber-500" />
                  {user.streak || 1}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="text-xs text-slate-400 font-bold mb-2">English Fluency Progression:</div>
              <span className="px-3 py-1 rounded-full border text-xs font-bold bg-blue-50 text-blue-700 border-blue-100">
                {user.level} Level
              </span>
            </div>
          </div>

          {/* Certificate Generation Trigger card */}
          <div className="rounded-2xl border border-slate-100 bg-gradient-to-tr from-slate-900 to-blue-950 p-6 text-white sleek-shadow text-center space-y-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
              <CertificateIcon className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold">Fluency Excellence Certificate</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Graduate and download your certificate of completion once you reach Intermediate or Advanced level and complete 2+ reviews.
              </p>
            </div>
            <button
              onClick={() => setShowCertificate(true)}
              className="w-full rounded-xl bg-blue-600 text-white text-xs font-bold py-2.5 hover:bg-blue-500 active:scale-95 transition cursor-pointer"
            >
              Generate Certificate
            </button>
          </div>
        </div>

        {/* Analytics & Earned Badges Area (Col 8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Writings", value: writings.length, icon: BookOpen, color: "bg-blue-50 text-blue-700" },
              { label: "Speakings", value: speakings.length, icon: Mic, color: "bg-blue-50 text-blue-700" },
              { label: "Assessments", value: feedbackCount, icon: CheckCircle, color: "bg-emerald-50 text-emerald-700" },
              { label: "Average Score", value: avgScore ? `${avgScore}%` : "---", icon: Award, color: "bg-amber-50 text-amber-700" }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="rounded-xl border border-slate-100 bg-white p-4 sleek-shadow flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                    <div className="text-base font-extrabold font-mono text-slate-800 mt-0.5">{stat.value}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Badges System */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 sleek-shadow space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Earned Campaign Badges</h3>
            <p className="text-xs text-slate-500">Milestones achieved based on real class submissions and reviews.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {ALL_BADGES.map((badge) => {
                const isEarned = (user.badges || []).includes(badge.id);
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.id}
                    className={`rounded-xl border p-4 flex items-start gap-4 transition duration-300 ${
                      isEarned
                        ? "border-blue-100 bg-blue-50/10"
                        : "border-slate-100 bg-slate-50/40 opacity-50"
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md ${
                      isEarned ? (badge.id === "Top Performer" ? "bg-amber-500" : "bg-blue-500") : "bg-slate-300"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{badge.title}</span>
                        {isEarned && (
                          <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded">
                            Earned
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{badge.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Modal Dialog */}
      {showCertificate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 max-w-2xl w-full shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <CertificateIcon className="h-5 w-5 text-blue-600" />
                Participant Certificate
              </h3>
              <button
                onClick={() => setShowCertificate(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                Close Window
              </button>
            </div>

            {/* Printable Certificate Frame */}
            <div className="border-[8px] border-double border-blue-900/20 bg-slate-50/50 p-8 text-center space-y-6 relative rounded-lg">
              <div className="absolute right-4 top-4 h-12 w-12 rounded-full border border-slate-200 bg-white/40 flex items-center justify-center text-[8px] font-bold uppercase select-none opacity-40">
                Official Seal
              </div>
              
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold tracking-widest text-blue-600 uppercase">
                  National English Fluency Campaign
                </span>
                <h1 className="text-2xl font-serif font-bold text-slate-900">Certificate of Completion</h1>
              </div>

              <div className="space-y-4">
                <p className="text-[11px] text-slate-400 italic">This is proudly presented to</p>
                <h2 className="text-xl font-extrabold text-slate-800 border-b-2 border-slate-200 max-w-[280px] mx-auto pb-1">
                  {user.name}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  For active participation and demonstrated linguistic performance in long-form writing and logic debates. Certified at the English proficiency level of:
                </p>
                <div className="font-extrabold text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg max-w-[140px] mx-auto py-1">
                  {user.level} Level
                </div>
              </div>

              <div className="flex justify-around text-[10px] text-slate-500 pt-6">
                <div>
                  <div className="font-bold text-slate-700">June 24, 2026</div>
                  <div className="border-t border-slate-200 mt-1 pt-0.5 font-semibold">Award Date</div>
                </div>
                <div>
                  <div className="font-bold text-slate-700">M. Thompson</div>
                  <div className="border-t border-slate-200 mt-1 pt-0.5 font-semibold">National Board Director</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 text-xs font-bold pt-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold px-4 py-2 hover:bg-slate-50 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Print Certificate
              </button>
              <button
                onClick={() => setShowCertificate(false)}
                className="rounded-lg bg-blue-600 text-white font-bold px-5 py-2 hover:bg-blue-500 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserProfileProgress;
