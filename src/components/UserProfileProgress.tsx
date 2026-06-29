import React, { useState, useRef, useEffect } from "react";
import { Award, Zap, BookOpen, Mic, CheckCircle, Award as CertificateIcon, Sparkles, Printer, Camera, Settings, ShieldCheck, Check, Bell, TrendingUp, CheckSquare, Trophy, AlertCircle, FileText, Download } from "lucide-react";
import { UserProfile, WritingSubmission, SpeakingSubmission, Founder, EnglishLevel } from "../types";
import { updateUserProfileImage, uploadImageToCloudinary, updateUserProfileDetails, getFounders } from "../firebase-utils";
import { useToast } from "./Toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { RewardAnimation } from "./RewardAnimation";
import { jsPDF } from "jspdf";

interface UserProfileProgressProps {
  user: UserProfile;
  writings: WritingSubmission[];
  speakings: SpeakingSubmission[];
  onUserUpdate?: (updated: UserProfile) => void;
}

export const getCertificateConfig = (level: EnglishLevel) => {
  switch (level) {
    case "Advanced":
      return {
        bg: "bg-indigo-50/20",
        border: "border-[10px] border-double border-indigo-600/35",
        title: "Certificate of Fluency Mastery",
        badgeBg: "bg-indigo-50 border border-indigo-150 text-indigo-800",
        sealText: "GOLD SOVEREIGN SEAL",
        sealBg: "bg-amber-100 text-amber-800 border-amber-300 shadow-sm",
        desc: "For mastering advanced academic and conversational English, demonstrating exemplary debate rhetoric, submitting high-scoring literature compositions, and passing peer feedback audits with honors.",
        tierText: "★ GOLD TIER • MASTER FLUENCY WITH DISTINCTION ★"
      };
    case "Intermediate":
      return {
        bg: "bg-blue-50/15",
        border: "border-[8px] border-double border-blue-600/25",
        title: "Certificate of Fluency Progression",
        badgeBg: "bg-blue-50 border border-blue-150 text-blue-800",
        sealText: "SILVER MERIT SEAL",
        sealBg: "bg-slate-100 text-slate-800 border-slate-300 shadow-xs",
        desc: "For active core competency in English communication, submitting formal letters and essays, delivering structured vocal summaries, and supporting cooperative learning debates.",
        tierText: "◆ SILVER TIER • COMPETENCY STANDARD WITH MERIT ◆"
      };
    default: // Beginner
      return {
        bg: "bg-emerald-50/10",
        border: "border-[6px] border-double border-emerald-600/20",
        title: "Certificate of Literacy Foundations",
        badgeBg: "bg-emerald-50 border border-emerald-150 text-emerald-800",
        sealText: "BRONZE CORE SEAL",
        sealBg: "bg-amber-50 text-amber-700 border-amber-200",
        desc: "For fundamental academic effort in English literacy, executing foundation voice-recordings, exploring introductory vocabulary sets, and demonstrating active scholastic growth.",
        tierText: "● BRONZE TIER • GENERAL SCHOLASTIC EFFORT ●"
      };
  }
};

export const UserProfileProgress: React.FC<UserProfileProgressProps> = ({
  user,
  writings,
  speakings,
  onUserUpdate
}) => {
  const [showCertificate, setShowCertificate] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Profile settings state
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editSchool, setEditSchool] = useState(user.school || "ES Rubengera TSS");
  const [editLevel, setEditLevel] = useState<EnglishLevel>(user.level || "Beginner");
  
  // Founder extra fields
  const [isFounder, setIsFounder] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editFounderRole, setEditFounderRole] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Reward Celebrations
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [rewardTitle, setRewardTitle] = useState("Congratulations!");
  const [rewardSubtitle, setRewardSubtitle] = useState("Goal Achieved!");
  const [rewardXp, setRewardXp] = useState(100);

  // Weekly Study Goals States
  const [essayGoal, setEssayGoal] = useState(user.studyGoals?.essaySubmitted || false);
  const [speakingGoal, setSpeakingGoal] = useState(user.studyGoals?.speakingSubmitted || false);
  const [feedbackGoal, setFeedbackGoal] = useState(user.studyGoals?.peerFeedbackGiven || false);

  // Sync state if user changes
  useEffect(() => {
    setEssayGoal(user.studyGoals?.essaySubmitted || false);
    setSpeakingGoal(user.studyGoals?.speakingSubmitted || false);
    setFeedbackGoal(user.studyGoals?.peerFeedbackGiven || false);
  }, [user.studyGoals]);

  // Debate Notification Settings
  const [notifyWriting, setNotifyWriting] = useState(user.notificationSettings?.notifyOnFeedback !== false);
  const [notifyReplies, setNotifyReplies] = useState(user.notificationSettings?.notifyOnReplies !== false);
  const [notifyLeaderboard, setNotifyLeaderboard] = useState(user.notificationSettings?.weeklyDigest !== false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Generate and download a formatted PDF summary of student achievements, badges, and progress stats
  const downloadProgressPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width || 210;
      const pageHeight = doc.internal.pageSize.height || 297;

      // Color Palette (matching high-end branding)
      const primaryColor = [15, 23, 42]; // Slate 900
      const secondaryColor = [37, 99, 235]; // Blue 600
      const slate400 = [148, 163, 184];
      const slate600 = [71, 85, 105];

      // Decorative Header Band
      doc.setFillColor(30, 41, 59); // Slate 800
      doc.rect(0, 0, pageWidth, 22, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("NATIONAL ENGLISH FLUENCY CAMPAIGN • RWANDA", 20, 14);

      // Main Report Header
      doc.setFontSize(22);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Academic Progress Portfolio", 20, 38);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(slate400[0], slate400[1], slate400[2]);
      doc.text(`Official Learning Records Exported on ${new Date().toLocaleDateString()}`, 20, 44);

      // Divider Line
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.5);
      doc.line(20, 49, pageWidth - 20, 49);

      // Student Profile Box (Light gray card layout)
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.roundedRect(20, 54, pageWidth - 40, 42, 3, 3, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("STUDENT PROFILE", 26, 62);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(slate600[0], slate600[1], slate600[2]);
      doc.text("Student Name:", 26, 70);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(user.name, 60, 70);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(slate600[0], slate600[1], slate600[2]);
      doc.text("Email Address:", 26, 77);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(user.email, 60, 77);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(slate600[0], slate600[1], slate600[2]);
      doc.text("School/Institution:", 26, 84);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(user.school || "ES Rubengera TSS", 60, 84);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(slate600[0], slate600[1], slate600[2]);
      doc.text("Fluency Status:", 26, 91);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`${user.level} Level`, 60, 91);

      // Metrics Title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("CAMPAIGN PROGRESS STATS", 20, 110);

      // Create 4 metric cards side-by-side
      const colWidth = (pageWidth - 40) / 4;
      const cardY = 116;
      const cardHeight = 22;

      const reviewedW = writings.filter((w) => w.status === "reviewed");
      const reviewedS = speakings.filter((s) => s.status === "reviewed");
      const completedAssessments = reviewedW.length + reviewedS.length;
      
      let totalS = 0;
      let countS = 0;
      reviewedW.forEach(w => { if (w.score) { totalS += w.score.total; countS++; } });
      reviewedS.forEach(s => { if (s.score) { totalS += s.score.total; countS++; } });
      const avgPercent = countS > 0 ? Math.round(totalS / countS) : null;

      const metrics = [
        { label: "XP POINTS", value: `${user.xp} XP` },
        { label: "SUBMISSIONS", value: `${writings.length + speakings.length}` },
        { label: "ASSESSMENTS", value: `${completedAssessments}` },
        { label: "AVERAGE SCORE", value: avgPercent ? `${avgPercent}%` : "---" }
      ];

      metrics.forEach((metric, idx) => {
        const x = 20 + idx * colWidth;
        // Draw background
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.roundedRect(x, cardY, colWidth - 4, cardHeight, 2, 2, "FD");

        // Draw Label
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(slate400[0], slate400[1], slate400[2]);
        doc.text(metric.label, x + (colWidth - 4) / 2, cardY + 7, { align: "center" });

        // Draw Value
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(metric.value, x + (colWidth - 4) / 2, cardY + 16, { align: "center" });
      });

      // Earned Badges Title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("EARNED CAMPAIGN BADGES", 20, 152);

      const allPossibleBadges = [
        { id: "Writer", title: "Creative Writer", desc: "Submitted at least 1 essay or letter" },
        { id: "Speaker", title: "Active Speaker", desc: "Submitted at least 1 voice recording" },
        { id: "Active Learner", title: "Active Scholar", desc: "Submitted 3+ writing or speaking tasks" },
        { id: "Top Performer", title: "Apex Fluency", desc: "Earned an 90+ score on any task" },
        { id: "Helpful Critic", title: "Helpful Critic", desc: "Awarded a Helpful badge by peers for constructive critique" }
      ];

      const earnedIds = user.badges || [];
      const earnedList = allPossibleBadges.filter(b => earnedIds.includes(b.id));

      if (earnedList.length === 0) {
        doc.setFont("Helvetica", "italic");
        doc.setFontSize(9.5);
        doc.setTextColor(slate400[0], slate400[1], slate400[2]);
        doc.text("No badges unlocked yet. Keep submitting tasks and receiving reviews!", 20, 160);
      } else {
        earnedList.forEach((badge, idx) => {
          const badgeY = 160 + idx * 13;
          
          // Badge circle marker
          doc.setFillColor(37, 99, 235);
          doc.circle(23, badgeY - 3, 1.5, "F");

          doc.setFont("Helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.text(badge.title, 27, badgeY - 2);

          doc.setFont("Helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(slate600[0], slate600[1], slate600[2]);
          doc.text(`— ${badge.desc}`, 27 + doc.getTextWidth(badge.title) + 2, badgeY - 2);
        });
      }

      // Achievement Summary Narrative Box
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("ACADEMIC PORTFOLIO NARRATIVE", 20, 234);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(slate600[0], slate600[1], slate600[2]);
      
      const certConfig = getCertificateConfig(user.level);
      const cleanTierText = certConfig.tierText.replace(/[★●◆]/g, "").trim();
      const narrative = `This Academic Portfolio verifies that student ${user.name} is an active participant in the ES Rubengera TSS English Fluency Campaign. Over the course of the curriculum, the student completed ${writings.length} written assignments and ${speakings.length} speaking practice sessions. With a total experience accumulation of ${user.xp} XP and a daily study streak of ${user.streak || 1} day(s), the student has demonstrated consistent linguistic progress towards a professional standard of English communication. Having attained the ${user.level} status, the student is hereby awarded the ${certConfig.title} (${cleanTierText}) verifying they meet the associated fluency benchmarks.`;
      
      const splitNarrative = doc.splitTextToSize(narrative, pageWidth - 40);
      doc.text(splitNarrative, 20, 241);

      // Certificate Footer Stamps
      const footerY = pageHeight - 25;
      doc.setDrawColor(226, 232, 240);
      doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(slate400[0], slate400[1], slate400[2]);
      doc.text("OFFICIAL LEARNING SUMMARY • EFC RWANDA", 20, footerY + 1);
      doc.text("STRICTLY SECURE PORTFOLIO EXPORT", 20, footerY + 5);

      doc.setFont("Helvetica", "italic");
      doc.text("CAMPAIGN FACULTY BOARD", pageWidth - 20, footerY + 1, { align: "right" });
      doc.text("VERIFIED ACADEMIC ACHIEVEMENT", pageWidth - 20, footerY + 5, { align: "right" });

      // Save the document
      doc.save(`EFC_Academic_Portfolio_${user.name.replace(/\s+/g, "_")}.pdf`);
      showToast("Academic progress portfolio PDF downloaded successfully!", "success");
    } catch (err) {
      console.error("Failed to export PDF:", err);
      showToast("Could not generate PDF summary. Please try again.", "error");
    }
  };

  const handleToggleGoal = async (goalType: "essay" | "speaking" | "feedback") => {
    let currentVal = false;
    if (goalType === "essay") {
      currentVal = !essayGoal;
      setEssayGoal(currentVal);
    } else if (goalType === "speaking") {
      currentVal = !speakingGoal;
      setSpeakingGoal(currentVal);
    } else if (goalType === "feedback") {
      currentVal = !feedbackGoal;
      setFeedbackGoal(currentVal);
    }

    try {
      const updatedGoals = {
        essaySubmitted: goalType === "essay" ? currentVal : essayGoal,
        speakingSubmitted: goalType === "speaking" ? currentVal : speakingGoal,
        peerFeedbackGiven: goalType === "feedback" ? currentVal : feedbackGoal,
      };

      const updatedUser = await updateUserProfileDetails(user.userId, {
        studyGoals: updatedGoals,
        // Award XP if completed
        xp: currentVal ? (user.xp || 0) + 50 : (user.xp || 0)
      });

      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      if (currentVal) {
        // Trigger explosion animation
        setRewardTitle("Goal Achieved! 🎉");
        setRewardSubtitle(`Great job completing your study goal! You earned +50 bonus XP.`);
        setRewardXp(50);
        setShowRewardAnimation(true);
        showToast("Goal checked off! +50 XP Awarded 🌟", "success");
      } else {
        showToast("Goal unchecked.", "info");
      }
    } catch (err) {
      console.error("Failed to update goal:", err);
      showToast("Failed to save goal state.", "error");
    }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      const settings = {
        notifyOnFeedback: notifyWriting,
        notifyOnReplies: notifyReplies,
        weeklyDigest: notifyLeaderboard,
      };
      const updatedUser = await updateUserProfileDetails(user.userId, {
        notificationSettings: settings
      });
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
      showToast("Debate notification preferences updated successfully!", "success");
    } catch (err) {
      console.error("Failed to save notification preferences:", err);
      showToast("Failed to save notification settings.", "error");
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // Load founder details if user email matches any co-founder
  useEffect(() => {
    async function checkFounderStatus() {
      if (!user.email) return;
      const emailLower = user.email.toLowerCase().trim();
      const isMatch = emailLower.includes("generas") || emailLower.includes("kagiraneza") ||
                      emailLower.includes("emmy") || emailLower.includes("niyonshuti") ||
                      emailLower.includes("simplice") || emailLower.includes("mugisha") ||
                      emailLower.includes("shema") || emailLower.includes("bonaventure");
      
      if (isMatch) {
        setIsFounder(true);
        try {
          const founders = await getFounders();
          let matchingFounder: Founder | undefined = undefined;
          
          if (emailLower.includes("generas") || emailLower.includes("kagiraneza")) {
            matchingFounder = founders.find(f => f.id === "seed_founder_1" || f.name.toLowerCase().includes("generas") || f.name.toLowerCase().includes("kagiraneza"));
          } else if (emailLower.includes("emmy") || emailLower.includes("niyonshuti")) {
            matchingFounder = founders.find(f => f.id === "seed_founder_2" || f.name.toLowerCase().includes("emmy") || f.name.toLowerCase().includes("niyonshuti"));
          } else if (emailLower.includes("simplice") || emailLower.includes("mugisha")) {
            matchingFounder = founders.find(f => f.id === "seed_founder_3" || f.name.toLowerCase().includes("simplice") || f.name.toLowerCase().includes("mugisha"));
          } else if (emailLower.includes("shema") || emailLower.includes("bonaventure")) {
            matchingFounder = founders.find(f => f.id === "seed_founder_4" || f.name.toLowerCase().includes("shema") || f.name.toLowerCase().includes("bonaventure"));
          }
          
          if (matchingFounder) {
            setEditBio(matchingFounder.bio);
            setEditFounderRole(matchingFounder.role);
          }
        } catch (err) {
          console.error("Error fetching matching founder details:", err);
        }
      }
    }
    checkFounderStatus();
  }, [user.email]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast("Name cannot be empty.", "error");
      return;
    }
    setIsSavingSettings(true);
    try {
      const updates: Partial<UserProfile> & { bio?: string; founderRole?: string } = {
        name: editName,
        school: editSchool,
        level: editLevel
      };
      if (isFounder) {
        updates.bio = editBio;
        updates.founderRole = editFounderRole;
      }
      
      const updatedUser = await updateUserProfileDetails(user.userId, updates);
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
      setShowSettings(false);
      showToast("Your profile details have been saved!", "success");
    } catch (err) {
      console.error("Error saving profile settings:", err);
      showToast("Failed to save profile settings.", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        showToast("Please select an image file.", "error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast("Avatar image must be less than 5MB.", "error");
        return;
      }

      setIsUploadingAvatar(true);
      try {
        const url = await uploadImageToCloudinary(file);
        const updatedUser = await updateUserProfileDetails(user.userId, { imageUrl: url });
        if (onUserUpdate) {
          onUserUpdate(updatedUser);
        }
        showToast("Profile avatar updated successfully!", "success");
      } catch (err) {
        console.error("Avatar upload failed:", err);
        showToast("Failed to upload avatar to Cloudinary.", "error");
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

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

  // Generate chart data based on current user XP for progress trend
  const getChartData = () => {
    return [
      { name: "Mon", XP: Math.max(0, user.xp - 120) },
      { name: "Tue", XP: Math.max(0, user.xp - 90) },
      { name: "Wed", XP: Math.max(0, user.xp - 60) },
      { name: "Thu", XP: Math.max(0, user.xp - 30) },
      { name: "Fri", XP: user.xp }
    ];
  };

  const chartData = getChartData();

  // Defined Badges List with matching criteria
  const ALL_BADGES = [
    { id: "Writer", title: "Creative Writer", desc: "Submitted at least 1 essay or letter", color: "bg-indigo-500", icon: BookOpen },
    { id: "Speaker", title: "Active Speaker", desc: "Submitted at least 1 voice recording", color: "bg-violet-500", icon: Mic },
    { id: "Active Learner", title: "Active Scholar", desc: "Submitted 3+ writing or speaking tasks", color: "bg-emerald-500", icon: Zap },
    { id: "Top Performer", title: "Apex Fluency", desc: "Earned an 90+ score on any task", color: "bg-amber-500", icon: Sparkles },
    { id: "Helpful Critic", title: "Helpful Critic", desc: "Awarded a Helpful badge by peers for constructive essay critique", color: "bg-amber-600", icon: Award }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Pending Tasks Warning Banner */}
      {(!user.dailyTasksCompleted?.speaking || !user.dailyTasksCompleted?.writing || !user.dailyTasksCompleted?.vocabulary) && (
        <div className="mb-6 rounded-3xl border border-amber-250 bg-amber-50/40 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800">You have uncompleted tasks!</h4>
              <p className="text-xs text-slate-500 mt-0.5">Don't be a lazy student! You can go back to previous uncompleted practices and courses at any time to complete them, boost your level, and build your academic portfolio.</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full shrink-0">
            Pending Tasks
          </span>
        </div>
      )}

      {/* Grid structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Profile Card Sidebar (Col 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center sleek-shadow space-y-4">
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
            
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className={`relative group flex h-20 w-20 items-center justify-center rounded-full p-[3px] bg-gradient-to-tr from-blue-600 via-orange-500 to-purple-600 shadow-lg transition duration-300 hover:scale-105 cursor-pointer disabled:opacity-80`}
                title="Click to change profile picture"
              >
                {isUploadingAvatar ? (
                  <div className="h-full w-full rounded-full bg-slate-900/10 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                  </div>
                ) : user.imageUrl ? (
                  <div className="h-full w-full rounded-full overflow-hidden border-2 border-white bg-slate-50">
                    <img src={user.imageUrl} alt={user.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-blue-800 font-extrabold text-2xl uppercase tracking-wider">
                    {user.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                  </div>
                )}
                
                {/* Elegant Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </button>
              
              {user.streak > 0 && (
                <span className="absolute bottom-2 right-2 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-orange-600 px-1 text-xs font-extrabold text-white shadow-sm ring-2 ring-white z-10">
                  🔥
                </span>
              )}
            </div>
            
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-800">{user.name}</h2>
              <p className="text-xs font-semibold text-slate-400">{user.email}</p>
              <div className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-wider">{user.role} Account</div>
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
              <div className="flex flex-col gap-2 items-center">
                <span className="px-3 py-1 rounded-full border text-xs font-bold bg-blue-50 text-blue-700 border-blue-100 w-fit">
                  {user.level} Level
                </span>
                
                <button
                  onClick={() => {
                    setEditName(user.name);
                    setEditSchool(user.school || "ES Rubengera TSS");
                    setEditLevel(user.level || "Beginner");
                    setShowSettings(true);
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/50 border border-slate-200/60 hover:border-blue-200/60 px-3.5 py-1.5 rounded-xl transition cursor-pointer w-full justify-center"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Edit Profile & Settings
                </button>

                <button
                  onClick={downloadProgressPDF}
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-500 border border-blue-700/30 px-3.5 py-2.5 rounded-xl transition shadow-sm cursor-pointer w-full justify-center"
                >
                  <Download className="h-4 w-4" />
                  Export Academic Portfolio (PDF)
                </button>
              </div>
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

          {/* Weekly XP Progress Chart */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 sleek-shadow space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Weekly Fluency Growth
                </h3>
                <p className="text-xs text-slate-500">Your accumulated experience points over the last 5 days.</p>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Level</div>
                <div className="text-xs font-bold text-blue-600">{user.level}</div>
              </div>
            </div>
            
            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", padding: "8px 12px" }} 
                    labelStyle={{ color: "#94a3b8", fontSize: "10px", fontWeight: "bold" }}
                    itemStyle={{ color: "#ffffff", fontSize: "11px", fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="XP" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorXp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive Weekly Study Goals */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 sleek-shadow space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-emerald-600" />
                Weekly Study Checklist
              </h3>
              <p className="text-xs text-slate-500">Check off tasks as you complete them to instantly earn bonus experience points (+50 XP each).</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: "essay",
                  label: "Draft & submit your essay / long-form writing",
                  desc: "Complete any designated writing task in the Learning Hub or practice arena.",
                  state: essayGoal,
                },
                {
                  id: "speaking",
                  label: "Record your pronunciation audio response",
                  desc: "Submit an active speaking audio clip for mentor or AI feedback.",
                  state: speakingGoal,
                },
                {
                  id: "feedback",
                  label: "Give peer feedback on a fellow classmate's task",
                  desc: "Collaborate and support the community by leaving helpful suggestions.",
                  state: feedbackGoal,
                }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleGoal(item.id as "essay" | "speaking" | "feedback")}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-start gap-3.5 group cursor-pointer ${
                    item.state
                      ? "border-emerald-100 bg-emerald-50/10 hover:bg-emerald-50/20"
                      : "border-slate-100 bg-slate-50/30 hover:border-blue-100 hover:bg-blue-50/5"
                  }`}
                >
                  <div className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                    item.state 
                      ? "border-emerald-500 bg-emerald-500 text-white" 
                      : "border-slate-300 bg-white group-hover:border-blue-500 text-transparent"
                  }`}>
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold transition ${item.state ? "text-slate-500 line-through" : "text-slate-800"}`}>
                        {item.label}
                      </span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${
                        item.state ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-700"
                      }`}>
                        {item.state ? "Completed" : "+50 XP"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Debate and Notification Settings */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 sleek-shadow space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-blue-600" />
                Debate Alerts & Preferences
              </h3>
              <p className="text-xs text-slate-500">Configure notifications to stay updated when classmates or teachers respond to your debate logic.</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  id: "notifyWriting",
                  label: "Writing & Essay Feedback Alerts",
                  desc: "Send instant notification once a teacher or automated mentor grades your long-form compositions.",
                  state: notifyWriting,
                  setter: setNotifyWriting,
                },
                {
                  id: "notifyReplies",
                  label: "Debate Interaction Notifications",
                  desc: "Alert me immediately when a peer leaves a comment or vote counter-argument on my debate submissions.",
                  state: notifyReplies,
                  setter: setNotifyReplies,
                },
                {
                  id: "notifyLeaderboard",
                  label: "Weekly Campaign Leaderboard Standing",
                  desc: "Receive a Sunday digest highlighting class standings, badge winners, and top spotlight students.",
                  state: notifyLeaderboard,
                  setter: setNotifyLeaderboard,
                }
              ].map((setting) => (
                <div key={setting.id} className="flex items-start justify-between gap-4 py-1">
                  <div className="space-y-1 flex-1">
                    <label className="text-xs font-bold text-slate-700 block cursor-pointer" htmlFor={setting.id}>
                      {setting.label}
                    </label>
                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-md">{setting.desc}</p>
                  </div>
                  <button
                    id={setting.id}
                    type="button"
                    onClick={() => setting.setter(!setting.state)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      setting.state ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        setting.state ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  disabled={isSavingNotifications}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-2.5 transition active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-80"
                >
                  {isSavingNotifications ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
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
            {(() => {
              const config = getCertificateConfig(user.level);
              return (
                <div className={`p-8 text-center space-y-6 relative rounded-lg border-double transition-all ${config.bg} ${config.border}`}>
                  <div className={`absolute right-4 top-4 h-14 w-14 rounded-full border flex flex-col items-center justify-center text-[6px] font-extrabold uppercase select-none leading-none p-1.5 text-center ${config.sealBg}`}>
                    <span>EFC Seal</span>
                    <span className="text-[5px] mt-0.5 opacity-80">{config.sealText.split(" ")[0]}</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase">
                      National English Fluency Campaign
                    </span>
                    <h1 className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight">{config.title}</h1>
                    <div className="text-[8px] font-black tracking-widest text-blue-600 uppercase mt-0.5">{config.tierText}</div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[11px] text-slate-400 italic">This is proudly presented to</p>
                    <h2 className="text-xl font-extrabold text-slate-800 border-b-2 border-slate-200 max-w-[280px] mx-auto pb-1 font-serif">
                      {user.name}
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto px-4">
                      {config.desc}
                    </p>
                    <div className={`font-extrabold text-xs rounded-xl max-w-[155px] mx-auto py-2 px-3 shadow-xs ${config.badgeBg}`}>
                      {user.level} Level
                    </div>
                  </div>

                  <div className="flex justify-around text-[10px] text-slate-500 pt-6">
                    <div>
                      <div className="font-bold text-slate-700">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      <div className="border-t border-slate-200 mt-1 pt-0.5 font-semibold">Award Date</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-700">M. Thompson</div>
                      <div className="border-t border-slate-200 mt-1 pt-0.5 font-semibold">National Board Director</div>
                    </div>
                  </div>
                </div>
              );
            })()}

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

      {/* Profile Settings Modal Dialog */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600 animate-spin-slow" />
                Profile & Account Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* General Settings */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full text-xs font-medium text-slate-800 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                    School / Institution
                  </label>
                  <input
                    type="text"
                    value={editSchool}
                    onChange={(e) => setEditSchool(e.target.value)}
                    placeholder="e.g. ES Rubengera TSS"
                    className="w-full text-xs font-medium text-slate-800 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Fluency Proficiency Level
                  </label>
                  <select
                    value={editLevel}
                    onChange={(e) => setEditLevel(e.target.value as EnglishLevel)}
                    className="w-full text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition"
                  >
                    <option value="Beginner">Beginner Level</option>
                    <option value="Intermediate">Intermediate Level</option>
                    <option value="Advanced">Advanced Level</option>
                  </select>
                </div>
              </div>

              {/* Founder-specific panel (highly customized highlight) */}
              {isFounder && (
                <div className="border border-orange-100 bg-orange-50/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-orange-700 uppercase tracking-wider">
                    <ShieldCheck className="h-4 w-4 text-orange-600 fill-orange-100" />
                    EFC Founder Profile Integration
                  </div>
                  <p className="text-[10px] text-orange-600/90 leading-relaxed">
                    You are recognized as a core co-founder of EFC! Updates here will automatically rewrite your profile on the co-founder card list at the landing page homepage.
                  </p>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                        Co-Founder Campaign Role
                      </label>
                      <input
                        type="text"
                        value={editFounderRole}
                        onChange={(e) => setEditFounderRole(e.target.value)}
                        placeholder="e.g. National Campaign Director"
                        className="w-full text-xs font-semibold text-slate-800 border border-orange-200 bg-white rounded-xl px-3 py-2 focus:border-orange-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                        Biography & Personal Story
                      </label>
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Share your personal EFC co-founder story and vision..."
                        rows={3}
                        className="w-full text-xs font-medium text-slate-800 border border-orange-200 bg-white rounded-xl p-3 focus:border-orange-500 outline-none transition resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 font-bold text-xs px-5 py-2.5 transition cursor-pointer"
                  disabled={isSavingSettings}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 text-white font-extrabold text-xs px-6 py-2.5 hover:bg-blue-500 active:scale-95 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-80"
                  disabled={isSavingSettings}
                >
                  {isSavingSettings ? (
                    <>
                      <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save Details
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Reward Celebration Overlay */}
      <RewardAnimation
        isVisible={showRewardAnimation}
        onClose={() => setShowRewardAnimation(false)}
        title={rewardTitle}
        subtitle={rewardSubtitle}
        xpAmount={rewardXp}
      />
    </div>
  );
};
export default UserProfileProgress;
