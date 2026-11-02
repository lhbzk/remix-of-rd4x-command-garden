import { queryOptions } from "@tanstack/react-query";
import * as api from "./index";
import type { Range } from "./types";

export const queries = {
  overview: () => queryOptions({ queryKey: ["overview"], queryFn: api.getOverview }),

  users: () => queryOptions({ queryKey: ["users"], queryFn: api.getUsers }),

  tickets: () => queryOptions({ queryKey: ["tickets"], queryFn: api.getTickets }),

  releases: () => queryOptions({ queryKey: ["releases"], queryFn: api.getReleases }),

  discordChannels: () =>
    queryOptions({
      queryKey: ["discord-channels"],
      queryFn: api.getDiscordChannels,
    }),

  incidents: () =>
    queryOptions({
      queryKey: ["incidents"],
      queryFn: api.getIncidents,
    }),

  statistics: (range: Range) =>
    queryOptions({
      queryKey: ["statistics", range],
      queryFn: () => api.getStatistics(range),
    }),

  audit: () =>
    queryOptions({
      queryKey: ["audit"],
      queryFn: api.getAudit,
    }),

  transcripts: () =>
    queryOptions({
      queryKey: ["transcripts"],
      queryFn: api.getTranscripts,
    }),

  settings: () =>
    queryOptions({
      queryKey: ["settings"],
      queryFn: api.getSettings,
    }),

  notifications: () =>
    queryOptions({
      queryKey: ["notifications"],
      queryFn: api.getNotifications,
    }),

  search: (q: string) =>
    queryOptions({
      queryKey: ["search", q],
      queryFn: () => api.search(q),
      enabled: q.trim().length > 0,
    }),
};
