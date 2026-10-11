import { z } from "zod";

export const SERVICE_NAMES = [
  "صياغة المحتوى الاقتصادي",
  "إعداد المحتوى الاقتصادي",
  "التعليق الصوتي",
] as const;

export const serviceRequestSchema = z.object({
  submissionKey: z.uuid(),
  name: z.string().trim().min(1, "أدخل الاسم").max(100),
  contact: z.string().trim().min(5, "أدخل بريدًا إلكترونيًا أو رقم هاتف صحيحًا").max(255)
    .refine((value) => z.email().safeParse(value).success || /^\+?[\d\s()\-]{7,30}$/.test(value), "أدخل بريدًا إلكترونيًا أو رقم هاتف صحيحًا"),
  service: z.enum(SERVICE_NAMES),
  details: z.string().trim().min(1, "أدخل تفاصيل الطلب").max(4000),
  website: z.string().max(0).optional(),
}).strict();

export const serviceRequestStatusSchema = z.enum(["new", "in_progress", "completed", "rejected"]);