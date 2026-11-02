import { format, formatDistanceToNowStrict } from "date-fns";

export const formatNumber = (n: number) =>
  new Intl.NumberFormat("en-US").format(n);

export const formatCompact = (n: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);

export const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();

  if (diff < 60_000) {
    return "just now";
  }

  return `${formatDistanceToNowStrict(new Date(iso))} ago`;
};

export const formatDate = (iso: string) =>
  format(new Date(iso), "MMM d, yyyy");

export const formatDateTime = (iso: string) =>
  format(new Date(iso), "MMM d, yyyy · HH:mm");

export const formatTime = (iso: string) =>
  format(new Date(iso), "HH:mm");

export const initials = (name: string) =>
  name
    .replace(/[^a-zA-Z ]/g, " ")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

/**
 * Format raw input into RD4X-XXXX-XXXX-XXXX.
 *
 * The user still has to manually enter/paste the key.
 * This function only normalizes the visual format.
 */
export function formatKeyInput(raw: string) {
  let s = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (s.startsWith("RD4X")) {
    s = s.slice(4);
  }

  s = s.slice(0, 12);

  const groups = s.match(/.{1,4}/g) ?? [];

  return ["RD4X", ...groups].join("-");
}

export const isCompleteKey = (key: string) =>
  /^RD4X-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key);

export const capitalize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1);
