import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import { MessReview } from "./mess-review.model.js";
import { FoodWastage as Wastage } from "./food-wastage.model.js";
import { MessMenu, DAYS_OF_WEEK } from "./mess-menu.model.js";
import { generateFoodWastageReport } from "../ai/ai.service.js";
import { AppError } from "../../utils/appError.js";

// =====================
// MESS MENU MANAGEMENT
// =====================

export async function getMenu(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let menu: any = await MessMenu.find().sort({ createdAt: 1 });

    // Auto-seed default menu if empty
    if (menu.length === 0) {
      const defaultMenu: Array<{
        day: (typeof DAYS_OF_WEEK)[number];
        breakfast: string;
        lunch: string;
        snacks: string;
        dinner: string;
        special: string;
      }> = [
        { day: "MONDAY", breakfast: "Idli, Sambar, Coconut Chutney, Tea/Coffee", lunch: "Rajma, Steamed Rice, Mix Veg, Curd, Roti", snacks: "Samosa, Mint Chutney, Chai", dinner: "Dal Tadka, Shahi Paneer, Jeera Rice, Chapati, Gulab Jamun", special: "Gulab Jamun" },
        { day: "TUESDAY", breakfast: "Poha, Boiled Egg/Sprouts, Banana, Milk/Tea", lunch: "Chole, Bhature/Puri, Rice, Green Salad, Boondi Raita", snacks: "Veg Cutlet, Tomato Sauce, Tea", dinner: "Egg Curry / Paneer Bhurji, Dal Makhani, Rice, Roti, Kheer", special: "Kheer" },
        { day: "WEDNESDAY", breakfast: "Aloo Paratha, Curd, Pickle, Tea/Coffee", lunch: "Kadhi Pakora, Rice, Aloo Gobi, Roti, Papad", snacks: "Pani Puri / Bhel, Tea", dinner: "Chicken Curry / Kadai Paneer, Dal Fry, Jeera Rice, Naan/Roti", special: "Kadai Paneer" },
        { day: "THURSDAY", breakfast: "Uttapam, Coconut & Tomato Chutney, Tea", lunch: "Dal Palak, Aloo Shimla Mirch, Rice, Roti, Chaas", snacks: "Bread Pakora, Green Chutney, Chai", dinner: "Veg Biryani / Chicken Biryani, Mirchi Ka Salan, Raita, Ice Cream", special: "Dum Biryani" },
        { day: "FRIDAY", breakfast: "Poori Bhaji, Halwa, Tea/Coffee", lunch: "Sambhar, Rasam, Rice, Poriyal, Curd, Appalam", snacks: "Maggi / Pasta, Tea", dinner: "Malai Kofta, Yellow Dal, Pulao, Butter Roti, Fruit Custard", special: "Fruit Custard" },
        { day: "SATURDAY", breakfast: "Masala Dosa, Sambar, Chutney, Milk/Tea", lunch: "Pav Bhaji, Pulao, Green Salad, Buttermilk", snacks: "Biscuits & Tea / Coffee", dinner: "Dal Tadka, Mix Veg Handi, Rice, Chapati, Sweet Boondi", special: "Pav Bhaji" },
        { day: "SUNDAY", breakfast: "Chole Kulche / Veg Sandwich, Juice, Coffee", lunch: "Special Thali: Paneer Butter Masala, Pulao, Poori, Raita", snacks: "French Fries, Tea", dinner: "Dal Makhani, Matar Paneer / Chicken Masala, Jeera Rice, Tandoori Roti, Rasgulla", special: "Sunday Feast" },
      ];
      menu = await MessMenu.insertMany(defaultMenu as any);
    }

    res.json({
      success: true,
      message: "Mess menu fetched",
      data: menu,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateDayMenu(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { day, breakfast, lunch, snacks, dinner, special } = req.body;

    if (!day || !DAYS_OF_WEEK.includes(day)) {
      throw new AppError("Valid day of week is required", 400, "VALIDATION_ERROR");
    }

    let record = await MessMenu.findOne({ day });
    if (record) {
      if (breakfast) record.breakfast = breakfast;
      if (lunch) record.lunch = lunch;
      if (snacks) record.snacks = snacks;
      if (dinner) record.dinner = dinner;
      if (special !== undefined) record.special = special;
      record.updatedBy = req.user!.userId as any;
      await record.save();
    } else {
      record = await MessMenu.create({
        day,
        breakfast,
        lunch,
        snacks,
        dinner,
        special: special || "",
        updatedBy: req.user!.userId,
      });
    }

    res.json({
      success: true,
      message: `Mess menu updated for ${day}`,
      data: record,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

// =====================
// MESS REVIEWS
// =====================

export async function listReviews(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const reviews = await MessReview.find({ status: "VISIBLE" })
      .populate("studentId", "fullName roomNumber block")
      .sort({ createdAt: -1 })
      .limit(50);

    const stats = await MessReview.aggregate([
      {
        $group: {
          _id: null,
          avgOverall: { $avg: "$rating" },
          avgTaste: { $avg: "$taste" },
          avgQuality: { $avg: "$foodQuality" },
          avgHygiene: { $avg: "$hygiene" },
          total: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      message: "Mess reviews fetched",
      data: {
        reviews,
        stats: stats[0] || { avgOverall: 4.2, avgTaste: 4.0, avgQuality: 4.1, avgHygiene: 4.5, total: 0 },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function createReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { mealType, rating, foodQuality, hygiene, taste, comment } = req.body;

    if (!mealType || !rating) {
      throw new AppError("Meal type and rating are required", 400, "VALIDATION_ERROR");
    }

    const review = await MessReview.create({
      studentId: req.user!.userId,
      mealType,
      rating: Number(rating),
      foodQuality: Number(foodQuality) || Number(rating),
      hygiene: Number(hygiene) || Number(rating),
      taste: Number(taste) || Number(rating),
      comment: comment || "",
      status: "VISIBLE",
    });

    const populated = await MessReview.findById(review._id).populate(
      "studentId",
      "fullName roomNumber block",
    );

    res.status(201).json({
      success: true,
      message: "Thank you! Your mess review has been submitted.",
      data: populated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

// =====================
// FOOD WASTAGE LOGS & AI
// =====================

export async function addWastage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { date, mealType, studentsServed, preparedKg, wastedKg, notes, hostelId } = req.body;

    if (!mealType || preparedKg === undefined || wastedKg === undefined) {
      throw new AppError("Meal type, prepared kg, and wasted kg are required", 400, "VALIDATION_ERROR");
    }

    const record = await Wastage.create({
      hostelId: hostelId || req.user!.userId,
      date: date ? new Date(date) : new Date(),
      mealType,
      studentsServed: Number(studentsServed) || 200,
      preparedKg: Number(preparedKg),
      wastedKg: Number(wastedKg),
      notes: notes || "",
    });

    res.status(201).json({
      success: true,
      message: "Food wastage log recorded",
      data: record,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function wastageSummary(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const records = await Wastage.find().sort({ date: -1 }).limit(30);

    const totals = await Wastage.aggregate([
      {
        $group: {
          _id: null,
          totalPrepared: { $sum: "$preparedKg" },
          totalWasted: { $sum: "$wastedKg" },
          totalServed: { $sum: "$studentsServed" },
        },
      },
    ]);

    const byMeal = await Wastage.aggregate([
      {
        $group: {
          _id: "$mealType",
          prepared: { $sum: "$preparedKg" },
          wasted: { $sum: "$wastedKg" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      message: "Food wastage summary fetched",
      data: {
        records,
        totals: totals[0] || { totalPrepared: 0, totalWasted: 0, totalServed: 0 },
        byMeal,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function generateAiWastageReport(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const wastageRecords = await Wastage.find().sort({ date: -1 }).limit(20).lean();
    const reviews = await MessReview.find().sort({ createdAt: -1 }).limit(30).lean();

    const report = await generateFoodWastageReport({
      wastageRecords: wastageRecords.map((r) => ({
        date: r.date,
        mealType: r.mealType,
        studentsServed: r.studentsServed,
        preparedKg: r.preparedKg,
        wastedKg: r.wastedKg,
        notes: r.notes,
      })),
      reviews: reviews.map((rev) => ({
        mealType: rev.mealType,
        foodQuality: rev.foodQuality || rev.rating,
        taste: rev.taste || rev.rating,
        hygiene: rev.hygiene || rev.rating,
        comment: rev.comment,
      })),
    });

    res.json({
      success: true,
      message: "AI Food Wastage & Menu Intelligence Report generated",
      data: report,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
