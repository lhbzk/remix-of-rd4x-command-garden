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
