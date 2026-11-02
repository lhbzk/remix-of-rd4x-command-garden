import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";

const DISCORD_SESSION_COOKIE = "__Host-rd4x-discord";
const OAUTH_STATE_COOKIE = "__Host-rd4x-oauth";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const OAUTH_STATE_MAX_AGE = 10 * 60;

export interface DiscordSession {
  discordId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  role: "Dono" | "Administrador";
  isOwner: boolean;
  isAdmin: boolean;
  issuedAt: number;
  expiresAt: number;
}

function getSecret() {
  const secret = process.env.DASHBOARD_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "DASHBOARD_SESSION_SECRET precisa ter pelo menos 32 caracteres.",
    );
  }

  return secret;
}

function toBase64Url(value: Uint8Array | string) {
  const bytes =
    typeof value === "string"
      ? new TextEncoder().encode(value)
      : value;

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded =
    normalized +
    "=".repeat((4 - (normalized.length % 4)) % 4);

  return atob(padded);
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
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

  return toBase64Url(new Uint8Array(signature));
}

async function verifySignature(
  value: string,
  signature: string,
) {
  const expected = await sign(value);

  if (expected.length !== signature.length) {
    return false;
  }

  let result = 0;

  for (let i = 0; i < expected.length; i++) {
    result |=
      expected.charCodeAt(i) ^
      signature.charCodeAt(i);
  }

  return result === 0;
}

async function seal<T>(payload: T) {
  const data = toBase64Url(
    JSON.stringify(payload),
  );

  const signature = await sign(data);

  return `${data}.${signature}`;
}

async function unseal<T>(token: string) {
  const separator = token.lastIndexOf(".");

  if (separator <= 0) {
    return null;
  }

  const data = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  if (
    !(await verifySignature(
      data,
      signature,
    ))
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      fromBase64Url(data),
    ) as T;

    return decoded;
  } catch {
    return null;
  }
}

export async function createDiscordSession(
  session: Omit<
    DiscordSession,
    "issuedAt" | "expiresAt"
  >,
) {
  const now = Date.now();

  const payload: DiscordSession = {
    ...session,
    issuedAt: now,
    expiresAt:
      now + SESSION_MAX_AGE * 1000,
  };

  const token = await seal(payload);

  setCookie(
    DISCORD_SESSION_COOKIE,
    token,
    {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    },
  );

  return payload;
}

export async function getDiscordSession() {
  const token = getCookie(
    DISCORD_SESSION_COOKIE,
  );

  if (!token) {
    return null;
  }

  const session =
    await unseal<DiscordSession>(token);

  if (!session) {
    return null;
  }

  if (
    !session.discordId ||
    !session.expiresAt ||
    session.expiresAt <= Date.now()
  ) {
    return null;
  }

  return session;
}

export function clearDiscordSession() {
  deleteCookie(
    DISCORD_SESSION_COOKIE,
    {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    },
  );
}

export async function createOAuthState() {
  const random =
    new Uint8Array(32);

  crypto.getRandomValues(random);

  const state =
    toBase64Url(random);

  const token =
    await seal({
      state,
      createdAt: Date.now(),
    });

  setCookie(
    OAUTH_STATE_COOKIE,
    token,
    {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: OAUTH_STATE_MAX_AGE,
    },
  );

  return state;
}

export async function consumeOAuthState(
  receivedState: string,
) {
  const token = getCookie(
    OAUTH_STATE_COOKIE,
  );

  deleteCookie(
    OAUTH_STATE_COOKIE,
    {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    },
  );

  if (!token || !receivedState) {
    return false;
  }

  const data =
    await unseal<{
      state: string;
      createdAt: number;
    }>(token);

  if (!data) {
    return false;
  }

  if (
    Date.now() - data.createdAt >
    OAUTH_STATE_MAX_AGE * 1000
  ) {
    return false;
  }

  if (
    data.state.length !==
    receivedState.length
  ) {
    return false;
  }

  let result = 0;

  for (
    let i = 0;
    i < data.state.length;
    i++
  ) {
    result |=
      data.state.charCodeAt(i) ^
      receivedState.charCodeAt(i);
  }

  return result === 0;
}
