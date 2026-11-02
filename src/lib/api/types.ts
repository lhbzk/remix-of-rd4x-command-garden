// Shared API contracts. Keep these aligned with the external RD4X API.

export type Role = "owner" | "admin" | "moderator" | "support" | "member";
export type UserStatus = "active" | "inactive" | "banned" | "pending";

export interface User {
  id: string;
  username: string;
  discordId: string;
  email: string;
  role: Role;
  status: UserStatus;
  keys: number;
  executions: number;
  lastActive: string;
  joinedAt: string;
  country: string;
  hue: number;
}

export type KeyStatus = "active" | "expired" | "revoked";

export interface KeyRecord {
  key: string;
  owner: string;
  status: KeyStatus;
  plan: "Lifetime" | "Monthly" | "Weekly";
  createdAt: string;
  expiresAt: string;
}

export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface ChatMessage {
  id: string;
  author: string;
  authorRole: "user" | "staff" | "system";
  hue: number;
  content: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: Priority;
  category: string;
  user: { username: string; discordId: string; hue: number };
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export type ReleaseChannel = "stable" | "beta" | "hotfix";

export type DiscordChannelType = "text" | "announcement" | "forum";

export interface DiscordChannel {
  id: string;
  name: string;
  type: DiscordChannelType;
  category: string | null;
  canSendMessages: boolean;
}

export interface Release {
  id: string;
  version: string;
  title: string;
  channel: ReleaseChannel;
  date: string;
  author: string;
  downloads: number;
  changes: { type: "feature" | "fix" | "improvement"; text: string }[];

  // Discord publication metadata.
  discordChannelId?: string | null;
  discordMessageId?: string | null;
  publishedToDiscord?: boolean;
}

export type Severity = "critical" | "major" | "minor";
export type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  service: string;
  startedAt: string;
  resolvedAt: string | null;
  updates: { at: string; status: IncidentStatus; message: string }[];
}

export interface IncidentsPayload {
  incidents: Incident[];
  uptime: number;
  mttrMinutes: number;
  uptimeDays: { date: string; status: "up" | "degraded" | "down" }[];
}

export type AuditStatus = "success" | "failed" | "warning";

export interface AuditEvent {
  id: string;
  timestamp: string;
  user: string;
  hue: number;
  action: string;
  target: string;
  status: AuditStatus;
  ip: string;
}

export interface Transcript {
  id: string;
  ticketId: string;
  subject: string;
  user: string;
  hue: number;
  staff: string;
  closedAt: string;
  tags: string[];
  messages: ChatMessage[];
}

export type HealthStatus = "operational" | "degraded" | "down";

export interface ServiceHealth {
  service: string;
  status: HealthStatus;
  latency: number;
  uptime: number;
}

export interface Activity {
  id: string;
  user: string;
  hue: number;
  action: string;
  target: string;
  at: string;
  kind: "key" | "ticket" | "release" | "user" | "system";
}

export interface StatValue {
  value: number;
  delta: number;
}

export interface Overview {
  stats: {
    totalUsers: StatValue;
    activeUsers: StatValue;
    totalExecutions: StatValue;
    successRate: StatValue;
    openTickets: StatValue;
    activeKeys: StatValue;
  };
  executions: { label: string; executions: number; failures: number }[];
  recentActivity: Activity[];
  recentTickets: Ticket[];
  health: ServiceHealth[];
}

export type Range = "24h" | "7d" | "30d" | "90d";

export interface Statistics {
  range: Range;
  totals: {
    executions: StatValue;
    successRate: StatValue;
    activeUsers: StatValue;
    avgResponse: StatValue;
  };
  executions: { label: string; executions: number }[];
  successFailure: { name: "Success" | "Failure"; value: number }[];
  activeUsers: { label: string; users: number }[];
  responseTime: { label: string; p50: number; p95: number }[];
  topEndpoints: { endpoint: string; calls: number; p95: number; errorRate: number }[];
}

export interface SearchResults {
  query: string;
  users: User[];
  tickets: Ticket[];
  keys: KeyRecord[];
  releases: Release[];
  audit: AuditEvent[];
}

export interface Settings {
  general: { workspace: string; timezone: string; language: string; supportEmail: string };
  profile: { displayName: string; username: string; email: string; bio: string };
  security: {
    twoFactor: boolean;
    sessionTimeout: string;
    sessions: { id: string; device: string; location: string; lastSeen: string; current: boolean }[];
  };
  notifications: Record<"tickets" | "incidents" | "releases" | "security" | "weekly", boolean>;
  appearance: { accent: string; density: "comfortable" | "compact"; reduceMotion: boolean };
  system: { environment: string; version: string; region: string; maintenance: boolean };
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  at: string;
  kind: "ticket" | "incident" | "release" | "security";
  read: boolean;
}

export type KeyValidation =
  | { status: "success"; key: KeyRecord }
  | { status: "invalid" }
  | { status: "expired"; expiredAt: string };
