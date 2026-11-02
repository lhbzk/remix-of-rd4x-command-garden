import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { getDashboardSession } from "@/server/dashboard-auth";

export const requireDashboardAccess = createServerFn({
  method: "GET",
}).handler(async () => {
  const dashboardSession = await getDashboardSession();

  if (!dashboardSession) {
    throw redirect({
      to: "/login",
    });
  }

  return {
    discordId: dashboardSession.discordId,
    username: dashboardSession.username,
    globalName: dashboardSession.globalName,
    avatar: dashboardSession.avatar,
    role: dashboardSession.role,
    isOwner: dashboardSession.isOwner,
    isAdmin: dashboardSession.isAdmin,
  };
});
