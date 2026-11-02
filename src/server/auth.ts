import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import {
  clearKeySession,
  getDiscordSession,
  getKeySession,
} from "@/server/auth";

export async function getDashboardSession() {
  const discordSession = await getDiscordSession();

  if (!discordSession) {
    return null;
  }

  const keySession = await getKeySession();

  if (!keySession) {
    return null;
  }

  if (keySession.discordId !== discordSession.discordId) {
    clearKeySession();
    return null;
  }

  return discordSession;
}

export const requireDashboardAccess = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getDashboardSession();

  if (!session) {
    const discordSession = await getDiscordSession();

    if (!discordSession) {
      throw redirect({
        to: "/login",
      });
    }

    throw redirect({
      to: "/key",
    });
  }

  return {
    discordId: session.discordId,
  };
});
