"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  saveGeneratedNewsletter,
} from "@/actions/generate-newsletter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GeneratedNewsletter } from "@/lib/newsletter/types";
import { NewsletterDisplay } from "./newsletter-display";
import { NewsletterLoadingCard } from "./newsletter-loading-card";

/**
 * Newsletter schema for client-side streaming
 * --- DEBUG CHANGE: Relaxed the schema by removing .length(5) to prevent validation errors ---
 */
const newsletterSchema = z.object({
  suggestedTitles: z.array(z.string()),
  suggestedSubjectLines: z.array(z.string()),
  body: z.string(),
  topAnnouncements: z.array(z.string()),
  additionalInfo: z.string().optional(),
});

type NewsletterObject = z.infer<typeof newsletterSchema>;

export function NewsletterGenerationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasStartedRef = React.useRef(false);
  const [articlesCount, setArticlesCount] = React.useState(0);

  const feedIds = searchParams.get("feedIds");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const userInput = searchParams.get("userInput");

  let params: {
    feedIds: string[];
    startDate: string;
    endDate: string;
    userInput?: string;
  } | null = null;

  if (feedIds && startDate && endDate) {
    try {
      params = {
        feedIds: JSON.parse(feedIds),
        startDate,
        endDate,
        userInput: userInput || undefined,
      };
    } catch {
      params = null;
    }
  }

  // --- DEBUG CHANGE: Added `error` to the hook variables ---
  const { object, submit, isLoading, error } = useObject({
    api: "/api/newsletter/generate-stream",
    schema: newsletterSchema,
  });
console.log(object,'object in newsletter')
  const newsletter = object as Partial<NewsletterObject> | undefined;

  // --- DEBUG CHANGE: Added useEffect to log state from the hook ---
  React.useEffect(() => {
    console.log("CLIENT STATE CHANGE:");
    console.log(`- isLoading: ${isLoading}`);
    console.log("- object:", newsletter);
    if (error) {
      console.error("- Hook Error:", error);
      toast.error(`An error occurred: ${error.message}`);
    }
  }, [isLoading, newsletter, error]);

  React.useEffect(() => {
    if (!params || hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;
    const startGeneration = async () => {
      // ... (rest of this useEffect is unchanged)
      try {
        const response = await fetch("/api/newsletter/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.feedsToRefresh > 0) toast.info(`Refreshing ${data.feedsToRefresh} feed${data.feedsToRefresh > 1 ? "s" : ""}...`);
          if (data.articlesFound > 0) {
            toast.info(`Analyzing ${data.articlesFound} article${data.articlesFound > 1 ? "s" : ""} from your feeds...`);
            setArticlesCount(data.articlesFound);
          }
        } else {
          const errorData = await response.json();
          toast.error(`Failed to prepare newsletter: ${errorData.error}`);
        }
        submit(params);
      } catch (e) {
        console.error("Failed to prepare newsletter:", e);
        toast.error("An unexpected error occurred during preparation.");
        submit(params);
      }
    };
    startGeneration();
  }, [params, submit]);

  React.useEffect(() => {
    if (!isLoading && newsletter?.body && articlesCount > 0) {
      toast.success(`Newsletter generated from ${articlesCount} articles!`);
    }
  }, [isLoading, newsletter?.body, articlesCount]);

  React.useEffect(() => {
    if (!isLoading) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault(); e.returnValue = ""; return "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isLoading]);

  const handleSave = async () => {
    if (!newsletter || !params) return;
    try {
      await saveGeneratedNewsletter({
        newsletter: newsletter as GeneratedNewsletter,
        feedIds: params.feedIds,
        startDate: new Date(params.startDate),
        endDate: new Date(params.endDate),
        userInput: params.userInput,
      });
      toast.success("Newsletter saved to history!");
    } catch (e) {
      console.error("Failed to save newsletter:", e);
      toast.error("Failed to save newsletter");
    }
  };

  const handleBackToDashboard = () => router.push("/dashboard");

  if (!params) {
    // ... (return invalid request card - unchanged)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto py-12 px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Invalid Generation Request</CardTitle>
              <CardDescription>Missing required parameters for newsletter generation.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleBackToDashboard}><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto py-12 px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToDashboard} disabled={isLoading}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
            <div className="h-4 w-px bg-border" />
            <div><h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Newsletter Generation</h1></div>
          </div>
          {isLoading && (<div className="flex items-center gap-2 text-base font-medium"><Sparkles className="h-4 w-4 text-blue-500 animate-pulse" /><span>Generating newsletter...</span></div>)}
        </div>

        {/* --- Using the known-good conditional rendering logic --- */}
        {isLoading && !newsletter?.body && <NewsletterLoadingCard />}
        {newsletter?.body && <NewsletterDisplay newsletter={newsletter} onSave={handleSave} isGenerating={isLoading} />}
        {!isLoading && !newsletter?.body && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Preparing to Generate</CardTitle>
              <CardDescription>Setting up newsletter generation...</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}