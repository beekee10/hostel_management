import type { Role, User } from "./auth";

export * from "./auth";
export * from "./api";

export type ComplaintCategory =
  | "HEALTH"
  | "MAINTENANCE"
  | "ELECTRICITY"
  | "PLUMBING"
  | "CLEANLINESS"
  | "WATER"
  | "INTERNET"
  | "SECURITY"
  | "MESS"
  | "OTHER";

export type ComplaintStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED";

export type ComplaintSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Complaint {
  _id: string;
  studentId: User | string;
  title: string;
  description: string;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  urgencyScore: number;
  priorityScore: number;
  status: ComplaintStatus;
  block: string;
  roomNumber?: string;
  aiProcessed: boolean;
  aiReason?: string;
  forwardedTo?: string;
  coordinatorNotes?: string;
  forwardedBy?: User;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClusteredIssue {
  topic: string;
  count: number;
  severity: ComplaintSeverity;
  affectedArea: string;
  recommendedAction: string;
}

export interface SupervisorSummary {
  summary: string;
  hotTopics: Array<{ topic: string; count: number; severity: string }>;
  clusteredIssues: ClusteredIssue[];
  criticalAlerts: string[];
  actionablePlan: string[];
  totalActiveComplaints: number;
  criticalCount: number;
  highCount: number;
}

export type NoticeType =
  | "GENERAL"
  | "ELECTRICITY"
  | "WATER"
  | "MAINTENANCE"
  | "EMERGENCY"
  | "MESS"
  | "EVENT";

export interface Notice {
  _id: string;
  title: string;
  body: string;
  type: NoticeType;
  block?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  affectedAreas?: string;
  isEmergency: boolean;
  isPinned: boolean;
  expiresAt?: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface HotTopic {
  _id: string;
  title: string;
  content: string;
  authorId: User;
  tags: string[];
  upvotes: string[];
  commentCount: number;
  heatScore: number;
  cardSize: "sm" | "md" | "lg" | "xl";
  sentiment: "POSITIVE" | "NEUTRAL" | "CONCERN" | "CRITICAL";
  aiSummary?: string;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TopicComment {
  _id: string;
  topicId: string;
  authorId: User;
  content: string;
  upvotes: string[];
  createdAt: string;
}

export interface LendItem {
  _id: string;
  ownerId: User;
  title: string;
  description?: string;
  category: "CYCLE" | "LAPTOP" | "BOOK" | "FOOD" | "ELECTRONICS" | "OTHER";
  status: "AVAILABLE" | "RESERVED" | "LENT" | "CLOSED";
  locationHint?: string;
  createdAt: string;
}

export interface ItemOffer {
  _id: string;
  giverId: User;
  message: string;
  roomHint?: string;
  status: "PENDING" | "ACCEPTED" | "IGNORED";
  offeredAt: string;
}

export interface ItemRequest {
  _id: string;
  requesterId: User;
  itemName: string;
  category: "FOOD_SNACKS" | "STUDY_TOOLS" | "ELECTRONICS" | "MEDICINE" | "DAILY_ESSENTIALS" | "OTHER";
  description?: string;
  urgency: "CASUAL" | "URGENT" | "LATE_NIGHT";
  status: "OPEN" | "OFFER_RECEIVED" | "ACCEPTED" | "COMPLETED" | "CANCELLED";
  offers: ItemOffer[];
  acceptedOfferId?: string;
  acceptedGiverId?: User;
  createdAt: string;
  updatedAt: string;
}

export interface DayMenu {
  _id?: string;
  day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
  special?: string;
}

export interface FoodWastageRecord {
  _id: string;
  date: string;
  mealType: "BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER";
  studentsServed: number;
  preparedKg: number;
  wastedKg: number;
  notes?: string;
  createdAt: string;
}

export interface MessReviewItem {
  _id: string;
  studentId: User;
  mealType: "BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER";
  rating: number;
  foodQuality: number;
  hygiene: number;
  taste: number;
  comment?: string;
  createdAt: string;
}

export interface FoodWastageReport {
  summary: string;
  overallEfficiencyScore: number;
  highWasteMeals: string[];
  continuationAdvice: Array<{
    dish: string;
    mealType: string;
    action: "CONTINUE" | "DISCONTINUE" | "MODIFY_RECIPE" | "ADJUST_PORTION";
    reason: string;
  }>;
  wastageReductionTips: string[];
  qualityImprovementSuggestions: string[];
}

export interface Conversation {
  _id: string;
  type: "CHANNEL" | "DIRECT" | "GROUP";
  name: string;
  topic?: string;
  participants?: User[];
  blockedBy?: string[];
  lastMessage?: {
    text: string;
    senderName: string;
    sentAt: string;
  };
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: User;
  text: string;
  tag: "GENERAL" | "URGENT" | "ANNOUNCEMENT" | "COMPLAINT";
  readBy?: string[];
  createdAt: string;
}

export type EventCategory =
  | "SPORTS"
  | "CULTURAL"
  | "WORKSHOP"
  | "HACKATHON"
  | "CELEBRATION"
  | "MEETING"
  | "OTHER";

export interface HostelEvent {
  _id: string;
  title: string;
  description: string;
  category: EventCategory;
  venue: string;
  googleFormUrl?: string;
  eventDate: string;
  endDate?: string;
  coverImage?: string;
  createdBy: User;
  studentManagers: User[];
  attendees: User[];
  maxAttendees?: number;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}

