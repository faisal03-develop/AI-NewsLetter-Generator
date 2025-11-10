import type { UserSettings } from "@prisma/client";

import z from "zod";
// ============================================
// NEWSLETTER-SPECIFIC TYPE DEFINITIONS
// ============================================

/**
 * Article type for prompt building
 */
export interface ArticleForPrompt {
  title: string;
  feed: { title: string | null };
  pubDate: Date;
  summary?: string | null;
  content?: string | null;
  link: string;
}

export const NewsletterSchema = z.object({
  suggestedTitles: z.array(z.string()).length(5),
  suggestedSubjectLines: z.array(z.string()).length(5),
  body: z.string(),
  topAnnouncements: z.array(z.string()).length(5),
  additionalInfo: z.string().optional(),
});

export type GeneratedNewsletter = z.infer<typeof NewsletterSchema>;
/**
 * Parameters for building newsletter prompt
 */
export interface NewsletterPromptParams {
  startDate: Date;
  endDate: Date;
  articleSummaries: string;
  articleCount: number;
  userInput?: string;
  settings?: UserSettings | null;
}
