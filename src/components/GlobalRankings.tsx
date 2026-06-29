import React, { useEffect, useState } from "react";
import { Trophy, Flame, Search, Globe, School, Award, Sparkles, Star, ArrowUp, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile } from "../types";
import { subscribeToAllUsers, getWeeklyXp } from "../firebase-utils";

interface GlobalRankingsProps {
  user: UserProfile;
}

export const GlobalRankings: React.FC<GlobalRankingsProps> = ({ user }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"global" | "school">("global");
  const [timeframeFilter, setTimeframeFilter] = useState<"all_time" | "this_week">("all_time");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToAllUsers((allUsers) => {
      // Filter to include only students (roles "student" or undefined/empty)
      const studentProfiles = allUsers.filter(
        (u) => !u.role || u.role === "student"
      );
      setUsers(studentProfiles);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sort student profiles dynamically based on selected timeframe
  const sortedUsers = [...users].sort((a, b) => {
    if (timeframeFilter === "this_week") {
      return getWeeklyXp(b) - getWeeklyXp(a);
    }
    return (b.xp || 0) - (a.xp || 0);
  });

  // Filter based on active view (Global vs School)
  const viewFilteredUsers = sortedUsers.filter((u) => {
    if (activeView === "school") {
      const userSchool = (user.school || "").trim().toLowerCase();
      const otherSchool = (u.school || "").trim().toLowerCase();
      return userSchool && otherSchool && userSchool === otherSchool;
    }
    return true;
  });

  // Filter based on search query
  const searchedUsers = viewFilteredUsers.filter((u) => {
    const nameMatch = (u.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const schoolMatch = (u.school || "").toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || schoolMatch;
  });

  // Find current user's ranks
  const globalRank = sortedUsers.findIndex((u) => u.userId === user.userId) + 1;
  const schoolUsers = sortedUsers.filter(
    (u) => (u.school || "").trim().toLowerCase() === (user.school || "").trim().toLowerCase()
  );
  const schoolRank = schoolUsers.findIndex((u) => u.userId === user.userId) + 1;

  // Render Rank Badge/Number
  const renderRankBadge = (index: number) => {
    const rank = index + 1;
    if (rank === 1) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 shadow-sm border border-amber-200">
          <Trophy className="h-4 w-4 fill-amber-500 text-amber-600" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-sm border border-slate-200">
          <Award className="h-4.5 w-4.5 fill-slate-300 text-slate-500" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50/70 text-amber-850 shadow-sm border border-amber-250">
          <Award className="h-4.5 w-4.5 fill-amber-300/40 text-amber-700" />
        </div>
      );
    }
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-slate-400 font-mono bg-slate-50 border border-slate-100">
        {rank}
      </span>
    );
  };

  const currentViewRank = activeView === "global" ? globalRank : schoolRank;

  return (
    <div id="global-rankings-container" className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 sleek-shadow flex items-center gap-4">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600 shrink-0">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Global Standing</div>
            <div className="text-xl font-extrabold text-slate-800 font-mono">
              {globalRank > 0 ? `#${globalRank}` : "Unranked"}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Out of {users.length} active students</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 sleek-shadow flex items-center gap-4">
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 shrink-0">
            <School className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">School Standing</div>
            <div className="text-xl font-extrabold text-indigo-900 font-mono">
              {schoolRank > 0 ? `#${schoolRank}` : "Unranked"}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[180px]">
              {user.school || "Lincoln High School"}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-150 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-xs flex items-center gap-4 text-white">
          <div className="rounded-xl bg-white/10 p-3 text-amber-400 shrink-0">
            <Sparkles className="h-6 w-6 fill-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {timeframeFilter === "this_week" ? "Your Weekly XP" : "Your Fluency XP"}
            </div>
            <div className="text-xl font-extrabold font-mono text-amber-300">
              {timeframeFilter === "this_week" 
                ? `${getWeeklyXp(user).toLocaleString()} XP` 
                : `${(user.xp || 0).toLocaleString()} XP`}
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500 shrink-0" />
              <span>{user.streak || 0} Day Streak</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Leaderboard Panel */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 sleek-shadow space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-50">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
              Campaign Leaderboard
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time academic standing of campaign students</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Scope Toggle */}
            <div className="flex p-1 bg-slate-50 border border-slate-100 rounded-xl shrink-0">
              <button
                onClick={() => {
                  setActiveView("global");
                  setSearchQuery("");
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                  activeView === "global"
                    ? "bg-white text-blue-600 shadow-xs border border-slate-200/40"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Global</span>
              </button>
              <button
                onClick={() => {
                  setActiveView("school");
                  setSearchQuery("");
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                  activeView === "school"
                    ? "bg-white text-indigo-600 shadow-xs border border-slate-200/40"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <School className="h-3.5 w-3.5" />
                <span>My School</span>
              </button>
            </div>

            {/* Timeframe Toggle */}
            <div className="flex p-1 bg-slate-50 border border-slate-100 rounded-xl shrink-0">
              <button
                onClick={() => setTimeframeFilter("all_time")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                  timeframeFilter === "all_time"
                    ? "bg-white text-amber-600 shadow-xs border border-slate-200/40"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                <span>All Time</span>
              </button>
              <button
                onClick={() => setTimeframeFilter("this_week")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                  timeframeFilter === "this_week"
                    ? "bg-white text-emerald-600 shadow-xs border border-slate-200/40"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Flame className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/20" />
                <span>This Week</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeView === "global"
                ? "Search students by name or school..."
                : "Search students in your school..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 placeholder-slate-400"
          />
        </div>

        {/* Leaderboard Table / Feed */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <div className="h-8 w-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold">Loading campaign rankings...</p>
          </div>
        ) : searchedUsers.length === 0 ? (
          <div className="text-center py-16 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Trophy className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800">No students found</p>
            <p className="text-[11px] text-slate-500 mt-1">Try adjusting your search filters or queries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4 text-center w-16">Rank</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4 hidden md:table-cell">School</th>
                  <th className="py-3 px-4 text-center w-28">Streak</th>
                  <th className="py-3 px-4 text-right w-28">
                    {timeframeFilter === "this_week" ? "Weekly XP" : "Total XP"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {searchedUsers.map((profile, index) => {
                  const isMe = profile.userId === user.userId;
                  return (
                    <tr
                      key={profile.userId}
                      className={`group transition-all ${
                        isMe
                          ? "bg-blue-50/30 font-bold border-l-2 border-l-blue-500"
                          : "hover:bg-slate-50/50"
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center">
                          {renderRankBadge(
                            activeView === "global"
                              ? sortedUsers.findIndex((u) => u.userId === profile.userId)
                              : schoolUsers.findIndex((u) => u.userId === profile.userId)
                          )}
                        </div>
                      </td>

                      {/* Student Identity Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center font-extrabold text-xs uppercase ${
                              isMe
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {profile.name ? profile.name.substring(0, 2) : "??"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-800 truncate block">
                                {profile.name}
                              </span>
                              {isMe && (
                                <span className="inline-flex items-center text-[9px] font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-1 py-0.5 rounded-md uppercase shrink-0">
                                  You
                                </span>
                              )}
                              {profile.level && (
                                <span
                                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border uppercase ${
                                    profile.level === "Advanced"
                                      ? "bg-purple-50 text-purple-700 border-purple-100"
                                      : profile.level === "Intermediate"
                                      ? "bg-blue-50 text-blue-700 border-blue-100"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  }`}
                                >
                                  {profile.level}
                                </span>
                              )}
                              {(!profile.dailyTasksCompleted?.speaking || !profile.dailyTasksCompleted?.writing || !profile.dailyTasksCompleted?.vocabulary) && (
                                <span className="inline-flex items-center gap-0.5 text-[8.5px] font-bold text-amber-700 bg-amber-50/70 border border-amber-150 px-1.5 py-0.5 rounded-md uppercase shrink-0" title="Has pending speaking, writing, or vocabulary tasks for today">
                                  <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                                  <span>Uncompleted Tasks</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 block md:hidden truncate max-w-[200px]">
                              {profile.school || "Lincoln High School"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* School Name (Desktop only) */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <span className="text-xs text-slate-600 font-medium">
                          {profile.school || "Lincoln High School"}
                        </span>
                      </td>

                      {/* Streak Column */}
                      <td className="py-3.5 px-4 text-center">
                        {profile.streak > 0 ? (
                          <div className="inline-flex items-center gap-1 bg-orange-50 border border-orange-100 text-orange-700 px-2 py-1 rounded-lg text-xs font-bold">
                            <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500 animate-pulse" />
                            <span className="font-mono">{profile.streak}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs font-mono">-</span>
                        )}
                      </td>

                      {/* XP Column */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-xs font-extrabold font-mono text-slate-800">
                          {timeframeFilter === "this_week"
                            ? getWeeklyXp(profile).toLocaleString()
                            : (profile.xp || 0).toLocaleString()}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider ml-1">XP</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Motivational Banner & Catch-up indicator */}
        {!loading && sortedUsers.length > 0 && currentViewRank > 1 && (
          <div className="rounded-xl bg-indigo-50/40 border border-indigo-100/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-indigo-500 text-white p-1.5 shrink-0">
                <ArrowUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-950">Keep pushing your boundaries!</p>
                <p className="text-[11px] text-indigo-700 leading-none mt-0.5">
                  You are only{" "}
                  <strong className="font-mono">
                    {Math.max(
                      0,
                      ((activeView === "global"
                        ? (timeframeFilter === "this_week" ? getWeeklyXp(sortedUsers[currentViewRank - 2]) : sortedUsers[currentViewRank - 2]?.xp)
                        : (timeframeFilter === "this_week" ? getWeeklyXp(schoolUsers[currentViewRank - 2]) : schoolUsers[currentViewRank - 2]?.xp)) || 0) - 
                      (timeframeFilter === "this_week" ? getWeeklyXp(user) : (user.xp || 0))
                    ).toLocaleString()}{" "}
                    XP
                  </strong>{" "}
                  away from advancing to rank #{currentViewRank - 1}!
                </p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500 bg-white border border-indigo-100 px-3 py-1.5 rounded-lg shadow-2xs">
              Complete more campaign tasks to earn XP!
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
export default GlobalRankings;
