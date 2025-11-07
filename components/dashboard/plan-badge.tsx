"use client";

import { Protect, useAuth } from "@clerk/nextjs";
import { Crown, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "../ui/spinner";

export function PlanBadge() {
  const { isLoaded } = useAuth();

  if (!isLoaded) return <Spinner />;
  return (
    <Link href="/dashboard/pricing">
      <Protect plan="starter">
        <Badge
          variant="secondary"
          className="gap-1.5 px-3 py-1.5 hover:bg-secondary/80 transition-all cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="font-semibold">Starter</span>
        </Badge>
      </Protect>

      <Protect plan="pro">
        <Badge className="gap-1.5 px-3 py-1.5 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 transition-all cursor-pointer">
          <Crown className="h-3.5 w-3.5" />
          <span className="font-semibold">Pro</span>
        </Badge>
      </Protect>
    </Link>
  );
}
