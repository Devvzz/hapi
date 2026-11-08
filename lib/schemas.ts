import { z } from "zod";

// The profile as the browser sends it to the AI routes.
export const profileSchema = z.object({
  nationality: z.string().max(60),
  age: z.number().nullable(),
  student: z.boolean(),
  schoolType: z.string().max(40),
  languages: z.array(z.object({ language: z.string().max(40), level: z.string().max(4) })).max(10),
  budgetPerYear: z.number().nullable(),
  austrianSchool: z.boolean().optional(),
  diploma: z.string().max(40).optional(),
  opportunityBudget: z.number().nullable().optional(),
  interests: z.array(z.string().max(40)).max(20),
});
