import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type React from "react";
import { DashboardHeader } from "../../components/dashboard/dashboard-header";

async function layout({ children }: { children: React.ReactNode }) {
  const { has } = await auth();
  const hasPidPlan =
    (await has({ plan: "pro" })) || (await has({ plan: "starter" }));
  if (!hasPidPlan) {
    redirect("/#pricing");
  }
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />
      {children}
    </div>
  );
}

export default layout;
