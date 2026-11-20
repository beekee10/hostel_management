import type { NextFunction, Request, Response } from "express";
import { loginUser, registerUser, getUserById, changePassword, updateProfile } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.validation.js";
import { z } from "zod";
import { AppError } from "../../utils/appError.js";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      const validationError = new AppError("Validation failed", 400, "VALIDATION_ERROR");
      (validationError as any).data = z.flattenError(result.error);
      return next(validationError);
    }

    const { fullName, email, password } = result.data;
    const data = await registerUser(fullName, email, password, req.body.role, {
      roomNumber: req.body.roomNumber,
      block: req.body.block,
      department: req.body.department,
      phoneNumber: req.body.phoneNumber,
      avatarUrl: req.body.avatarUrl,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      const validationError = new AppError("Validation failed", 400, "VALIDATION_ERROR");
      (validationError as any).data = z.flattenError(result.error);
      return next(validationError);
    }

    const { email, password } = result.data;
    const data = await loginUser(email, password);

    res.json({
      success: true,
      message: "Login successful",
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await getUserById(req.user!.userId);
    res.json({
      success: true,
      message: "User profile fetched",
      data: user,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function handleChangePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await changePassword(req.user!.userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await updateProfile(req.user!.userId, req.body);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
