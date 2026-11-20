import type { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");

    return res.status(statusCode).json({
        success: false,
        errorCode,
        message: err.message || "An unexpected error occured",
        data: err.data || null,
        timestamp: new Date().toISOString(),
    });
};