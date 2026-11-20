import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/useAuth";
import { api } from "../../../lib/api";
import type { DayMenu, FoodWastageRecord, MessReviewItem, FoodWastageReport } from "../../../types";
import {
  UtensilsCrossed,
  Sparkles,
  Edit2,
  Plus,
  Scale,
  Star,
  TrendingDown,
  ChefHat,
  Coffee,
  Sun,
  Moon,
  Cookie,
  CheckCircle2,
  AlertCircle,
  BarChart2,
} from "lucide-react";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export function MessPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"MENU" | "WASTAGE" | "REVIEWS">("MENU");
  const [menu, setMenu] = useState<DayMenu[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("MONDAY");
  const [wastageData, setWastageData] = useState<{
    records: FoodWastageRecord[];
    totals: { totalPrepared: number; totalWasted: number; totalServed: number };
    byMeal: Array<{ _id: string; prepared: number; wasted: number; count: number }>;
  }>({
    records: [],
    totals: { totalPrepared: 0, totalWasted: 0, totalServed: 0 },
    byMeal: [],
  });
  const [reviewsData, setReviewsData] = useState<{
    reviews: MessReviewItem[];
    stats: { avgOverall: number; avgTaste: number; avgQuality: number; avgHygiene: number; total: number };
  }>({
    reviews: [],
    stats: { avgOverall: 4.2, avgTaste: 4.0, avgQuality: 4.1, avgHygiene: 4.5, total: 0 },
  });
  const [loading, setLoading] = useState(true);

  // Edit Menu Modal
  const [editingDay, setEditingDay] = useState<DayMenu | null>(null);
  const [editBreakfast, setEditBreakfast] = useState("");
  const [editLunch, setEditLunch] = useState("");
  const [editSnacks, setEditSnacks] = useState("");
  const [editDinner, setEditDinner] = useState("");
  const [editSpecial, setEditSpecial] = useState("");
  const [savingMenu, setSavingMenu] = useState(false);

  // Add Wastage Modal
  const [isWastageModalOpen, setIsWastageModalOpen] = useState(false);
  const [wasteDate, setWasteDate] = useState(new Date().toISOString().slice(0, 10));
  const [wasteMealType, setWasteMealType] = useState<"BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER">("DINNER");
  const [studentsServed, setStudentsServed] = useState("220");
  const [preparedKg, setPreparedKg] = useState("110");
  const [wastedKg, setWastedKg] = useState("16");
  const [wasteNotes, setWasteNotes] = useState("");
  const [savingWastage, setSavingWastage] = useState(false);

  // AI Wastage Report Modal
  const [aiReport, setAiReport] = useState<FoodWastageReport | null>(null);
  const [isAiReportOpen, setIsAiReportOpen] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Add Review Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewMealType, setReviewMealType] = useState<"BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER">("DINNER");
  const [rating, setRating] = useState(5);
  const [foodQuality, setFoodQuality] = useState(5);
  const [hygiene, setHygiene] = useState(5);
  const [taste, setTaste] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const canEditMenu =
    user?.role === "MESS_COORDINATOR" ||
    user?.role === "STUDENT_COORDINATOR" ||
    user?.role === "ADMIN";

  const canLogWastage =
    user?.role === "MESS_COORDINATOR" ||
    user?.role === "ADMIN" ||
    user?.role === "SUPERVISOR";

  useEffect(() => {
    fetchMessData();
  }, []);

  async function fetchMessData() {
    try {
      setLoading(true);
      const [menuRes, wastageRes, reviewsRes] = await Promise.allSettled([
        api.get("/mess/menu"),
        api.get("/mess/wastage"),
        api.get("/mess/reviews"),
      ]);

      if (menuRes.status === "fulfilled" && menuRes.value.data?.data) {
        setMenu(menuRes.value.data.data);
      }
      if (wastageRes.status === "fulfilled" && wastageRes.value.data?.data) {
        setWastageData(wastageRes.value.data.data);
      }
      if (reviewsRes.status === "fulfilled" && reviewsRes.value.data?.data) {
        setReviewsData(reviewsRes.value.data.data);
      }
    } catch (err) {
      console.error("Failed to load mess data:", err);
    } finally {
      setLoading(false);
    }
  }

  const openEditMenuModal = (dayMenu: DayMenu) => {
    setEditingDay(dayMenu);
    setEditBreakfast(dayMenu.breakfast);
    setEditLunch(dayMenu.lunch);
    setEditSnacks(dayMenu.snacks);
    setEditDinner(dayMenu.dinner);
    setEditSpecial(dayMenu.special || "");
  };

  async function handleSaveMenu(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDay) return;
    setSavingMenu(true);
    try {
      const res = await api.put("/mess/menu", {
        day: editingDay.day,
        breakfast: editBreakfast,
        lunch: editLunch,
        snacks: editSnacks,
        dinner: editDinner,
        special: editSpecial,
      });

      if (res.data?.data) {
        setMenu((prev) =>
          prev.map((m) => (m.day === editingDay.day ? res.data.data : m)),
        );
        setEditingDay(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update menu");
    } finally {
      setSavingMenu(false);
    }
  }

  async function handleSaveWastage(e: React.FormEvent) {
    e.preventDefault();
    setSavingWastage(true);
    try {
      await api.post("/mess/wastage", {
        date: wasteDate,
        mealType: wasteMealType,
        studentsServed: Number(studentsServed),
        preparedKg: Number(preparedKg),
        wastedKg: Number(wastedKg),
        notes: wasteNotes,
      });

      setIsWastageModalOpen(false);
      fetchMessData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to log wastage");
    } finally {
      setSavingWastage(false);
    }
  }

  async function handleGenerateAiReport() {
    setIsAiReportOpen(true);
    setGeneratingReport(true);
    try {
      const res = await api.post("/mess/ai-report");
      if (res.data?.data) {
        setAiReport(res.data.data);
      }
    } catch (err: any) {
      console.error("AI report error:", err);
    } finally {
      setGeneratingReport(false);
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await api.post("/mess/reviews", {
        mealType: reviewMealType,
        rating,
        foodQuality,
        hygiene,
        taste,
        comment: reviewComment,
      });

      if (res.data?.data) {
        setIsReviewModalOpen(false);
        setReviewComment("");
        fetchMessData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  }

  const currentDayMenu =
    menu.find((m) => m.day === selectedDay) || menu[0] || {
      day: "MONDAY",
      breakfast: "Idli, Sambar, Coconut Chutney, Tea",
      lunch: "Rajma, Steamed Rice, Mix Veg, Curd, Roti",
      snacks: "Samosa, Mint Chutney, Chai",
      dinner: "Dal Tadka, Shahi Paneer, Jeera Rice, Chapati, Gulab Jamun",
      special: "Gulab Jamun dessert",
    };

  const totalPrepared = wastageData.totals.totalPrepared || 1;
  const totalWasted = wastageData.totals.totalWasted || 0;
  const wastePercent = Math.round((totalWasted / totalPrepared) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="drizzle-badge drizzle-badge-yellow">
              <ChefHat size={12} /> DINING & AI FOOD ANALYTICS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Mess Schedule & Food Wastage Analytics
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Weekly dining schedule, food wastage log, AI dish continuation intelligence, and student quality reviews.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleGenerateAiReport}
            className="inline-flex items-center gap-2 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-2.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20 transition-all cursor-pointer"
          >
            <Sparkles size={15} />
            <span>AI Wastage & Quality Report</span>
          </button>

          {activeTab === "WASTAGE" && canLogWastage && (
            <button
              onClick={() => setIsWastageModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-xs font-bold text-zinc-950 hover:bg-yellow-300 shadow-sm transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Log Wastage</span>
            </button>
          )}

          {activeTab === "REVIEWS" && (
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-xs font-bold text-zinc-950 hover:bg-yellow-300 shadow-sm transition-all cursor-pointer"
            >
              <Star size={16} className="fill-zinc-950" />
              <span>Write Review</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs: Weekly Menu / Food Wastage / Reviews */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] p-1 text-xs">
        <button
          onClick={() => setActiveTab("MENU")}
          className={`rounded-lg px-3 sm:px-4 py-2 font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "MENU"
              ? "bg-yellow-400 text-zinc-950 shadow-xs font-bold"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          🍽️ Weekly Menu
        </button>
        <button
          onClick={() => setActiveTab("WASTAGE")}
          className={`rounded-lg px-3 sm:px-4 py-2 font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "WASTAGE"
              ? "bg-yellow-400 text-zinc-950 shadow-xs font-bold"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          ⚖️ Wastage ({wastePercent}%)
        </button>
        <button
          onClick={() => setActiveTab("REVIEWS")}
          className={`rounded-lg px-3 sm:px-4 py-2 font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "REVIEWS"
              ? "bg-yellow-400 text-zinc-950 shadow-xs font-bold"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          ⭐ Reviews ({reviewsData.stats.avgOverall?.toFixed(1) || "4.2"}/5)
        </button>
      </div>

      {/* TAB 1: WEEKLY MENU PLANNER */}
      {activeTab === "MENU" && (
        <div className="space-y-4">
          {/* Day of Week Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {DAYS.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedDay === d
                    ? "bg-yellow-400 text-zinc-950 shadow-xs shadow-yellow-400/20 font-bold"
                    : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] text-zinc-600 dark:text-zinc-400 hover:border-yellow-400/40"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Selected Day Meals Grid */}
          <div className="drizzle-card p-6 border-yellow-500/30">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-6">
              <div>
                <span className="font-mono text-[11px] text-yellow-600 dark:text-yellow-400 font-bold uppercase">
                  SCHEDULED MENU
                </span>
                <h2 className="text-xl font-extrabold">{currentDayMenu.day}</h2>
              </div>

              {canEditMenu && (
                <button
                  onClick={() => openEditMenuModal(currentDayMenu)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-3 py-1.5 text-xs font-bold text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20 cursor-pointer"
                >
                  <Edit2 size={13} />
                  <span>Edit {currentDayMenu.day} Menu</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Breakfast */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#18191f] p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-500 mb-2">
                  <Coffee size={16} />
                  <span>BREAKFAST (7:30 - 9:30 AM)</span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed font-medium">
                  {currentDayMenu.breakfast}
                </p>
              </div>

              {/* Lunch */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#18191f] p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-yellow-500 mb-2">
                  <Sun size={16} />
                  <span>LUNCH (12:30 - 2:30 PM)</span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed font-medium">
                  {currentDayMenu.lunch}
                </p>
              </div>

              {/* Snacks */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#18191f] p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-500 mb-2">
                  <Cookie size={16} />
                  <span>SNACKS (5:00 - 6:00 PM)</span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed font-medium">
                  {currentDayMenu.snacks}
                </p>
              </div>

              {/* Dinner */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#18191f] p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400 mb-2">
                  <Moon size={16} />
                  <span>DINNER (8:00 - 10:00 PM)</span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed font-medium">
                  {currentDayMenu.dinner}
                </p>
              </div>
            </div>

            {/* Chef Special Dish */}
            {currentDayMenu.special && (
              <div className="mt-4 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-3 flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-300">
                <ChefHat size={16} className="shrink-0 text-yellow-500" />
                <span>
                  <strong>Chef's Special:</strong> {currentDayMenu.special}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WASTAGE TRACKER */}
      {activeTab === "WASTAGE" && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="drizzle-card p-5">
              <span className="text-xs font-mono text-zinc-500">TOTAL FOOD PREPARED</span>
              <div className="text-2xl font-extrabold mt-1">
                {wastageData.totals.totalPrepared} kg
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Across {wastageData.totals.totalServed} student servings
              </p>
            </div>

            <div className="drizzle-card p-5">
              <span className="text-xs font-mono text-zinc-500">TOTAL FOOD WASTED</span>
              <div className="text-2xl font-extrabold text-rose-500 mt-1">
                {wastageData.totals.totalWasted} kg
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Average left-over food rate
              </p>
            </div>

            <div className="drizzle-card p-5">
              <span className="text-xs font-mono text-zinc-500">KITCHEN EFFICIENCY SCORE</span>
              <div className="text-2xl font-extrabold text-emerald-500 mt-1">
                {Math.max(10, 100 - wastePercent)}%
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                {wastePercent <= 15 ? "Excellent portion management" : "Improvement advised by AI"}
              </p>
            </div>
          </div>

          {/* Wastage Logs Table */}
          <div className="drizzle-card overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Scale size={16} className="text-yellow-500" />
                Daily Meal Wastage Log
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">
                {wastageData.records.length} records logged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] text-zinc-500 font-mono">
                  <tr>
                    <th className="p-3.5">DATE</th>
                    <th className="p-3.5">MEAL</th>
                    <th className="p-3.5">SERVED</th>
                    <th className="p-3.5">PREPARED (KG)</th>
                    <th className="p-3.5">WASTED (KG)</th>
                    <th className="p-3.5">WASTE %</th>
                    <th className="p-3.5">REMARKS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {wastageData.records.map((r) => {
                    const pct = Math.round((r.wastedKg / (r.preparedKg || 1)) * 100);
                    return (
                      <tr key={r._id} className="hover:bg-zinc-50/50 dark:hover:bg-[#14151a]">
                        <td className="p-3.5 font-mono">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="p-3.5 font-bold">{r.mealType}</td>
                        <td className="p-3.5 font-mono">{r.studentsServed}</td>
                        <td className="p-3.5 font-mono">{r.preparedKg} kg</td>
                        <td className="p-3.5 font-mono text-rose-500 font-bold">{r.wastedKg} kg</td>
                        <td className="p-3.5 font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              pct > 20
                                ? "bg-rose-500/20 text-rose-500"
                                : pct > 10
                                ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                                : "bg-emerald-500/20 text-emerald-500"
                            }`}
                          >
                            {pct}%
                          </span>
                        </td>
                        <td className="p-3.5 text-zinc-500">{r.notes || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT REVIEWS */}
      {activeTab === "REVIEWS" && (
        <div className="space-y-6">
          {/* Reviews Score Card */}
          <div className="drizzle-card p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-extrabold text-yellow-500">
                {reviewsData.stats.avgOverall?.toFixed(1) || "4.2"}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Overall Rating</p>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                {reviewsData.stats.avgTaste?.toFixed(1) || "4.0"}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Taste Score</p>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                {reviewsData.stats.avgQuality?.toFixed(1) || "4.1"}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Food Quality</p>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-emerald-500">
                {reviewsData.stats.avgHygiene?.toFixed(1) || "4.5"}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Hygiene Rating</p>
            </div>
          </div>

          {/* Reviews List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviewsData.reviews.map((rev) => (
              <div key={rev._id} className="drizzle-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-yellow-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        className={s <= rev.rating ? "fill-yellow-400 text-yellow-400" : "text-zinc-600"}
                      />
                    ))}
                    <span className="text-xs font-bold font-mono ml-1">{rev.rating}/5</span>
                  </div>
                  <span className="drizzle-badge drizzle-badge-yellow text-[10px]">
                    {rev.mealType}
                  </span>
                </div>

                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed mt-2">
                  "{rev.comment || "Good food quality and prompt refilling."}"
                </p>

                <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Student: {rev.studentId?.fullName || "Resident"} ({rev.studentId?.block || "Block A"})</span>
                  <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Menu Modal */}
      {editingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setEditingDay(null)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-yellow-500/40 bg-white dark:bg-[#111216] p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold flex items-center gap-2">
              <ChefHat size={18} className="text-yellow-500" />
              Edit {editingDay.day} Mess Menu
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Authorized for Mess Incharge and Student Representative.
            </p>

            <form onSubmit={handleSaveMenu} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  BREAKFAST
                </label>
                <input
                  type="text"
                  value={editBreakfast}
                  onChange={(e) => setEditBreakfast(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  LUNCH
                </label>
                <input
                  type="text"
                  value={editLunch}
                  onChange={(e) => setEditLunch(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  SNACKS
                </label>
                <input
                  type="text"
                  value={editSnacks}
                  onChange={(e) => setEditSnacks(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  DINNER
                </label>
                <input
                  type="text"
                  value={editDinner}
                  onChange={(e) => setEditDinner(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  CHEF SPECIAL DISH
                </label>
                <input
                  type="text"
                  value={editSpecial}
                  onChange={(e) => setEditSpecial(e.target.value)}
                  placeholder="e.g. Shahi Kheer / Ice cream"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingDay(null)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMenu}
                  className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-yellow-300"
                >
                  {savingMenu ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Wastage Modal */}
      {isWastageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setIsWastageModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] p-6 shadow-2xl z-10">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Scale size={18} className="text-yellow-500" />
              Log Daily Food Wastage
            </h2>
            <form onSubmit={handleSaveWastage} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    DATE
                  </label>
                  <input
                    type="date"
                    value={wasteDate}
                    onChange={(e) => setWasteDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    MEAL TYPE
                  </label>
                  <select
                    value={wasteMealType}
                    onChange={(e) => setWasteMealType(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="SNACKS">Snacks</option>
                    <option value="DINNER">Dinner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    SERVED
                  </label>
                  <input
                    type="number"
                    value={studentsServed}
                    onChange={(e) => setStudentsServed(e.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-2.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    PREPARED (KG)
                  </label>
                  <input
                    type="number"
                    value={preparedKg}
                    onChange={(e) => setPreparedKg(e.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-2.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    WASTED (KG)
                  </label>
                  <input
                    type="number"
                    value={wastedKg}
                    onChange={(e) => setWastedKg(e.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-2.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  NOTES & LEFT-OVER REASON
                </label>
                <textarea
                  value={wasteNotes}
                  onChange={(e) => setWasteNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Higher vegetable curry waste; rotis consumed completely."
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsWastageModalOpen(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingWastage}
                  className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-yellow-300"
                >
                  {savingWastage ? "Logging..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setIsReviewModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] p-6 shadow-2xl z-10">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Star size={18} className="text-yellow-500 fill-yellow-500" />
              Rate Mess Food Quality
            </h2>
            <form onSubmit={handleSubmitReview} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  MEAL REVIEWED
                </label>
                <select
                  value={reviewMealType}
                  onChange={(e) => setReviewMealType(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                >
                  <option value="BREAKFAST">Breakfast</option>
                  <option value="LUNCH">Lunch</option>
                  <option value="SNACKS">Snacks</option>
                  <option value="DINNER">Dinner</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    OVERALL RATING ({rating}/5)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full accent-yellow-400 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    TASTE SCORE ({taste}/5)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={taste}
                    onChange={(e) => setTaste(Number(e.target.value))}
                    className="w-full accent-yellow-400 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  FEEDBACK / SUGGESTION
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  placeholder="Share feedback on taste, salt/spices, temperature, or hygiene..."
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-yellow-300"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Wastage & Quality Intelligence Report Modal */}
      {isAiReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setIsAiReportOpen(false)}
          />
          <div className="relative w-full max-w-2xl rounded-2xl border border-yellow-500/40 bg-white dark:bg-[#111216] p-6 sm:p-7 shadow-2xl z-10 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-yellow-400/20 text-yellow-500 flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold">
                    AI Food Wastage & Menu Continuation Intelligence
                  </h2>
                  <p className="text-[11px] text-zinc-500">
                    Gemini AI analysis combining kitchen wastage logs and student review ratings
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiReportOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            {generatingReport ? (
              <div className="py-12 text-center space-y-2">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
                <p className="text-xs text-zinc-400 font-mono">
                  Gemini is analyzing food wastage records, student ratings, and portion efficiency...
                </p>
              </div>
            ) : aiReport ? (
              <div className="mt-4 space-y-4 text-xs">
                {/* Executive Summary */}
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans">
                  <strong>AI Operational Assessment:</strong> {aiReport.summary}
                </div>

                {/* Dish Continuation / Improvement Decisions */}
                <div>
                  <h4 className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-2">
                    Dish Performance & Continuation Decisions
                  </h4>
                  <div className="space-y-2">
                    {aiReport.continuationAdvice?.map((advice, i) => {
                      const isContinue = advice.action === "CONTINUE";
                      const isModify = advice.action === "MODIFY_RECIPE" || advice.action === "ADJUST_PORTION";
                      return (
                        <div
                          key={i}
                          className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-[#18191f] flex items-start justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
                              <span>{advice.dish}</span>
                              <span className="font-mono text-[10px] text-zinc-400">({advice.mealType})</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-1">
                              {advice.reason}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                              isContinue
                                ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                                : isModify
                                ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30"
                                : "bg-rose-500/15 text-rose-500 border-rose-500/30"
                            }`}
                          >
                            {advice.action.replace("_", " ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Practical Waste Reduction Tips */}
                <div>
                  <h4 className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                    Actionable Kitchen Efficiency Strategies
                  </h4>
                  <div className="space-y-1 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-[#14151a]">
                    {aiReport.wastageReductionTips?.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 py-6 text-center">
                Report could not be generated.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
