import { GeminiProvider } from "./gemini.provider.js";
import type {
  AIProvider,
  ComplaintAIResult,
  ComplaintSummaryResult,
  HotTopicAIResult,
  FoodWastageAIReport,
} from "./ai.provider.js";

const provider: AIProvider = new GeminiProvider();

export function classifyComplaint(input: {
  title: string;
  description: string;
}): Promise<ComplaintAIResult> {
  return provider.classifyComplaint(input);
}

export function summarizeComplaints(
  input: Array<{
    title: string;
    description: string;
    category: string;
    severity: string;
    block?: string;
  }>,
): Promise<ComplaintSummaryResult> {
  return provider.summarizeComplaints(input);
}

export function analyzeHotTopic(input: {
  title: string;
  content: string;
  commentCount?: number;
  upvotesCount?: number;
}): Promise<HotTopicAIResult> {
  return provider.analyzeHotTopic(input);
}

export function generateFoodWastageReport(input: {
  wastageRecords: Array<{
    date: string | Date;
    mealType: string;
    studentsServed: number;
    preparedKg: number;
    wastedKg: number;
    notes?: string;
  }>;
  reviews?: Array<{
    mealType?: string;
    foodQuality: number;
    taste: number;
    hygiene: number;
    comment?: string;
  }>;
}): Promise<FoodWastageAIReport> {
  return provider.generateFoodWastageReport(input);
}
