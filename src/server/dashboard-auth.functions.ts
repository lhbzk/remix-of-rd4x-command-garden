import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { getDashboardSession } from "@/server/dashboard-auth";

export const requireDashboardAccess = createServerFn({
  method: "GET",
}).handler(async () => {
  const discordSession = await getDashboardSession();

  if (!discordSession) {
    throw redirect({
      to: "/login",
    });
  }

  return {
    discordId: discordSession.discordId,
  };
});
