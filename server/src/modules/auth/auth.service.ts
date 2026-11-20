import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, type UserRole } from "./user.model.js";
import { AppError } from "../../utils/appError.js";

export async function registerUser(
  fullName: string,
  email: string,
  password: string,
  role: UserRole = "STUDENT",
  extra: { roomNumber?: string; block?: string; department?: string; phoneNumber?: string; avatarUrl?: string } = {},
) {
  const normalizedEmail = email.toLowerCase().trim();
  if (await User.findOne({ email: normalizedEmail })) {
    throw new AppError("Registration failed: Email already registered", 409, "EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    fullName,
    email: normalizedEmail,
    passwordHash,
    role,
    ...extra,
  });

  return tokenResponse(user);
}

export async function loginUser(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    throw new AppError("Login failed: Invalid email or password", 401, "INVALID_CREDENTIALS");

  return tokenResponse(user);
}

export async function getUserById(userId: string) {
  const user = await User.findById(userId).select("-passwordHash");
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  return user;
}

export async function changePassword(userId: string, oldPass: string, newPass: string) {
  if (!oldPass || !newPass) {
    throw new AppError("Current password and new password are required", 400, "VALIDATION_ERROR");
  }
  if (newPass.length < 6) {
    throw new AppError("New password must be at least 6 characters long", 400, "VALIDATION_ERROR");
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  const isMatch = await bcrypt.compare(oldPass, user.passwordHash);
  if (!isMatch) {
    throw new AppError("Incorrect current password", 400, "INVALID_CURRENT_PASSWORD");
  }

  user.passwordHash = await bcrypt.hash(newPass, 12);
  await user.save();

  return { message: "Password changed successfully" };
}

export async function updateProfile(
  userId: string,
  data: { fullName?: string; phoneNumber?: string; avatarUrl?: string; emergencyContact?: string; roomNumber?: string },
) {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  const isStudentOrRep = user.role === "STUDENT" || user.role === "STUDENT_COORDINATOR";

  // Students and Student Representatives cannot edit official Name or Room Allocation
  if (!isStudentOrRep) {
    if (data.fullName) user.fullName = data.fullName.trim();
    if (data.roomNumber !== undefined) user.roomNumber = data.roomNumber.trim();
  }

  // Allowed self-updates for all users (including students and reps)
  if (data.phoneNumber !== undefined) user.phoneNumber = data.phoneNumber.trim();
  if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;
  if (data.emergencyContact !== undefined) user.emergencyContact = data.emergencyContact.trim();

  await user.save();

  return tokenResponse(user);
}

function tokenResponse(user: any) {
  const accessToken = jwt.sign(
    { userId: user.id || user._id, role: user.role },
    process.env.JWT_SECRET ?? "development-secret",
    { expiresIn: "7d" },
  );

  return {
    accessToken,
    user: {
      id: user.id || user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl || "",
      roomNumber: user.roomNumber || "",
      block: user.block || "",
      department: user.department || "",
      phoneNumber: user.phoneNumber || "",
      emergencyContact: user.emergencyContact || "",
      status: user.status || "ACTIVE",
    },
  };
}
