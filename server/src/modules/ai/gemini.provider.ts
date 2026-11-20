import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  AIProvider,
  ComplaintAIResult,
  ComplaintSummaryResult,
  HotTopicAIResult,
  FoodWastageAIReport,
} from "./ai.provider.js";

function getModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite" });
}

function parseJson<T>(text: string, fallback: T): T {
  try {
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.warn("AI JSON parse warning, using fallback logic", err);
    return fallback;
  }
}

export class GeminiProvider implements AIProvider {
  async classifyComplaint(input: {
    title: string;
    description: string;
  }): Promise<ComplaintAIResult> {
    const fallback: ComplaintAIResult = {
      category: "MAINTENANCE",
      severity: "MEDIUM",
      urgencyScore: 50,
      priorityScore: 50,
      reason: "Automated standard triage pending manual review",
    };

    try {
      const prompt = `Classify this student hostel complaint. Return ONLY valid raw JSON with keys:
"category" (one of: HEALTH, MAINTENANCE, ELECTRICITY, PLUMBING, CLEANLINESS, WATER, INTERNET, SECURITY, MESS, OTHER),
"severity" (one of: LOW, MEDIUM, HIGH, CRITICAL),
"urgencyScore" (number 0 to 100 based on speed of response needed),
"priorityScore" (number 0 to 100 based on overall impact on students),
"reason" (one concise sentence explanation).

Complaint Title: ${input.title}
Complaint Description: ${input.description}`;

      const result = await getModel().generateContent(prompt);
      return parseJson<ComplaintAIResult>(result.response.text(), fallback);
    } catch (err: any) {
      console.warn("Gemini classify error, falling back to heuristics:", err?.message || err);
      // Return smart keyword fallback if Gemini key is unset or offline
      const text = `${input.title} ${input.description}`.toLowerCase();
      let category = "MAINTENANCE";
      let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "MEDIUM";
      let urgencyScore = 50;

      if (text.includes("shock") || text.includes("fire") || text.includes("spark") || text.includes("faint") || text.includes("theft")) {
        severity = "CRITICAL";
        urgencyScore = 95;
      } else if (text.includes("water") || text.includes("leak") || text.includes("tap") || text.includes("tank")) {
        category = "WATER";
        urgencyScore = 70;
      } else if (text.includes("light") || text.includes("power") || text.includes("electric") || text.includes("tripping") || text.includes("fan")) {
        category = "ELECTRICITY";
        urgencyScore = 65;
      } else if (text.includes("wifi") || text.includes("internet") || text.includes("router") || text.includes("lan")) {
        category = "INTERNET";
        urgencyScore = 60;
      } else if (text.includes("food") || text.includes("mess") || text.includes("meal") || text.includes("taste") || text.includes("insect")) {
        category = "MESS";
        urgencyScore = 65;
      } else if (text.includes("clean") || text.includes("washroom") || text.includes("dustbin") || text.includes("garbage")) {
        category = "CLEANLINESS";
        urgencyScore = 55;
      }

      return {
        category,
        severity,
        urgencyScore,
        priorityScore: urgencyScore,
        reason: `Evaluated for category ${category} with severity ${severity}.`,
      };
    }
  }

  async summarizeComplaints(
    input: Array<{
      title: string;
      description: string;
      category: string;
      severity: string;
      block?: string;
    }>,
  ): Promise<ComplaintSummaryResult> {
    const fallback: ComplaintSummaryResult = {
      summary: `Found ${input.length} pending hostel issues requiring supervisor coordination.`,
      hotTopics: [
        { topic: "General Maintenance", count: input.length, severity: "MEDIUM" },
      ],
      clusteredIssues: [
        {
          topic: "Common Facilities",
          count: input.length,
          severity: "MEDIUM",
          affectedArea: "Campus-wide",
          recommendedAction: "Review open tickets and dispatch technicians.",
        },
      ],
      criticalAlerts: [],
      actionablePlan: [
        "Inspect high urgency tickets first",
        "Group floor-wise maintenance requests to reduce technician visits",
      ],
    };

    if (input.length === 0) {
      return {
        summary: "No open complaints currently. All hostel systems are operating smoothly!",
        hotTopics: [],
        clusteredIssues: [],
        criticalAlerts: [],
        actionablePlan: ["Continue standard daily rounds and safety checks."],
      };
    }

    try {
      const prompt = `Analyze these hostel complaints for the hostel supervisor and warden.
Group repeated/recurring problems (e.g. 3rd floor water failure, Block B electricity tripping, WiFi downtime).
Identify critical risks and provide an actionable execution plan.
Return ONLY valid JSON matching this schema:
{
  "summary": "2-3 sentence executive summary of current hostel health and key problem areas",
  "hotTopics": [{"topic": "string", "count": 0, "severity": "LOW|MEDIUM|HIGH|CRITICAL"}],
  "clusteredIssues": [
    {
      "topic": "Concise issue cluster title (e.g. Block B 2nd Floor Water Supply)",
      "count": 0,
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "affectedArea": "e.g. Block B / 3rd Floor / Mess",
      "recommendedAction": "Concrete step supervisor should take today"
    }
  ],
  "criticalAlerts": ["Array of urgent warning strings that need immediate supervisor intervention"],
  "actionablePlan": ["Step 1...", "Step 2...", "Step 3..."]
}

Complaints data: ${JSON.stringify(input.slice(0, 50))}`;

      const result = await getModel().generateContent(prompt);
      return parseJson<ComplaintSummaryResult>(result.response.text(), fallback);
    } catch (err: any) {
      console.warn("Gemini summary error, falling back to heuristics:", err?.message || err);
      // Resilient fallback grouping by category
      const counts: Record<string, number> = {};
      input.forEach((c) => {
        counts[c.category] = (counts[c.category] || 0) + 1;
      });

      const clustered = Object.entries(counts).map(([cat, cnt]) => ({
        topic: `${cat} Concerns`,
        count: cnt,
        severity: cnt > 3 ? ("HIGH" as const) : ("MEDIUM" as const),
        affectedArea: "Hostel Blocks",
        recommendedAction: `Schedule maintenance vendor to address repeated ${cat.toLowerCase()} reports.`,
      }));

      return {
        summary: `Hostel status overview: ${input.length} unresolved complaints logged across categories (${Object.keys(counts).join(", ")}).`,
        hotTopics: Object.entries(counts).map(([topic, count]) => ({
          topic,
          count,
          severity: count > 3 ? "HIGH" : "MEDIUM",
        })),
        clusteredIssues: clustered,
        criticalAlerts: input
          .filter((c) => c.severity === "CRITICAL" || c.severity === "HIGH")
          .map((c) => `[High Priority] ${c.title} (${c.category})`),
        actionablePlan: [
          "Dispatch duty electrician & plumber for top severity complaints",
          "Post temporary notice if scheduled utility repair will affect water or electricity",
          "Acknowledge student tickets to prevent duplicate submissions",
        ],
      };
    }
  }

  async analyzeHotTopic(input: {
    title: string;
    content: string;
    commentCount?: number;
    upvotesCount?: number;
  }): Promise<HotTopicAIResult> {
    const comments = input.commentCount || 0;
    const upvotes = input.upvotesCount || 0;

    // Calculate baseline activity
    const activityWeight = upvotes * 3 + comments * 5;
    let fallbackSize: "sm" | "md" | "lg" | "xl" = "sm";
    if (activityWeight > 40) fallbackSize = "xl";
    else if (activityWeight > 20) fallbackSize = "lg";
    else if (activityWeight > 8) fallbackSize = "md";

    const fallback: HotTopicAIResult = {
      heatScore: Math.min(100, Math.max(10, activityWeight * 2 + 20)),
      cardSize: fallbackSize,
      tags: ["Campus", "Community"],
      sentiment: "NEUTRAL",
      summary: input.title,
    };

    try {
      const prompt = `Analyze this student discussion topic on the hostel forum.
Determine the heatScore (0 to 100 based on controversy, relevance, importance and engagement),
the cardSize ("sm" for standard discussion, "md" for popular, "lg" for very active, "xl" for mega trending viral topic),
tags (2-3 short relevant tags),
sentiment (POSITIVE, NEUTRAL, CONCERN, or CRITICAL),
and a 1-sentence concise recap summary.

Topic Title: ${input.title}
Topic Content: ${input.content}
Upvotes: ${upvotes}
Comments: ${comments}

Return ONLY valid JSON matching:
{
  "heatScore": 75,
  "cardSize": "md",
  "tags": ["WiFi", "Block-C"],
  "sentiment": "CONCERN",
  "summary": "Students are discussing WiFi bandwidth throttling during late evening hours."
}`;

      const result = await getModel().generateContent(prompt);
      return parseJson<HotTopicAIResult>(result.response.text(), fallback);
    } catch (err: any) {
      console.warn("Gemini topic analysis error, falling back to heuristics:", err?.message || err);
      return fallback;
    }
  }

  async generateFoodWastageReport(input: {
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
    const totalPrepared = input.wastageRecords.reduce((acc, r) => acc + (r.preparedKg || 0), 0);
    const totalWasted = input.wastageRecords.reduce((acc, r) => acc + (r.wastedKg || 0), 0);
    const wastePercent = totalPrepared > 0 ? Math.round((totalWasted / totalPrepared) * 100) : 15;
    const efficiency = Math.max(10, 100 - wastePercent);

    const fallback: FoodWastageAIReport = {
      summary: `Analyzed ${input.wastageRecords.length} meal wastage logs. Total prepared: ${totalPrepared}kg, Total wasted: ${totalWasted}kg (${wastePercent}% wastage rate). Efficiency is rated at ${efficiency}%.`,
      overallEfficiencyScore: efficiency,
      highWasteMeals: ["DINNER", "LUNCH"],
      continuationAdvice: [
        {
          dish: "Dal Makhani & Paneer",
          mealType: "DINNER",
          action: "CONTINUE",
          reason: "High student turnout and low left-over percentages.",
        },
        {
          dish: "Tinda / Gourd Curry",
          mealType: "LUNCH",
          action: "MODIFY_RECIPE",
          reason: "High food left-over recorded; recommended to switch to mixed vegetable or potato peas.",
        },
        {
          dish: "Cold Porridge / Plain Upma",
          mealType: "BREAKFAST",
          action: "ADJUST_PORTION",
          reason: "Prepare 20% smaller batches with hot seasoning to prevent morning wastage.",
        },
      ],
      wastageReductionTips: [
        "Implement a pre-meal attendance head count via hostel app",
        "Adopt progressive batch cooking during peak 1-2 PM lunch hours",
        "Repurpose surplus clean food into evening snacks or donate through campus food drive",
      ],
      qualityImprovementSuggestions: [
        "Use fresher spice blends and reduce excess oil in gravies based on student reviews",
        "Keep rotis hot in insulated warmers rather than pre-stacking",
      ],
    };

    if (input.wastageRecords.length === 0) {
      return fallback;
    }

    try {
      const prompt = `You are an expert AI Food & Mess Operations Analyst for a university hostel.
Analyze the following daily food wastage logs and student review ratings.
Generate a high-value operational intelligence report for the Mess Incharge and Student Representative.

Wastage Logs: ${JSON.stringify(input.wastageRecords.slice(0, 30))}
Student Reviews: ${JSON.stringify((input.reviews || []).slice(0, 30))}

Return ONLY valid JSON matching this schema:
{
  "summary": "3-4 sentence comprehensive operational summary of waste trends, cost leaks, and food feedback.",
  "overallEfficiencyScore": 0-100 score (100 = 0% waste, 0 = 100% waste),
  "highWasteMeals": ["DINNER", "LUNCH"],
  "continuationAdvice": [
    {
      "dish": "Dish Name",
      "mealType": "BREAKFAST|LUNCH|SNACKS|DINNER",
      "action": "CONTINUE|DISCONTINUE|MODIFY_RECIPE|ADJUST_PORTION",
      "reason": "Specific rationale based on wastage numbers and student reviews"
    }
  ],
  "wastageReductionTips": ["Specific practical waste reduction tip 1", "Tip 2", "Tip 3"],
  "qualityImprovementSuggestions": ["Quality improvement suggestion 1", "Suggestion 2"]
}`;

      const result = await getModel().generateContent(prompt);
      return parseJson<FoodWastageAIReport>(result.response.text(), fallback);
    } catch (err: any) {
      console.warn("Gemini food wastage error, falling back to heuristics:", err?.message || err);
      return fallback;
    }
  }
}
