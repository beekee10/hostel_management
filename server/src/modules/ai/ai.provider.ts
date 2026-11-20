export interface ComplaintAIResult {
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  urgencyScore: number;
  priorityScore: number;
  reason: string;
}

export interface ClusteredIssue {
  topic: string;
  count: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  affectedArea: string;
  recommendedAction: string;
}

export interface ComplaintSummaryResult {
  summary: string;
  hotTopics: Array<{ topic: string; count: number; severity: string }>;
  clusteredIssues: ClusteredIssue[];
  criticalAlerts: string[];
  actionablePlan: string[];
}

export interface HotTopicAIResult {
  heatScore: number;
  cardSize: "sm" | "md" | "lg" | "xl";
  tags: string[];
  sentiment: "POSITIVE" | "NEUTRAL" | "CONCERN" | "CRITICAL";
  summary: string;
}

export interface DishAdvice {
  dish: string;
  mealType: string;
  action: "CONTINUE" | "DISCONTINUE" | "MODIFY_RECIPE" | "ADJUST_PORTION";
  reason: string;
}

export interface FoodWastageAIReport {
  summary: string;
  overallEfficiencyScore: number;
  highWasteMeals: string[];
  continuationAdvice: DishAdvice[];
  wastageReductionTips: string[];
  qualityImprovementSuggestions: string[];
}

export interface AIProvider {
  classifyComplaint(input: { title: string; description: string }): Promise<ComplaintAIResult>;
  summarizeComplaints(
    input: Array<{
      title: string;
      description: string;
      category: string;
      severity: string;
      block?: string;
    }>,
  ): Promise<ComplaintSummaryResult>;
  analyzeHotTopic(input: {
    title: string;
    content: string;
    commentCount?: number;
    upvotesCount?: number;
  }): Promise<HotTopicAIResult>;
  generateFoodWastageReport(input: {
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
  }): Promise<FoodWastageAIReport>;
}
