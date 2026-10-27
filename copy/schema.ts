import { z } from "zod";

const source = z.object({
  title: z.string().min(1),
  url: z.url().refine((url) => new URL(url).protocol === "https:", "Sources must use HTTPS"),
  language: z.enum(["sv", "en"]),
  kind: z.enum(["author", "publisher", "institution"]),
  checked: z.iso.date(),
});

export const frameworkSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  author: z.string().min(1),
  category: z.enum(["Erbjudande", "Kundinsikt", "Budskap", "Svenska", "Utvärdering"]),
  summary: z.string().min(1),
  useWhen: z.string().min(1),
  avoidWhen: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(3),
  principles: z.array(z.string().min(1)).min(1),
  questions: z.array(z.string().min(1)).min(1),
  example: z.object({
    context: z.string().min(1),
    before: z.string().min(1),
    after: z.string().min(1),
    explanation: z.string().min(1),
  }),
  sources: z.array(source).min(1),
  language: z.literal("sv"),
  provenance: z.literal("original-application"),
}).strict();

export type Framework = z.infer<typeof frameworkSchema>;
export const personSchema = z.enum(["alex-hormozi", "corey-haines"]);
export type Person = z.infer<typeof personSchema>;
export const searchInput = z.object({
  query: z.string().trim().min(2).max(500),
  limit: z.number().int().min(1).max(10).default(4),
}).strict();
