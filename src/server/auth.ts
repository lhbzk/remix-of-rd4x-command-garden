import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";

const DISCORD_SESSION_COOKIE = "__Host-rd4x-discord";
const OAUTH_STATE_COOKIE = "__Host-rd4x-oauth";
const KEY_SESSION_COOKIE = "__Host-rd4x-key";

const DISCORD_SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const OAUTH_STATE_MAX_AGE = 60 * 10;
const KEY_SESSION_MAX_AGE = 60 * 60 * 2;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
} as const;

export type DiscordSession = {
  discordId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  role: "Dono" | "Administrador";
  isOwner: boolean;
  isAdmin: boolean;
  issuedAt: number;
  expiresAt: number;
};

export type KeySession = {
  discordId: string;
  issuedAt: number;
  expiresAt: number;
};

type OAuthState = {
  state: string;
  issuedAt: number;
  expiresAt: number;
};

function getSessionSecret(): string {
  const secret = process.env.DASHBOARD_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "DASHBOARD_SESSION_SECRET must be configured with at least 32 characters.",
    );
  }

  return secret;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array | null {
  try {
    const normalized = value
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(value.length / 4) * 4, "=");

    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  } catch {
    return null;
  }
}

function encodePayload(payload: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return bytesToBase64Url(bytes);
}

function decodePayload<T>(value: string): T | null {
  const bytes = base64UrlToBytes(value);

  if (!bytes) {
    return null;
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}

async function signValue(value: string): Promise<string> {
  const secret = getSessionSecret();

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );

  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifySignature(
  value: string,
  signature: string,
): Promise<boolean> {
  const secret = getSessionSecret();
  const signatureBytes = base64UrlToBytes(signature);

  if (!signatureBytes) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["verify"],
  );

  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    new TextEncoder().encode(value),
  );
}

async function seal<T>(payload: T): Promise<string> {
  const encodedPayload = encodePayload(payload);
  const signature = await signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

async function unseal<T>(value: string): Promise<T | null> {
  const separator = value.lastIndexOf(".");

  if (separator <= 0 || separator === value.length - 1) {
    return null;
  }

  const encodedPayload = value.slice(0, separator);
  const signature = value.slice(separator + 1);

  if (!(await verifySignature(encodedPayload, signature))) {
    return null;
  }

  return decodePayload<T>(encodedPayload);
}

function isValidExpiry(expiresAt: unknown): expiresAt is number {
  return (
    typeof expiresAt === "number" &&
    Number.isFinite(expiresAt) &&
    expiresAt > Date.now()
  );
}

function generateRandomState(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return bytesToBase64Url(bytes);
}

export async function createOAuthState(): Promise<string> {
  const now = Date.now();

  const payload: OAuthState = {
    state: generateRandomState(),
    issuedAt: now,
    expiresAt: now + OAUTH_STATE_MAX_AGE * 1000,
  };

  const token = await seal(payload);

  setCookie(OAUTH_STATE_COOKIE, token, {
    ...COOKIE_OPTIONS,
    maxAge: OAUTH_STATE_MAX_AGE,
  });

  return payload.state;
}

export async function consumeOAuthState(
  returnedState: string,
): Promise<boolean> {
  if (!returnedState) {
    deleteCookie(OAUTH_STATE_COOKIE, COOKIE_OPTIONS);
    return false;
  }

  const token = getCookie(OAUTH_STATE_COOKIE);

  // Always consume the cookie, including invalid attempts.
  deleteCookie(OAUTH_STATE_COOKIE, COOKIE_OPTIONS);

  if (!token) {
    return false;
  }

  const payload = await unseal<OAuthState>(token);

  if (!payload) {
    return false;
  }

  if (!isValidExpiry(payload.expiresAt)) {
    return false;
  }

  if (
    typeof payload.state !== "string" ||
    payload.state.length < 20 ||
    payload.state !== returnedState
  ) {
    return false;
  }

  return true;
}

export async function createDiscordSession(
  data: Omit<DiscordSession, "issuedAt" | "expiresAt">,
): Promise<void> {
  const now = Date.now();

  const payload: DiscordSession = {
    ...data,
    issuedAt: now,
    expiresAt: now + DISCORD_SESSION_MAX_AGE * 1000,
  };

  const token = await seal(payload);

  setCookie(DISCORD_SESSION_COOKIE, token, {
    ...COOKIE_OPTIONS,
    maxAge: DISCORD_SESSION_MAX_AGE,
  });

  // A new Discord authentication must invalidate any previous
  // RD4X Key session associated with the old authentication.
  deleteCookie(KEY_SESSION_COOKIE, COOKIE_OPTIONS);
}

export async function getDiscordSession(): Promise<DiscordSession | null> {
  const token = getCookie(DISCORD_SESSION_COOKIE);

  if (!token) {
    return null;
  }

  const payload = await unseal<DiscordSession>(token);

  if (!payload || !isValidExpiry(payload.expiresAt)) {
    deleteCookie(DISCORD_SESSION_COOKIE, COOKIE_OPTIONS);
    deleteCookie(KEY_SESSION_COOKIE, COOKIE_OPTIONS);

    return null;
  }

  if (
    typeof payload.discordId !== "string" ||
    !payload.discordId ||
    typeof payload.username !== "string" ||
    !payload.username
  ) {
    deleteCookie(DISCORD_SESSION_COOKIE, COOKIE_OPTIONS);
    deleteCookie(KEY_SESSION_COOKIE, COOKIE_OPTIONS);

    return null;
  }

  return payload;
}

export function clearDiscordSession(): void {
  deleteCookie(DISCORD_SESSION_COOKIE, COOKIE_OPTIONS);
  deleteCookie(KEY_SESSION_COOKIE, COOKIE_OPTIONS);
}

export async function createKeySession(
  discordId: string,
): Promise<void> {
  if (!discordId) {
    throw new Error("Cannot create a key session without a Discord ID.");
  }

  const now = Date.now();

  const payload: KeySession = {
    discordId,
    issuedAt: now,
    expiresAt: now + KEY_SESSION_MAX_AGE * 1000,
  };

  const token = await seal(payload);

  // Deliberately no maxAge:
  // this is a browser-session cookie, while the signed payload
  // independently expires after two hours.
  setCookie(KEY_SESSION_COOKIE, token, COOKIE_OPTIONS);
}

export async function getKeySession(): Promise<KeySession | null> {
  const token = getCookie(KEY_SESSION_COOKIE);

  if (!token) {
    return null;
  }

  const payload = await unseal<KeySession>(token);

  if (!payload || !isValidExpiry(payload.expiresAt)) {
    deleteCookie(KEY_SESSION_COOKIE, COOKIE_OPTIONS);
    return null;
  }

  if (
    typeof payload.discordId !== "string" ||
    !payload.discordId
  ) {
    deleteCookie(KEY_SESSION_COOKIE, COOKIE_OPTIONS);
    return null;
  }

  return payload;
}

export function clearKeySession(): void {
  deleteCookie(KEY_SESSION_COOKIE, COOKIE_OPTIONS);
      }
