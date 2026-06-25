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
}

export interface Lesson {
  id: string;
  title: string;
  category: ContentCategory;
  difficultyLevel: EnglishLevel;
  contentBody: string;
  resources?: string[];
  createdAt: string;
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
