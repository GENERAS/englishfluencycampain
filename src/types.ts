/**
 * Type definitions for the English Fluency Campaign Platform.
 */

export type UserRole = "student" | "admin" | "teacher";
export type EnglishLevel = "Beginner" | "Intermediate" | "Advanced";
export type ContentCategory = "grammar" | "vocabulary" | "challenge" | "prompt";
export type SubmissionType = "letter" | "essay" | "prompt";
export type TargetType = "writing" | "speaking" | "debate";

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  level: EnglishLevel;
  school: string;
  xp: number;
  streak: number;
  createdAt: string;
  badges: string[];
  imageUrl?: string;
  lastActiveDate?: string;
  lastStreakUpdateDate?: string;
  dailyTasksCompleted?: {
    speaking?: boolean;
    writing?: boolean;
    vocabulary?: boolean;
  };
  weeklySpotlight?: boolean;
  weeklyXp?: number;
  spotlightReason?: string;
  spotlightWeek?: string;
  studyGoals?: {
    joinedDebate?: boolean;
    submittedEssay?: boolean;
    reachedTargetXp?: boolean;
    targetXpEarned?: number;
    claimDate?: string;
    essaySubmitted?: boolean;
    speakingSubmitted?: boolean;
    peerFeedbackGiven?: boolean;
  };
  notificationSettings?: {
    emailDebate?: boolean;
    emailFeedback?: boolean;
    pushReplies?: boolean;
    notifyOnFeedback?: boolean;
    notifyOnReplies?: boolean;
    weeklyDigest?: boolean;
  };
  xpHistory?: { [dateStr: string]: number };
}

export interface WritingScore {
  grammar: number;
  vocabulary: number;
  structure: number;
  clarity: number;
  total: number;
}

export interface WritingSubmission {
  id: string;
  title: string;
  content: string;
  userId: string;
  userName: string;
  timestamp: string;
  type: SubmissionType;
  promptId?: string;
  status: "pending" | "reviewed";
  feedback?: string;
  score?: WritingScore;
  reviewedBy?: string;
  reviewedAt?: string;
  commentsCount: number;
  likesCount: number;
  likes: string[]; // User IDs who liked
}

export interface SpeakingScore {
  pronunciation: number;
  fluency: number;
  vocabulary: number;
  grammar: number;
  total: number;
}

export interface SpeakingSubmission {
  id: string;
  promptText: string;
  audioUrl: string; // Firebase Storage URL or playable Data URI
  userId: string;
  userName: string;
  timestamp: string;
  status: "pending" | "reviewed";
  feedback?: string;
  score?: SpeakingScore;
  reviewedBy?: string;
  reviewedAt?: string;
  commentsCount: number;
  likesCount: number;
  likes: string[];
  transcript?: string;
}

export interface ListeningPractice {
  id: string;
  title: string;
  youtubeUrl: string;
  difficultyLevel: EnglishLevel;
  instructions: string;
  questionText: string;
  submissionType: "writing" | "speaking";
  createdAt: string;
  createdBy: string;
  createdByTeacherName: string;
}

export interface ListeningSubmission {
  id: string;
  practiceId: string;
  practiceTitle: string;
  youtubeUrl: string;
  userId: string;
  userName: string;
  submissionType: "writing" | "speaking";
  textResponse?: string;
  audioUrl?: string;
  transcript?: string;
  timestamp: string;
  status: "pending" | "reviewed";
  score?: number;
  aiReview?: string;
  adminReview?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface Lesson {
  id: string;
  title: string;
  category: ContentCategory;
  difficultyLevel: EnglishLevel;
  contentBody: string;
  resources?: string[];
  createdAt: string;
  status?: "pending" | "approved";
  createdBy?: string;
  createdByTeacherName?: string;
  weeklyScheduleDate?: string;
}

export interface LessonTracking {
  id: string; // userId_lessonId
  userId: string;
  userName: string;
  lessonId: string;
  lessonTitle: string;
  status: "enrolled" | "completed";
  enrolledAt: string;
  completedAt?: string;
}

export interface DebateTopic {
  id: string;
  title: string;
  description: string;
  difficultyLevel: EnglishLevel;
  createdAt: string;
  createdBy: string;
  status: "active" | "closed";
  votesFor: number;
  votesAgainst: number;
  voters: { [userId: string]: "for" | "against" }; // Maps userId to vote direction
}

export interface Comment {
  id: string;
  targetId: string;
  targetType: TargetType;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  timestamp: string;
  side?: "for" | "against" | "neutral"; // For debate comments
  parentCommentId?: string;
  replyToUserId?: string;
  replyToUserName?: string;
  helpfulCount?: number;
  helpfulVoters?: string[];
}

export interface Report {
  id: string;
  targetId: string;
  targetType: "writing" | "speaking" | "comment" | "debate";
  reason: string;
  reportedBy: string;
  timestamp: string;
  status: "pending" | "resolved";
  contentPreview?: string; // Preview of reported content for admin dashboard
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  color: string;
  criteria: string;
}

export interface Founder {
  id: string;
  name: string;
  role: string;
  bio: string;
  school: string;
  imageUrl?: string;
  displayOrder: number;
  createdAt?: string;
}

export interface InAppNotification {
  id: string;
  userId: string; // Target student who receives this notification
  senderId: string; // Creator of the action
  senderName: string;
  type: "comment_debate" | "reply_comment" | "helpful_critique";
  targetId: string; // Debate ID
  targetTitle: string; // Debate Topic Title
  content: string; // Message content
  timestamp: string;
  read: boolean;
}

