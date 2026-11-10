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
  // Which move fits which situation, so a writer picks one or two instead of stacking them all.
  choose: z.array(z.object({ when: z.string().min(1), use: z.string().min(1) }).strict()).min(3).max(6),
  // Named techniques, each with one line of example copy. They are what sets one framework apart from the next.
  moves: z.array(z.object({ name: z.string().min(1), how: z.string().min(1), example: z.string().min(1) }).strict()).min(4).max(8),
  // A whole piece of copy written with the framework, so a reader sees more than a single improved sentence.
  worked: z.object({
    context: z.string().min(1),
    before: z.string().min(1).optional(),
    text: z.string().min(120),
    notes: z.array(z.string().min(1)).min(2).max(4),
  }).strict(),
  mistakes: z.array(z.string().min(1)).min(2).max(4),
  sources: z.array(source).min(1),
  language: z.enum(["sv", "en"]),
  provenance: z.literal("original-application"),
}).strict();

export type Framework = z.infer<typeof frameworkSchema>;
export const personSchema = z.string().regex(/^[a-z0-9-]{1,80}$/);
export type Person = z.infer<typeof personSchema>;
export const profileSchema = z.object({
  id: personSchema,
  name: z.string().min(1),
  category: z.enum(['Publik','Erbjudande','Distribution','Produkt','Fördjupning','Budskap','Ledarskap','Kundinsikt']),
  summary: z.string().min(1),
  topics: z.array(z.string().min(1)).min(3),
  principles: z.array(z.string().min(1)).min(2),
  questions: z.array(z.string().min(1)).min(2),
  sources: z.array(z.object({title:z.string().min(1),url:z.url().refine(url=>new URL(url).protocol==='https:')})).min(1),
  provenance: z.object({catalog:z.url(),profile:z.url(),importedAt:z.iso.date(),sourceStatus:z.literal('inherited-unverified'),application:z.literal('original-swedish')}),
}).strict();
export type Profile = z.infer<typeof profileSchema>;
export const searchInput = z.object({
  query: z.string().trim().min(2).max(500),
  limit: z.number().int().min(1).max(10).default(4),
}).strict();
