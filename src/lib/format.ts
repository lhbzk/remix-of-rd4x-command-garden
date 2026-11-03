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
 * Normaliza uma RD4X Key para:
 *
 * RD4X-XXXX-XXXX-XXXX
 *
 * Aceita tanto a Key completa:
 * RD4X-ABCD-EFGH-IJKL
 *
 * quanto somente o conteúdo:
 * ABCD-EFGH-IJKL
 *
 * e remove prefixos RD4X duplicados.
 */
export function formatKeyInput(raw: string) {
  let s = String(raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  // Remove qualquer quantidade de prefixos RD4X.
  while (s.startsWith("RD4X")) {
    s = s.slice(4);
  }

  // Uma Key RD4X possui exatamente 12 caracteres depois do prefixo.
  s = s.slice(0, 12);

  const groups = s.match(/.{1,4}/g) ?? [];

  return ["RD4X", ...groups].join("-");
}

export function normalizeProductKey(raw: string) {
  let s = String(raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  while (s.startsWith("RD4X")) {
    s = s.slice(4);
  }

  s = s.slice(0, 12);

  if (s.length !== 12) {
    return "";
  }

  return `RD4X-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

export const isCompleteKey = (key: string) =>
  /^RD4X-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key);

export const capitalize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1);
