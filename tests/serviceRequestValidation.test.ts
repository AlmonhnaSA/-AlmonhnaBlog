import { describe, expect, test } from "bun:test";
import { SERVICE_NAMES, serviceRequestSchema, serviceRequestStatusSchema } from "../supabase/functions/_shared/serviceRequestValidation";

const valid = { submissionKey: "96a8b5d2-38a1-4e28-817b-6249f06b9527", name: "طلب اختبار", contact: "test@example.com", service: SERVICE_NAMES[0], details: "تفاصيل الطلب" };
describe("Service request rules", () => {
  test("accepts each of the three automatically selected services", () => {
    for (const service of ["صياغة المحتوى الاقتصادي", "إعداد المحتوى الاقتصادي", "التعليق الصوتي"]) expect(serviceRequestSchema.safeParse({ ...valid, service }).success).toBe(true);
    expect(serviceRequestSchema.safeParse({ ...valid, service: "خدمة غير موجودة" }).success).toBe(false);
  });
  test("requires name, contact and details", () => {
    for (const field of ["name", "contact", "details"]) expect(serviceRequestSchema.safeParse({ ...valid, [field]: " " }).success).toBe(false);
  });
  test("accepts email or telephone contact, rejects malformed contact", () => {
    expect(serviceRequestSchema.safeParse({ ...valid, contact: "+966 50 123 4567" }).success).toBe(true);
    expect(serviceRequestSchema.safeParse(valid).success).toBe(true);
    expect(serviceRequestSchema.safeParse({ ...valid, contact: "not an address" }).success).toBe(false);
  });
  test("cannot accept client-selected recipient or administrative status", () => {
    expect(serviceRequestSchema.safeParse({ ...valid, status: "completed" }).success).toBe(false);
    expect(serviceRequestSchema.safeParse({ ...valid, recipient: "attacker@example.com" }).success).toBe(false);
  });
  test("limits details and rejects populated honeypot", () => {
    expect(serviceRequestSchema.safeParse({ ...valid, details: "a".repeat(4001) }).success).toBe(false);
    expect(serviceRequestSchema.safeParse({ ...valid, website: "spam" }).success).toBe(false);
  });
  test("status changes accept only known service request states", () => {
    for (const status of ["new", "in_progress", "completed", "rejected"]) expect(serviceRequestStatusSchema.safeParse(status).success).toBe(true);
    expect(serviceRequestStatusSchema.safeParse("admin").success).toBe(false);
  });
});