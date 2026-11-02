// Public API surface. Pages only call these functions — swap the transport in ./client.ts
// to connect the real RD4X API without touching UI code.

import { request } from "./client";
import * as db from "@/lib/mock/data";

import type {
  AppNotification,
  AuditEvent,
  DiscordChannel,
  IncidentsPayload,
  KeyValidation,
  Overview,
  Range,
  Release,
  SearchResults,
  Settings,
  Statistics,
  Ticket,
  Transcript,
  User,
} from "./types";

export const getOverview = () => request<Overview>("/v10/overview", db.overview);

export const getUsers = () => request<User[]>("/v10/users", () => db.users);

export const getTickets = () => request<Ticket[]>("/v10/tickets", () => db.tickets);

export const getReleases = () => request<Release[]>("/v10/releases", () => db.releases);

export const getIncidents = () =>
  request<IncidentsPayload>("/v10/incidents", db.incidentsPayload);

export const getStatistics = (range: Range) =>
  request<Statistics>(`/v10/statistics?range=${range}`, () => db.statistics(range));

export const getAudit = () =>
  request<AuditEvent[]>("/v10/audit", () => db.auditEvents);

export const getTranscripts = () =>
  request<Transcript[]>("/v10/transcripts", () => db.transcripts);

export const getSettings = () =>
  request<Settings>("/v10/settings", () => db.settings);

export const getNotifications = () =>
  request<AppNotification[]>(
    "/v10/notifications",
    () => db.notifications,
    { latency: 200 },
  );

/**
 * Discord channels available to the dashboard bot.
 *
 * The real implementation will be provided by the RD4X Worker/Bot.
 * Keeping this behind the API layer means the UI does not need to know
 * how Discord authentication or bot communication works.
 */
export const getDiscordChannels = () =>
  request<DiscordChannel[]>("/v10/discord/channels", () => []);

export function searchMock(query: string): SearchResults {
  const q = query.trim().toLowerCase();

  const has = (...values: (string | undefined | null)[]) =>
    values.some((v) => v?.toLowerCase().includes(q));

  if (!q) {
    return {
      query,
      users: [],
      tickets: [],
      keys: [],
      releases: [],
      audit: [],
    };
  }

  return {
    query,
    users: db.users
      .filter((u) => has(u.username, u.discordId, u.email, u.role))
      .slice(0, 8),

    tickets: db.tickets
      .filter((t) => has(t.id, t.subject, t.user.username, t.category))
      .slice(0, 8),

    keys: db.keys
      .filter((k) => has(k.key, k.owner, k.plan, k.status))
      .slice(0, 8),

    releases: db.releases
      .filter((r) => has(r.version, r.title, r.channel))
      .slice(0, 8),

    audit: db.auditEvents
      .filter((a) => has(a.action, a.target, a.user))
      .slice(0, 8),
  };
}

export const search = (query: string) =>
  request<SearchResults>(
    `/v10/search?q=${encodeURIComponent(query)}`,
    () => searchMock(query),
  );

export const validateKey = (key: string) =>
  request<KeyValidation>(
    "/v10/keys/validate",
    () => {
      const k = key.toUpperCase();

      if (k === db.DEMO_KEYS.expired) {
        return {
          status: "expired",
          expiredAt: new Date(Date.now() - 12 * 86_400_000).toISOString(),
        };
      }

      const found = k === db.DEMO_KEYS.valid
        ? null
        : db.keys.find((x) => x.key === k);

      if (k === db.DEMO_KEYS.valid || found?.status === "active") {
        return {
          status: "success",
          key: found ?? {
            key: k,
            owner: db.currentAdmin.username,
            status: "active",
            plan: "Lifetime",
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3650 * 86_400_000).toISOString(),
          },
        };
      }

      if (found?.status === "expired") {
        return {
          status: "expired",
          expiredAt: found.expiresAt,
        };
      }

      return { status: "invalid" };
    },
    {
      method: "POST",
      body: JSON.stringify({ key }),
      latency: 1100,
    },
  );

export const createRelease = (
  input: Omit<Release, "id" | "date" | "downloads">,
) =>
  request<Release>(
    "/v10/releases",
    () => ({
      ...input,
      id: `rel_${Date.now()}`,
      date: new Date().toISOString(),
      downloads: 0,
    }),
    {
      method: "POST",
      body: JSON.stringify(input),
      latency: 700,
    },
  );

export const saveSettings = (input: Settings) =>
  request<Settings>(
    "/v10/settings",
    () => input,
    {
      method: "PUT",
      body: JSON.stringify(input),
      latency: 600,
    },
  );

export {
  DEMO_KEYS,
  currentAdmin,
  staffMembers,
} from "@/lib/mock/data";

export * from "./types";
