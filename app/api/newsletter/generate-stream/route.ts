import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import type { NextRequest } from "next/server";
import { getUserSettingsByUserId } from "@/actions/user-settings";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  buildArticleSummaries,
  buildNewsletterPrompt,
} from "@/lib/newsletter/prompt-builder";
import { prepareFeedsAndArticles } from "@/lib/rss/feed-refresh";
import { NewsletterSchema } from "@/lib/newsletter/types";

export const maxDuration = 300; // 5 minutes for Vercel Pro

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { feedIds, startDate, endDate, userInput } = body;

    if (!feedIds || !Array.isArray(feedIds) || feedIds.length === 0) {
      return Response.json(
        { error: "feedIds is required and must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return Response.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    const settings = await getUserSettingsByUserId(user.id);

    const articles = await prepareFeedsAndArticles({
      feedIds,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    const articleSummaries = buildArticleSummaries(articles);
    const prompt = buildNewsletterPrompt({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      articleSummaries,
      articleCount: articles.length,
      userInput,
      settings,
    });

    console.log("Prompt prepared:", prompt);

    // Run AI model streaming
    const streamResult = await streamObject({
      model: openai("gpt-4o"),
      schema: NewsletterSchema,
      prompt,
    });

    // ✅ Option 1: Return structured JSON (best for UI rendering)
    const finalObject = await streamResult.object; // resolves once generation completes

    console.log("Generated newsletter object:", finalObject);

    return Response.json({
      success: true,
      newsletter: finalObject, // structured JSON newsletter
    });

    // ✅ Option 2 (alternative): If you prefer streaming text directly
    // return streamResult.toTextStreamResponse();

  } catch (error) {
    console.error("Error in generate-stream:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      { error: `Failed to generate newsletter: ${errorMessage}` },
      { status: 500 }
    );
  }
}
