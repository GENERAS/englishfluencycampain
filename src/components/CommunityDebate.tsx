import React, { useEffect, useState } from "react";
import { MessageSquare, ThumbsUp, Vote, AlertTriangle, Users, BookOpen, Send, Sparkles, CheckCircle, Trophy, Bell, CornerDownRight, Reply, Check, Trash, Award } from "lucide-react";
import { UserProfile, DebateTopic, Comment, WritingSubmission, InAppNotification } from "../types";
import { getDebates, castDebateVote, addComment, getComments, getWritings, toggleLike, submitReport, subscribeToDebates, subscribeToComments, subscribeToNotifications, markNotificationAsRead, markAllNotificationsAsRead, awardHelpfulBadgeToComment } from "../firebase-utils";
import { useToast } from "./Toast";
import { GlobalRankings } from "./GlobalRankings";


interface CommunityDebateProps {
  user: UserProfile;
}

export const CommunityDebate: React.FC<CommunityDebateProps> = ({ user }) => {
  const { showToast } = useToast();
  const [debates, setDebates] = useState<DebateTopic[]>([]);

  const [selectedDebate, setSelectedDebate] = useState<DebateTopic | null>(null);
  const [debateComments, setDebateComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentSide, setCommentSide] = useState<"for" | "against" | "neutral">("neutral");
  const [activeTab, setActiveTab] = useState<"debates" | "peer_essays" | "rankings">("debates");

  // Peer writings
  const [peerWritings, setPeerWritings] = useState<WritingSubmission[]>([]);
  const [selectedWriting, setSelectedWriting] = useState<WritingSubmission | null>(null);
  const [writingComments, setWritingComments] = useState<Comment[]>([]);
  const [newWritingComment, setNewWritingComment] = useState("");

  // Report Form state
  const [reportingTarget, setReportingTarget] = useState<{ id: string; type: string } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportedSuccessfully, setReportedSuccessfully] = useState(false);

  // Notifications and Replying State
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [replyingToComment, setReplyingToComment] = useState<Comment | null>(null);

  useEffect(() => {
    if (!user?.userId) return;
    const unsubscribe = subscribeToNotifications(user.userId, (list) => {
      setNotifications(list);
    });
    return () => unsubscribe();
  }, [user?.userId]);

  useEffect(() => {
    loadPeerWritings();

    // Live Sync debates from Firestore
    const unsubscribe = subscribeToDebates((list) => {
      setDebates(list);
      setSelectedDebate((current) => {
        if (!current && list.length > 0) {
          return list[0];
        }
        if (current) {
          const updated = list.find((d) => d.id === current.id);
          return updated || current;
        }
        return null;
      });
    });

    return () => unsubscribe();
  }, []);

  // Live Sync comments on the selected debate
  useEffect(() => {
    if (!selectedDebate?.id) {
      setDebateComments([]);
      return;
    }

    const unsubscribe = subscribeToComments(selectedDebate.id, (comments) => {
      setDebateComments(comments);
    });

    return () => unsubscribe();
  }, [selectedDebate?.id]);

  const loadPeerWritings = async () => {
    try {
      const list = await getWritings("reviewed");
      setPeerWritings(list);
    } catch (err) {
      console.error("Failed to load peer writings:", err);
    }
  };

  const loadWritingComments = async (writingId: string) => {
    try {
      const list = await getComments(writingId);
      setWritingComments(list);
    } catch (err) {
      console.error("Failed to load writing comments:", err);
    }
  };

  const handleVote = async (debateId: string, side: "for" | "against") => {
    try {
      await castDebateVote(debateId, user.userId, side);
      showToast(`Vote casted: ${side === "for" ? "In Favor" : "Against"}`, "success");
    } catch (err) {
      console.error("Error casting vote:", err);
      showToast("Failed to cast your vote.", "error");
    }
  };

  const handleDebateCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebate || !newComment.trim()) return;
    try {
      await addComment(
        selectedDebate.id,
        "debate",
        user.userId,
        user.name,
        user.role,
        newComment.trim(),
        commentSide,
        replyingToComment ? replyingToComment.id : undefined,
        replyingToComment ? replyingToComment.userId : undefined,
        replyingToComment ? replyingToComment.userName : undefined,
        undefined, // debate topic doesn't belong to any student specifically
        selectedDebate.title
      );
      setNewComment("");
      setReplyingToComment(null);
      showToast("Your debate argument has been posted!", "success");
    } catch (err) {
      console.error("Error posting debate comment:", err);
      showToast("Failed to post comment.", "error");
    }
  };

  const handleWritingCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWriting || !newWritingComment.trim()) return;
    try {
      await addComment(
        selectedWriting.id,
        "writing",
        user.userId,
        user.name,
        user.role,
        newWritingComment.trim(),
        undefined,
        replyingToComment ? replyingToComment.id : undefined,
        replyingToComment ? replyingToComment.userId : undefined,
        replyingToComment ? replyingToComment.userName : undefined,
        selectedWriting.userId, // notifies essay author
        selectedWriting.title
      );
      setNewWritingComment("");
      setReplyingToComment(null);
      loadWritingComments(selectedWriting.id);
      showToast("Constructive critique posted successfully!", "success");
    } catch (err) {
      console.error("Error posting writing comment:", err);
      showToast("Failed to post essay critique.", "error");
    }
  };

  const handleLikeWriting = async (writingId: string) => {
    try {
      await toggleLike(writingId, "writing", user.userId);
      await loadPeerWritings();
      if (selectedWriting && selectedWriting.id === writingId) {
        const updated = peerWritings.find((w) => w.id === writingId);
        if (updated) setSelectedWriting(updated);
      }
      showToast("Peer essay upvote toggled!", "success");
    } catch (err) {
      console.error("Error liking writing:", err);
      showToast("Failed to toggle upvote.", "error");
    }
  };

  const handleAwardHelpfulBadge = async (commentId: string) => {
    try {
      const res = await awardHelpfulBadgeToComment(commentId, user.userId, user.name);
      if (res.success) {
        if (selectedWriting) {
          loadWritingComments(selectedWriting.id);
        }
        if (res.awardedBadge) {
          showToast("Helpful Critique badge awarded successfully! 🏅", "success");
        } else {
          showToast("Helpful Critique designation removed.", "info");
        }
      } else {
        showToast("Could not process Helpful designation.", "error");
      }
    } catch (err) {
      console.error("Error awarding helpful badge:", err);
      showToast("An error occurred.", "error");
    }
  };

  const handleFlagContent = async (targetId: string, targetType: string, previewText: string) => {
    setReportingTarget({ id: targetId, type: targetType });
    setReportReason("");
    setReportedSuccessfully(false);
  };

  const submitFlagReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingTarget || !reportReason.trim()) return;
    try {
      await submitReport(
        reportingTarget.id,
        reportingTarget.type,
        reportReason.trim(),
        user.name,
        `Reported by student: ${user.name}`
      );
      setReportedSuccessfully(true);
      showToast("Content successfully flagged for moderator review.", "success");
      setTimeout(() => {
        setReportingTarget(null);
        setReportedSuccessfully(false);
      }, 3000);
    } catch (err) {
      console.error("Error reporting content:", err);
      showToast("Failed to submit flag report.", "error");
    }
  };

  const calculateVotePercentage = (debate: DebateTopic) => {
    const total = debate.votesFor + debate.votesAgainst;
    if (total === 0) return { for: 50, against: 50 };
    return {
      for: Math.round((debate.votesFor / total) * 100),
      against: Math.round((debate.votesAgainst / total) * 100)
    };
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Tab Switcher & Notifications Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 mb-8 gap-4 relative">
        <div className="flex overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("debates")}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === "debates"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Vote className="h-4.5 w-4.5" />
            <span>Vocal & Logic Debates</span>
          </button>
          <button
            onClick={() => setActiveTab("peer_essays")}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === "peer_essays"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen className="h-4.5 w-4.5" />
            <span>Peer Reviewed Submissions</span>
          </button>
          <button
            onClick={() => setActiveTab("rankings")}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === "rankings"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Trophy className="h-4.5 w-4.5 text-amber-500" />
            <span>Global Rankings</span>
          </button>
        </div>

        {/* Notifications Popover Trigger & Dropdown */}
        <div className="relative pr-4 self-end sm:self-auto mb-2 sm:mb-0">
          <button
            onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
            className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition relative cursor-pointer flex items-center justify-center border border-slate-100 bg-slate-50 shadow-xs"
            title="In-app Notifications"
          >
            <Bell className="h-5 w-5" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white font-extrabold text-[9px] flex items-center justify-center animate-pulse border-2 border-white">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>

          {showNotificationsDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1 divide-y divide-slate-100">
              <div className="px-4 py-3 flex items-center justify-between bg-slate-50">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-blue-600" />
                  Activity Inbox ({notifications.filter(n => !n.read).length} unread)
                </span>
                {notifications.filter(n => !n.read).length > 0 && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const unreads = notifications.filter(n => !n.read).map(n => n.id);
                      await markAllNotificationsAsRead(user.userId, unreads);
                      showToast("All notifications marked as read", "success");
                    }}
                    className="text-[10px] font-extrabold text-blue-600 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-semibold space-y-1">
                    <p>No notifications yet</p>
                    <p className="text-[10px] text-slate-300 font-normal">You will be alerted here when peers comment on your essays or reply to your debate arguments.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={async () => {
                        if (!notif.read) {
                          await markNotificationAsRead(notif.id);
                        }
                        setShowNotificationsDropdown(false);
                        
                        // Handle context-aware navigation automatically
                        const isWriting = peerWritings.some(w => w.id === notif.targetId);
                        if (isWriting) {
                          setActiveTab("peer_essays");
                          const w = peerWritings.find(x => x.id === notif.targetId);
                          if (w) {
                            setSelectedWriting(w);
                            loadWritingComments(w.id);
                          }
                        } else {
                          setActiveTab("debates");
                          const d = debates.find(x => x.id === notif.targetId);
                          if (d) {
                            setSelectedDebate(d);
                          }
                        }
                      }}
                      className={`w-full p-4 hover:bg-slate-50 transition text-left cursor-pointer flex gap-3 items-start ${
                        !notif.read ? "bg-blue-50/20 border-l-2 border-blue-500" : "border-l-2 border-transparent"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notif.type === "reply_comment" ? (
                          <div className="p-1.5 rounded-full bg-emerald-50 text-emerald-600">
                            <CornerDownRight className="h-4 w-4" />
                          </div>
                        ) : notif.type === "helpful_critique" ? (
                          <div className="p-1.5 rounded-full bg-amber-50 text-amber-600">
                            <Award className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-full bg-blue-50 text-blue-600">
                            <MessageSquare className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="text-xs text-slate-600 leading-normal">
                          {notif.type === "helpful_critique" ? (
                            <span>
                              <strong className="text-slate-900 font-extrabold">{notif.senderName}</strong> awarded you a <span className="font-extrabold text-amber-600">Helpful Critique</span> badge on your essay feedback!
                            </span>
                          ) : (
                            <span>
                              <strong className="text-slate-900 font-extrabold">{notif.senderName}</strong>{" "}
                              {notif.type === "reply_comment" ? "replied to your thread" : "commented on your post"}{" "}
                              on <span className="font-bold text-slate-800">"{notif.targetTitle}"</span>
                            </span>
                          )}
                        </p>
                        {notif.content && (
                          <p className="text-[11px] text-slate-500 italic bg-slate-50/70 p-1.5 rounded-lg border border-slate-100/50 line-clamp-2 leading-relaxed">
                            "{notif.content}"
                          </p>
                        )}
                        <p className="text-[9px] text-slate-400 font-mono font-bold mt-1">
                          {new Date(notif.timestamp).toLocaleDateString()} at {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTab === "debates" && (
        /* Debates Portal */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Debates Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 sleek-shadow">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Debate Topics</h3>
              <div className="space-y-2">
                {debates.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedDebate(d);
                    }}
                    className={`w-full text-left rounded-xl p-3 border transition-all flex flex-col gap-1 cursor-pointer ${
                      selectedDebate?.id === d.id
                        ? "border-blue-500 bg-blue-50/20 shadow-xs"
                        : "border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800 line-clamp-2">{d.title}</span>
                    <span className="text-[10px] font-bold text-blue-600 mt-1 capitalize">
                      {d.difficultyLevel} Level
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Debate workspace */}
          <div className="lg:col-span-8">
            {selectedDebate ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 sleek-shadow space-y-6">
                <div className="space-y-2 border-b border-slate-50 pb-5">
                  <div className="flex items-center gap-2">
                    <Vote className="h-5 w-5 text-blue-600" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Weekly Active Debate</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl tracking-tight">{selectedDebate.title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{selectedDebate.description}</p>
                </div>

                {/* Real Voting Poll Bar */}
                <div className="space-y-4 rounded-xl bg-slate-50 border border-slate-100 p-5">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">Campaign Student Poll</div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleVote(selectedDebate.id, "for")}
                      className={`rounded-xl p-3.5 border transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                        selectedDebate.voters[user.userId] === "for"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-50"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-xs font-extrabold">I AGREE</span>
                      <span className="text-lg font-extrabold font-mono">{selectedDebate.votesFor} votes</span>
                    </button>

                    <button
                      onClick={() => handleVote(selectedDebate.id, "against")}
                      className={`rounded-xl p-3.5 border transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                        selectedDebate.voters[user.userId] === "against"
                          ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-50"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-xs font-extrabold">I DISAGREE</span>
                      <span className="text-lg font-extrabold font-mono">{selectedDebate.votesAgainst} votes</span>
                    </button>
                  </div>

                  {/* Visual Progress Bar */}
                  {selectedDebate.votesFor + selectedDebate.votesAgainst > 0 && (
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-slate-200 rounded-full flex overflow-hidden">
                        <div
                          style={{ width: `${calculateVotePercentage(selectedDebate).for}%` }}
                          className="bg-emerald-500 h-full"
                        />
                        <div
                          style={{ width: `${calculateVotePercentage(selectedDebate).against}%` }}
                          className="bg-rose-500 h-full"
                        />
                      </div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-500">
                        <span>Agree: {calculateVotePercentage(selectedDebate).for}%</span>
                        <span>Disagree: {calculateVotePercentage(selectedDebate).against}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Argument Comment */}
                <form onSubmit={handleDebateCommentSubmit} className="space-y-4 border-t border-slate-100 pt-5">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Publish Your Debate Argument</span>
                    
                    {/* Perspective Selector */}
                    <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                      {[
                        { side: "for", label: "For Topic", color: "bg-emerald-500 text-white" },
                        { side: "against", label: "Against Topic", color: "bg-rose-500 text-white" },
                        { side: "neutral", label: "Neutral Discussion", color: "bg-blue-600 text-white" }
                      ].map((item) => (
                        <button
                          key={item.side}
                          type="button"
                          onClick={() => setCommentSide(item.side as any)}
                          className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all cursor-pointer ${
                            commentSide === item.side ? item.color : "text-slate-500 hover:bg-white"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {replyingToComment && (
                    <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-2 text-xs text-blue-800 font-bold mb-3 animate-fade-in">
                      <span className="flex items-center gap-1.5">
                        <Reply className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        Replying to @{replyingToComment.userName}: "{replyingToComment.content.length > 50 ? replyingToComment.content.substring(0, 50) + "..." : replyingToComment.content}"
                      </span>
                      <button
                        type="button"
                        onClick={() => setReplyingToComment(null)}
                        className="text-slate-400 hover:text-rose-500 font-extrabold cursor-pointer transition-colors"
                      >
                        Cancel Reply ✕
                      </button>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <input
                      id="debate-comment-input"
                      type="text"
                      placeholder={replyingToComment ? `Reply to @${replyingToComment.userName}...` : "Support your stance with grammatical coherence and critical logic..."}
                      required
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="rounded-xl bg-slate-900 text-white px-5 py-3 text-xs font-bold hover:bg-slate-800 disabled:opacity-40 transition shrink-0 cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>

                {/* Arguments Feed */}
                <div className="space-y-4 pt-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Stances & Arguments ({debateComments.length})</h4>
                  {debateComments.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                      Be the first to publish a logical argument on this topic!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {debateComments.map((comment) => (
                        <div key={comment.id} className="rounded-xl border border-slate-100 p-4 bg-white shadow-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-extrabold text-[10px] uppercase">
                                {comment.userName.substring(0, 2)}
                              </div>
                              <span className="text-xs font-bold text-slate-800">{comment.userName}</span>
                              <span className="text-[9px] font-semibold text-slate-400 capitalize">({comment.userRole})</span>
                            </div>
                            
                            {/* Argument Perspective Tag */}
                            <div className="flex items-center gap-2">
                              {comment.side && (
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                  comment.side === "for"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    : comment.side === "against"
                                    ? "bg-rose-50 text-rose-700 border border-rose-100"
                                    : "bg-slate-50 text-slate-700 border border-slate-100"
                                }`}>
                                  {comment.side === "for" ? "Agree" : comment.side === "against" ? "Disagree" : "Neutral"}
                                </span>
                              )}
                              
                              {/* Report Trigger */}
                              <button
                                onClick={() => handleFlagContent(comment.id, "comment", comment.content)}
                                className="text-slate-300 hover:text-rose-500 transition-colors"
                                title="Report Inappropriate Comment"
                              >
                                <AlertTriangle className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-slate-600 leading-relaxed pl-8">
                            {comment.replyToUserName && (
                              <span className="font-extrabold text-blue-600 mr-1.5">
                                @{comment.replyToUserName}
                              </span>
                            )}
                            {comment.content}
                          </p>

                          <div className="flex items-center justify-between pl-8 pt-1 border-t border-slate-50 mt-1">
                            <div className="flex items-center gap-1.5">
                              {comment.replyToUserName && (
                                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5">
                                  <CornerDownRight className="h-3.5 w-3.5" />
                                  replied to @{comment.replyToUserName}
                                </span>
                              )}
                            </div>
                            {comment.userId !== user.userId && (
                              <button
                                onClick={() => {
                                  setReplyingToComment(comment);
                                  setTimeout(() => {
                                    const el = document.getElementById("debate-comment-input");
                                    if (el) el.focus();
                                  }, 100);
                                }}
                                className="flex items-center gap-1 text-[10px] font-extrabold text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                              >
                                <Reply className="h-3 w-3" />
                                <span>Reply</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 text-slate-400 font-medium">
                Select a debate topic to join discussion.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "peer_essays" && (
        /* Peer Essays Gallery */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 sleek-shadow">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Peer Reviewed Essays</h3>
              {peerWritings.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No reviewed essays in library yet.</div>
              ) : (
                <div className="space-y-2">
                  {peerWritings.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => {
                        setSelectedWriting(w);
                        loadWritingComments(w.id);
                      }}
                      className={`w-full text-left rounded-xl p-3 border transition-all flex flex-col gap-1 cursor-pointer ${
                        selectedWriting?.id === w.id
                          ? "border-blue-500 bg-blue-50/20 shadow-xs"
                          : "border-slate-100 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800 truncate">{w.title}</span>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>By: {w.userName}</span>
                        <span className="font-bold text-blue-600">Score: {w.score?.total || 0}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            {selectedWriting ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 sleek-shadow space-y-6">
                <div className="border-b border-slate-100 pb-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{selectedWriting.title}</h2>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full badge-blue border border-blue-200/50">
                      Score: {selectedWriting.score?.total || 0}/100
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Submitted by: <strong>{selectedWriting.userName}</strong></span>
                    <span>Reviewed: {new Date(selectedWriting.reviewedAt || "").toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                  {selectedWriting.content}
                </div>

                {/* Score breakdown visual */}
                {selectedWriting.score && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/20 p-5 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-blue-800 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      Academic Grading Matrix
                    </h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                      {[
                        { label: "Grammar Rules", score: selectedWriting.score.grammar },
                        { label: "Vocabulary Variety", score: selectedWriting.score.vocabulary },
                        { label: "Structure & Flow", score: selectedWriting.score.structure },
                        { label: "Expression Clarity", score: selectedWriting.score.clarity }
                      ].map((matrix, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 border border-slate-100 text-center shadow-xs">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">{matrix.label}</div>
                          <div className="text-lg font-mono font-extrabold text-slate-800 mt-1">{matrix.score}/25</div>
                        </div>
                      ))}
                    </div>

                    <div className="text-xs bg-white border border-blue-100/50 p-3 rounded-lg text-slate-600 mt-2 leading-relaxed">
                      <strong>Teacher Feedback:</strong> {selectedWriting.feedback}
                    </div>
                  </div>
                )}

                {/* Likes / Comments footer */}
                <div className="flex items-center gap-6 border-t border-b border-slate-50 py-3">
                  <button
                    onClick={() => handleLikeWriting(selectedWriting.id)}
                    className={`flex items-center gap-1.5 text-xs font-bold transition ${
                      selectedWriting.likes?.includes(user.userId)
                        ? "text-blue-600"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <ThumbsUp className="h-4.5 w-4.5" />
                    <span>{selectedWriting.likesCount || 0} Upvotes</span>
                  </button>
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <MessageSquare className="h-4.5 w-4.5" />
                    <span>{writingComments.length} comments</span>
                  </span>
                </div>

                {/* Essay comments form */}
                <div className="space-y-3">
                  {replyingToComment && (
                    <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-2 text-xs text-blue-800 font-bold mb-3 animate-fade-in">
                      <span className="flex items-center gap-1.5">
                        <Reply className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        Replying to @{replyingToComment.userName}: "{replyingToComment.content.length > 50 ? replyingToComment.content.substring(0, 50) + "..." : replyingToComment.content}"
                      </span>
                      <button
                        type="button"
                        onClick={() => setReplyingToComment(null)}
                        className="text-slate-400 hover:text-rose-500 font-extrabold cursor-pointer transition-colors"
                      >
                        Cancel Reply ✕
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleWritingCommentSubmit} className="flex gap-3">
                    <input
                      id="writing-comment-input"
                      type="text"
                      placeholder={replyingToComment ? `Reply to @${replyingToComment.userName}...` : "Provide supportive feedback or suggest grammar corrections..."}
                      required
                      value={newWritingComment}
                      onChange={(e) => setNewWritingComment(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!newWritingComment.trim()}
                      className="rounded-xl bg-slate-900 text-white px-5 py-3 text-xs font-bold hover:bg-slate-800 disabled:opacity-40 transition shrink-0 cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {writingComments.length > 0 && (
                    <div className="space-y-3">
                      {writingComments.map((comment) => {
                        const hasHelpfulBadge = (comment.helpfulCount || 0) > 0;
                        const userHasVotedHelpful = comment.helpfulVoters?.includes(user.userId);
                        return (
                          <div
                            key={comment.id}
                            className={`rounded-xl p-4 shadow-xs space-y-2 border transition-all ${
                              hasHelpfulBadge
                                ? "bg-gradient-to-br from-white to-amber-50/20 border-amber-200"
                                : "bg-white border-slate-100"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800">{comment.userName}</span>
                                <span className="text-[9px] font-bold text-slate-400 capitalize">({comment.userRole})</span>
                                {hasHelpfulBadge && (
                                  <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-800 border border-amber-250 animate-pulse">
                                    <Award className="h-2.5 w-2.5 text-amber-600 fill-amber-500/20" />
                                    Helpful Critique
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleFlagContent(comment.id, "comment", comment.content)}
                                className="text-slate-300 hover:text-rose-500 transition-colors"
                                title="Flag comment"
                              >
                                <AlertTriangle className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {comment.replyToUserName && (
                                <span className="font-extrabold text-blue-600 mr-1.5">
                                  @{comment.replyToUserName}
                                </span>
                              )}
                              {comment.content}
                            </p>

                            <div className="flex items-center justify-between border-t border-slate-50 pt-1.5 mt-1.5">
                              <div className="flex items-center gap-2">
                                {comment.replyToUserName && (
                                  <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5">
                                    <CornerDownRight className="h-3.5 w-3.5" />
                                    replied to @{comment.replyToUserName}
                                  </span>
                                )}
                                
                                {/* Award Helpful Badge Toggle for peers */}
                                {comment.userId !== user.userId ? (
                                  <button
                                    type="button"
                                    onClick={() => handleAwardHelpfulBadge(comment.id)}
                                    className={`flex items-center gap-1.5 text-[10px] font-extrabold px-2 py-1 rounded-lg border transition cursor-pointer ${
                                      userHasVotedHelpful
                                        ? "bg-amber-500 border-amber-500 text-white shadow-xs"
                                        : "bg-slate-50 hover:bg-amber-50 border-slate-200 text-slate-500 hover:text-amber-700 hover:border-amber-300"
                                    }`}
                                    title={userHasVotedHelpful ? "Remove Helpful Critique designation" : "Designate as Helpful Critique"}
                                  >
                                    <Award className={`h-3 w-3 ${userHasVotedHelpful ? "fill-white/20" : ""}`} />
                                    <span>Helpful{comment.helpfulCount ? ` (${comment.helpfulCount})` : ""}</span>
                                  </button>
                                ) : (
                                  (comment.helpfulCount || 0) > 0 && (
                                    <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
                                      <Award className="h-3 w-3 text-amber-500 fill-amber-500/10" />
                                      <span>Helpful ({comment.helpfulCount})</span>
                                    </span>
                                  )
                                )}
                              </div>
                              
                              {comment.userId !== user.userId && (
                                <button
                                  onClick={() => {
                                    setReplyingToComment(comment);
                                    setTimeout(() => {
                                      const el = document.getElementById("writing-comment-input");
                                      if (el) el.focus();
                                    }, 100);
                                  }}
                                  className="flex items-center gap-1 text-[10px] font-extrabold text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                                >
                                  <Reply className="h-3 w-3" />
                                  <span>Reply</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 text-slate-400 font-medium">
                Select a peer reviewed essay from left side panel to read.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "rankings" && (
        <GlobalRankings user={user} />
      )}

      {/* Flag Moderation Dialog */}
      {reportingTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Report Inappropriate Content
            </h3>
            
            {reportedSuccessfully ? (
              <div className="text-center py-4 space-y-2">
                <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto animate-pulse" />
                <p className="text-xs font-semibold text-slate-800">Flag Report Filed Successfully!</p>
                <p className="text-[11px] text-slate-500">Campaign moderators have put this item into the evaluation queue.</p>
              </div>
            ) : (
              <form onSubmit={submitFlagReport} className="space-y-3">
                <p className="text-xs text-slate-500">
                  Help us maintain a safe, welcoming, and high-quality learning platform. Explain why this content should be moderated:
                </p>
                <textarea
                  required
                  placeholder="e.g., Unsupportive commentary, inappropriate words, spam..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-rose-500 min-h-[80px]"
                />
                <div className="flex justify-end gap-2 text-xs font-bold pt-2">
                  <button
                    type="button"
                    onClick={() => setReportingTarget(null)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-500"
                  >
                    File Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default CommunityDebate;
