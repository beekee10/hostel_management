import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import { User } from "../auth/user.model.js";
import bcrypt from "bcryptjs";
import { AppError } from "../../utils/appError.js";

export async function listStudents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { block, search, status } = req.query;
    const query: any = { role: { $in: ["STUDENT", "STUDENT_COORDINATOR"] } };

    if (block) query.block = block;
    if (status) query.status = status;
    if (search) {
      const searchRegex = new RegExp(String(search), "i");
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { roomNumber: searchRegex },
        { department: searchRegex },
      ];
    }

    const students = await User.find(query).select("-passwordHash").sort({ block: 1, roomNumber: 1 });

    res.json({
      success: true,
      message: "Students fetched successfully",
      data: students,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function createStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { fullName, email, password, roomNumber, block, department, phoneNumber, emergencyContact, role } = req.body;

    if (!fullName || !email) {
      throw new AppError("Full name and email are required", 400, "VALIDATION_ERROR");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new AppError("A student or user with this email already exists", 409, "EMAIL_EXISTS");
    }

    const defaultPassword = password || "Student@123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const targetRole = role === "STUDENT_COORDINATOR" ? "STUDENT_COORDINATOR" : "STUDENT";

    const student = await User.create({
      fullName,
      email: normalizedEmail,
      passwordHash,
      role: targetRole,
      roomNumber: roomNumber || "Room 101",
      block: block || "Block A",
      department: department || "Computer Science",
      phoneNumber: phoneNumber || "",
      emergencyContact: emergencyContact || "",
      status: "ACTIVE",
    });

    const sanitized = student.toObject();
    delete (sanitized as any).passwordHash;

    res.status(201).json({
      success: true,
      message: "Student added successfully",
      data: sanitized,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { fullName, roomNumber, block, department, phoneNumber, emergencyContact, status, role } = req.body;

    const student = await User.findById(id);
    if (!student) {
      throw new AppError("Student not found", 404, "NOT_FOUND");
    }

    if (fullName) student.fullName = fullName;
    if (roomNumber !== undefined) student.roomNumber = roomNumber;
    if (block !== undefined) student.block = block;
    if (department !== undefined) student.department = department;
    if (phoneNumber !== undefined) student.phoneNumber = phoneNumber;
    if (emergencyContact !== undefined) student.emergencyContact = emergencyContact;
    if (status !== undefined) student.status = status;

    // Role promotions can only be done by Warden or Admin
    if (role && (req.user?.role === "WARDEN" || req.user?.role === "ADMIN")) {
      student.role = role;
    }

    await student.save();

    const sanitized = student.toObject();
    delete (sanitized as any).passwordHash;

    res.json({
      success: true,
      message: "Student updated successfully",
      data: sanitized,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function adminResetStudentPassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (req.user?.role !== "ADMIN" && req.user?.role !== "WARDEN") {
      throw new AppError(
        "Permission Denied: Only Administrators and Wardens can change student passwords in the directory.",
        403,
        "FORBIDDEN",
      );
    }

    if (!newPassword || newPassword.length < 6) {
      throw new AppError("New password must be at least 6 characters long", 400, "VALIDATION_ERROR");
    }

    const student = await User.findById(id);
    if (!student) {
      throw new AppError("Student not found", 404, "NOT_FOUND");
    }

    student.passwordHash = await bcrypt.hash(newPassword, 12);
    await student.save();

    res.json({
      success: true,
      message: `Password successfully updated for ${student.fullName} (${student.email})`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    // Supervisors are explicitly restricted from deleting students
    if (req.user?.role === "SUPERVISOR") {
      throw new AppError(
        "Permission Denied: Hostel Supervisors cannot delete student records. Only the Warden or Admin has deletion authorization.",
        403,
        "FORBIDDEN_SUPERVISOR_DELETE",
      );
    }

    if (req.user?.role !== "WARDEN" && req.user?.role !== "ADMIN") {
      throw new AppError("Only the Warden or Admin can delete student records", 403, "FORBIDDEN");
    }

    const student = await User.findByIdAndDelete(id);
    if (!student) {
      throw new AppError("Student record not found", 404, "NOT_FOUND");
    }

    res.json({
      success: true,
      message: "Student record deleted successfully",
      data: { id },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
