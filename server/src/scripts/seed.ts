import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../modules/auth/user.model.js";
import { Notice } from "../modules/notices/notice.model.js";
import { Complaint } from "../modules/complaints/complaint.model.js";
import { HotTopic, TopicComment } from "../modules/community/hot-topic.model.js";
import { LendItem } from "../modules/community/lend-item.model.js";
import { MessMenu } from "../modules/mess/mess-menu.model.js";
import { MessReview } from "../modules/mess/mess-review.model.js";
import { FoodWastage } from "../modules/mess/food-wastage.model.js";
import { Conversation } from "../modules/conversations/conversation.model.js";
import { Message } from "../modules/messages/message.model.js";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/smart-hostel";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for comprehensive seeding...");

    const passwordHash = await bcrypt.hash("Pass@123", 10);

    // 1. Seed Users for All Roles
    const usersData = [
      {
        fullName: "Alex Johnson (Student)",
        email: "student@campus.in",
        passwordHash,
        role: "STUDENT",
        roomNumber: "Room 304",
        block: "Block B",
        department: "Computer Science",
        phoneNumber: "+91 98765 43210",
      },
      {
        fullName: "Rohan Verma (Student Rep)",
        email: "representative@campus.in",
        passwordHash,
        role: "STUDENT_COORDINATOR",
        roomNumber: "Room 201",
        block: "Block A",
        department: "Electronics & Comm",
        phoneNumber: "+91 98765 43211",
      },
      {
        fullName: "Mr. Rajesh Sharma (Supervisor)",
        email: "supervisor@campus.in",
        passwordHash,
        role: "SUPERVISOR",
        roomNumber: "Supervisor Office",
        block: "Admin Block",
        department: "Hostel Facilities",
        phoneNumber: "+91 98765 43212",
      },
      {
        fullName: "Dr. Alok Nath (Chief Warden)",
        email: "warden@campus.in",
        passwordHash,
        role: "WARDEN",
        roomNumber: "Warden Office",
        block: "Admin Block",
        department: "Campus Administration",
        phoneNumber: "+91 98765 43213",
      },
      {
        fullName: "Chef Suresh Kumar (Mess Incharge)",
        email: "messincharge@campus.in",
        passwordHash,
        role: "MESS_COORDINATOR",
        roomNumber: "Mess Office",
        block: "Dining Hall",
        department: "Catering & Mess Operations",
        phoneNumber: "+91 98765 43214",
      },
      {
        fullName: "Campus Administrator",
        email: "admin@campus.in",
        passwordHash,
        role: "ADMIN",
        roomNumber: "IT Control Center",
        block: "Admin Block",
        department: "IT Services",
        phoneNumber: "+91 98765 43215",
      },
      {
        fullName: "Priya Sharma (Student)",
        email: "priya@campus.in",
        passwordHash,
        role: "STUDENT",
        roomNumber: "Room 108",
        block: "Block A",
        department: "Mechanical Engg",
        phoneNumber: "+91 98765 43216",
      },
      {
        fullName: "Vikram Malhotra (Student)",
        email: "vikram@campus.in",
        passwordHash,
        role: "STUDENT",
        roomNumber: "Room 306",
        block: "Block B",
        department: "Information Tech",
        phoneNumber: "+91 98765 43217",
      },
    ];

    for (const u of usersData) {
      await User.findOneAndUpdate({ email: u.email }, u, { upsert: true, new: true });
    }
    console.log("Seeded demo users for all 6 roles.");

    const studentUser = await User.findOne({ email: "student@campus.in" });
    const repUser = await User.findOne({ email: "representative@campus.in" });
    const supervisorUser = await User.findOne({ email: "supervisor@campus.in" });
    const wardenUser = await User.findOne({ email: "warden@campus.in" });
    const messUser = await User.findOne({ email: "messincharge@campus.in" });
    const priyaUser = await User.findOne({ email: "priya@campus.in" });

    // 2. Seed Notices (Electricity Cut, Water Interruptions, Events)
    await Notice.deleteMany({});
    const now = new Date();
    const futurePowerStart = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const futurePowerEnd = new Date(now.getTime() + 7 * 60 * 60 * 1000);

    await Notice.insertMany([
      {
        title: "⚡ Scheduled Electricity Maintenance & Power Cut",
        body: "Hostel substation transformer servicing will take place today. Backup generators will supply power to common corridors and study halls only. Please charge laptops and phones in advance.",
        type: "ELECTRICITY",
        block: "Block B & Block C",
        scheduledStart: futurePowerStart,
        scheduledEnd: futurePowerEnd,
        affectedAreas: "Blocks B & C Wings 1-4",
        isPinned: true,
        isEmergency: false,
        createdBy: supervisorUser?._id,
      },
      {
        title: "💧 Water Supply Tank Cleaning & Low Pressure Window",
        body: "Overhead water tank chlorination and filtration cleaning scheduled tomorrow between 8:00 AM and 11:30 AM. Ground storage will remain operational.",
        type: "WATER",
        block: "All Blocks",
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 28 * 60 * 60 * 1000),
        affectedAreas: "Entire Hostel Complex",
        isPinned: true,
        createdBy: supervisorUser?._id,
      },
      {
        title: "🎉 Inter-Hostel Badminton & Table Tennis Tournament",
        body: "Annual intra-campus sports tournament registrations are open. Register your doubles team with the Student Representative before Friday.",
        type: "EVENT",
        block: "All Blocks",
        isPinned: false,
        createdBy: repUser?._id,
      },
      {
        title: "🛡️ Main Gate Curfew & Night Entry Policy Reminder",
        body: "All residents must swipe their biometric ID cards when entering post 10:30 PM. Late passes must be pre-approved via the warden desk.",
        type: "GENERAL",
        block: "All Blocks",
        isPinned: false,
        createdBy: wardenUser?._id,
      },
    ]);
    console.log("Seeded notices with scheduled power/water cuts.");

    // 3. Seed Complaints (clustered in Block B for AI detection)
    await Complaint.deleteMany({});
    await Complaint.insertMany([
      {
        studentId: studentUser?._id,
        title: "3rd Floor Water Outage - Low Pressure in Block B",
        description: "There has been zero water pressure in bathroom 302 to 306 since early morning. We cannot get ready for morning lectures.",
        category: "WATER",
        severity: "HIGH",
        urgencyScore: 88,
        priorityScore: 85,
        status: "IN_PROGRESS",
        block: "Block B",
        roomNumber: "Room 304",
        aiProcessed: true,
        aiReason: "High urgency due to basic hygiene outage affecting multiple rooms on 3rd floor.",
        forwardedTo: "Plumbing Contractor",
        coordinatorNotes: "Water pump switch tripper in Block B shaft requires inspection.",
        forwardedBy: repUser?._id,
      },
      {
        studentId: priyaUser?._id,
        title: "No water in Block B 3rd Floor washroom again",
        description: "Repeating complaint: tap water completely stopped in room 306 washroom.",
        category: "WATER",
        severity: "HIGH",
        urgencyScore: 85,
        priorityScore: 82,
        status: "OPEN",
        block: "Block B",
        roomNumber: "Room 306",
        aiProcessed: true,
        aiReason: "Clustered with earlier 3rd floor water failure ticket.",
      },
      {
        studentId: studentUser?._id,
        title: "High voltage sparking in corridor switchboard",
        description: "Corridor switchboard near room 308 produces burning smell and loud sparks when geyser is switched on.",
        category: "ELECTRICITY",
        severity: "CRITICAL",
        urgencyScore: 98,
        priorityScore: 95,
        status: "OPEN",
        block: "Block B",
        roomNumber: "Corridor 3rd Floor",
        aiProcessed: true,
        aiReason: "CRITICAL hazard: electrical fire hazard reported in corridor.",
      },
      {
        studentId: priyaUser?._id,
        title: "WiFi Access Point disconnected in Block A 1st Floor",
        description: "The ceiling router light is blinking red and no device can connect to Campus_Secure_5G.",
        category: "INTERNET",
        severity: "MEDIUM",
        urgencyScore: 60,
        priorityScore: 58,
        status: "OPEN",
        block: "Block A",
        roomNumber: "Room 108",
        aiProcessed: true,
        aiReason: "Standard connectivity disruption affecting student study hours.",
      },
    ]);
    console.log("Seeded complaints with AI tags.");

    // 4. Seed Reddit-style Hot Topics (Bento Grid)
    await HotTopic.deleteMany({});
    await TopicComment.deleteMany({});

    const topic1 = await HotTopic.create({
      title: "Should we request 24/7 Library & Common Study Room access during midterms?",
      content: "Currently the study hall closes sharply at 11:30 PM. During exam weeks, students have to study in cramped rooms with sleeping roommates. If we can get 50+ upvotes, the Student Representative can present this to the Warden.",
      authorId: studentUser?._id,
      tags: ["ExamPrep", "Library", "StudyRooms"],
      upvotes: [studentUser?._id, repUser?._id, priyaUser?._id],
      commentCount: 4,
      heatScore: 88,
      cardSize: "xl",
      sentiment: "POSITIVE",
      aiSummary: "Students strongly support 24/7 study hall access during exam weeks with high community traction.",
      isPinned: true,
    });

    const topic2 = await HotTopic.create({
      title: "Mess Dinner Menu: Request to replace Tinda/Gourd with Paneer Bhurji on Thursdays",
      content: "Thursday dinner wastage is consistently the highest of the week. Most plates are left half eaten. Replacing it with Paneer Bhurji or Matar Mushroom would drastically cut food wastage!",
      authorId: priyaUser?._id,
      tags: ["MessMenu", "FoodQuality", "Wastage"],
      upvotes: [priyaUser?._id, studentUser?._id],
      commentCount: 2,
      heatScore: 65,
      cardSize: "lg",
      sentiment: "CONCERN",
      aiSummary: "Proposal to eliminate Thursday gourd dish to improve meal satisfaction and reduce kitchen waste.",
    });

    const topic3 = await HotTopic.create({
      title: "Hostel WiFi Bandwidth speeds during 9 PM - 11 PM",
      content: "Is anyone else experiencing severe packet loss and speed drops in Block B during peak evening hours?",
      authorId: studentUser?._id,
      tags: ["WiFi", "Network", "BlockB"],
      upvotes: [studentUser?._id],
      commentCount: 1,
      heatScore: 40,
      cardSize: "md",
      sentiment: "CONCERN",
      aiSummary: "Students discussing bandwidth congestion during peak evening gaming and study hours.",
    });

    await TopicComment.insertMany([
      {
        topicId: topic1._id,
        authorId: repUser?._id,
        content: "I will raise this in tomorrow's council meeting with Dr. Alok Nath (Warden) if we maintain good noise discipline!",
      },
      {
        topicId: topic1._id,
        authorId: priyaUser?._id,
        content: "Totally agree! Also need more power sockets near the corner desks.",
      },
      {
        topicId: topic2._id,
        authorId: messUser?._id,
        content: "Noted by Mess Office. We will review our procurement cost and discuss substituting it in the next menu revision.",
      },
    ]);
    console.log("Seeded Reddit-style Hot Topics.");

    // 5. Seed Lend & Borrow Marketplace
    await LendItem.deleteMany({});
    await LendItem.insertMany([
      {
        ownerId: studentUser?._id,
        title: "Hercules Mountain Bike (Gear 21)",
        description: "Available for weekend grocery runs or library trips. Lock combination provided on chat.",
        category: "CYCLE",
        status: "AVAILABLE",
        locationHint: "Cycle Stand #14, Block B",
      },
      {
        ownerId: priyaUser?._id,
        title: "Casio Scientific Calculator FX-991EX",
        description: "Perfect for Engineering Maths & Circuit theory exam.",
        category: "ELECTRONICS",
        status: "AVAILABLE",
        locationHint: "Room 108, Block A",
      },
      {
        ownerId: repUser?._id,
        title: "Electric Kettle (1.5L Pigeon)",
        description: "Great for late night instant noodles and hot water.",
        category: "OTHER",
        status: "AVAILABLE",
        locationHint: "Room 201, Block A",
      },
    ]);

    // 6. Seed Mess Menu
    await MessMenu.deleteMany({});
    await MessMenu.insertMany([
      { day: "MONDAY", breakfast: "Idli, Sambar, Coconut Chutney, Tea/Coffee", lunch: "Rajma, Steamed Rice, Mix Veg, Curd, Roti", snacks: "Samosa, Mint Chutney, Chai", dinner: "Dal Tadka, Shahi Paneer, Jeera Rice, Chapati, Gulab Jamun", special: "Gulab Jamun dessert", updatedBy: messUser?._id },
      { day: "TUESDAY", breakfast: "Poha, Boiled Egg/Sprouts, Banana, Milk/Tea", lunch: "Chole, Bhature/Puri, Rice, Green Salad, Boondi Raita", snacks: "Veg Cutlet, Tomato Sauce, Tea", dinner: "Egg Curry / Paneer Bhurji, Dal Makhani, Rice, Roti, Kheer", special: "Special Kheer", updatedBy: messUser?._id },
      { day: "WEDNESDAY", breakfast: "Aloo Paratha, Curd, Pickle, Tea/Coffee", lunch: "Kadhi Pakora, Rice, Aloo Gobi, Roti, Papad", snacks: "Pani Puri / Bhel, Tea", dinner: "Chicken Curry / Kadai Paneer, Dal Fry, Jeera Rice, Naan/Roti", special: "Chicken / Kadai Paneer Special", updatedBy: messUser?._id },
      { day: "THURSDAY", breakfast: "Uttapam, Coconut & Tomato Chutney, Tea", lunch: "Dal Palak, Aloo Shimla Mirch, Rice, Roti, Chaas", snacks: "Bread Pakora, Green Chutney, Chai", dinner: "Veg Biryani / Chicken Biryani, Mirchi Ka Salan, Raita, Ice Cream", special: "Dum Biryani Feast", updatedBy: messUser?._id },
      { day: "FRIDAY", breakfast: "Poori Bhaji, Halwa, Tea/Coffee", lunch: "Sambhar, Rasam, Rice, Poriyal, Curd, Appalam", snacks: "Maggi / Pasta, Tea", dinner: "Malai Kofta, Yellow Dal, Pulao, Butter Roti, Fruit Custard", special: "Fruit Custard", updatedBy: messUser?._id },
      { day: "SATURDAY", breakfast: "Masala Dosa, Sambar, Chutney, Milk/Tea", lunch: "Pav Bhaji, Pulao, Green Salad, Buttermilk", snacks: "Biscuits & Tea / Coffee", dinner: "Dal Tadka, Mix Veg Handi, Rice, Chapati, Sweet Boondi", special: "Pav Bhaji Lunch", updatedBy: messUser?._id },
      { day: "SUNDAY", breakfast: "Chole Kulche / Veg Sandwich, Juice, Coffee", lunch: "Special Sunday Thali: Paneer Butter Masala, Pulao, Poori, Raita", snacks: "French Fries, Tea", dinner: "Dal Makhani, Matar Paneer, Jeera Rice, Tandoori Roti, Rasgulla", special: "Sunday Grand Feast", updatedBy: messUser?._id },
    ]);

    // 7. Seed Mess Wastage Records
    await FoodWastage.deleteMany({});
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const dayBefore = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    await FoodWastage.insertMany([
      {
        hostelId: messUser?._id,
        date: yesterday,
        mealType: "DINNER",
        studentsServed: 240,
        preparedKg: 120,
        wastedKg: 14,
        notes: "High turnout for Shahi Paneer; low plate wastage.",
      },
      {
        hostelId: messUser?._id,
        date: yesterday,
        mealType: "LUNCH",
        studentsServed: 210,
        preparedKg: 105,
        wastedKg: 22,
        notes: "Excess rice and dal left over from 2nd batch.",
      },
      {
        hostelId: messUser?._id,
        date: dayBefore,
        mealType: "DINNER",
        studentsServed: 190,
        preparedKg: 110,
        wastedKg: 28,
        notes: "Thursday Tinda curry had high table wastage.",
      },
      {
        hostelId: messUser?._id,
        date: dayBefore,
        mealType: "BREAKFAST",
        studentsServed: 180,
        preparedKg: 65,
        wastedKg: 7,
        notes: "Poha and boiled eggs finished smoothly.",
      },
    ]);

    // 8. Seed Mess Reviews
    await MessReview.deleteMany({});
    await MessReview.insertMany([
      {
        studentId: studentUser?._id,
        mealType: "DINNER",
        rating: 4,
        foodQuality: 4,
        hygiene: 5,
        taste: 4,
        comment: "Paneer butter masala and hot rotis were excellent today!",
      },
      {
        studentId: priyaUser?._id,
        mealType: "LUNCH",
        rating: 3,
        foodQuality: 3,
        hygiene: 4,
        taste: 3,
        comment: "Rice was slightly overcooked and curd was sour.",
      },
    ]);

    // 9. Seed Chat Channels and Messages
    await Conversation.deleteMany({});
    await Message.deleteMany({});

    const chanGeneral = await Conversation.create({
      type: "CHANNEL",
      name: "general-lounge",
      topic: "General hostel announcements, questions, and casual student chat",
      isDefault: true,
      lastMessage: {
        text: "Don't forget the badminton matches scheduled for this evening!",
        senderName: repUser?.fullName || "Student Rep",
        sentAt: now,
      },
    });

    const chanAlerts = await Conversation.create({
      type: "CHANNEL",
      name: "power-water-alerts",
      topic: "Real-time updates regarding electricity, maintenance, and water supplies",
      isDefault: true,
      lastMessage: {
        text: "Block B substation maintenance begins at 4:00 PM today.",
        senderName: supervisorUser?.fullName || "Supervisor",
        sentAt: now,
      },
    });

    const chanMess = await Conversation.create({
      type: "CHANNEL",
      name: "mess-feedback",
      topic: "Daily menu discussions, food suggestions, and special meal queries",
      isDefault: true,
      lastMessage: {
        text: "Special Sunday Grand Feast menu has been published on the Mess tab.",
        senderName: messUser?.fullName || "Mess Incharge",
        sentAt: now,
      },
    });

    await Message.insertMany([
      {
        conversationId: chanGeneral._id,
        senderId: wardenUser?._id,
        text: "Welcome to CampusNest! Use this chat to coordinate and report issues quickly.",
        tag: "ANNOUNCEMENT",
      },
      {
        conversationId: chanGeneral._id,
        senderId: repUser?._id,
        text: "Don't forget the badminton matches scheduled for this evening!",
        tag: "GENERAL",
      },
      {
        conversationId: chanAlerts._id,
        senderId: supervisorUser?._id,
        text: "Block B substation maintenance begins at 4:00 PM today. Backup power enabled in common halls.",
        tag: "URGENT",
      },
      {
        conversationId: chanMess._id,
        senderId: messUser?._id,
        text: "Special Sunday Grand Feast menu has been published on the Mess tab. Please submit your feedback after lunch!",
        tag: "GENERAL",
      },
    ]);

    console.log("=========================================");
    console.log("SMART HOSTEL DATABASE SEEDED SUCCESSFULLY!");
    console.log("=========================================");
    console.log("Demo Accounts (Password: Pass@123):");
    console.log("1. Student:             student@campus.in");
    console.log("2. Student Rep:         representative@campus.in");
    console.log("3. Supervisor:          supervisor@campus.in");
    console.log("4. Warden:              warden@campus.in");
    console.log("5. Mess Incharge:       messincharge@campus.in");
    console.log("6. Admin:               admin@campus.in");
    console.log("=========================================");
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
