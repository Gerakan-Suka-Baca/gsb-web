/**
 * Generic payment types shared across all modules (Tryout, Donasi, LMS, etc.)
 */

export type PaymentMethod = "none" | "free" | "qris" | "voucher";
export type PaymentStatus = "pending" | "verified" | "rejected";
export type PaymentPlan = "none" | "free" | "paid";
