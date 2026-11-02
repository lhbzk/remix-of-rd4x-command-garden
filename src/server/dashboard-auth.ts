import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import {
  clearKeySession,
  getDiscordSession,
  getKeySession,
} from "@/server/auth";

export const requireDashboardAccess = createServerFn({
  method: "GET",
}).handler(async () => {
  const discordSession = await getDiscordSession();

  if (!discordSession) {
    throw redirect({
      to: "/login",
    });
  }

  const keySession = await getKeySession();

  if (!keySession) {
    throw redirect({
      to: "/key",
    });
  }

  /*
   * A autorização da Key fica vinculada à mesma
   * conta Discord que fez o OAuth.
   *
   * Isso impede reutilizar o cookie de Key
   * com outra sessão Discord.
   */
  if (
    keySession.discordId !==
    discordSession.discordId
  ) {
    clearKeySession();

    throw redirect({
      to: "/key",
    });
  }

  return {
    discordId: discordSession.discordId,
  };
});
