//RD4X
import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  KeyRound,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/dashboard/AuthShell";
import { LogoMark } from "@/components/dashboard/Logo";
import { UserAvatar } from "@/components/dashboard/UserAvatar";
import {
  formatDate,
  formatKeyInput,
  isCompleteKey,
} from "@/lib/format";
import { notify } from "@/lib/notify";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/key")({
  head: () =>
    pageHead(
      "RD4X Key",
      "Activate your RD4X key to unlock the admin console.",
    ),
  component: KeyPage,
});

type KeyRecord = {
  key: string;
  plan: string;
  expiresAt: string;
};

type KeyState =
  | { s: "idle" }
  | { s: "loading" }
  | { s: "invalid" }
  | { s: "expired"; at: string }
  | { s: "success"; key: KeyRecord };

function KeyPage() {
  const navigate = useNavigate();

  const [value, setValue] = useState("RD4X-");
  const [state, setState] = useState<KeyState>({ s: "idle" });
  const [shakeId, setShakeId] = useState(0);

  const [admin, setAdmin] = useState<{
    username: string;
    displayName: string;
    avatar?: string | null;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const complete = isCompleteKey(value);

  useEffect(() => {
    let cancelled = false;

    const loadDiscordSession = async () => {
      try {
        const response = await fetch("/api/auth/discord/me", {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          if (!cancelled && response.status === 401) {
            navigate({ to: "/login" });
          }
          return;
        }

        const data = await response.json();

        if (!cancelled && data?.ok && data?.data) {
          setAdmin({
            username:
              data.data.username ??
              data.data.globalName ??
              "admin",
            displayName:
              data.data.globalName ??
              data.data.username ??
              "Admin",
            avatar: data.data.avatar ?? null,
          });
        }
      } catch {
        if (!cancelled) {
          setAdmin(null);
        }
      }
    };

    void loadDiscordSession();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!complete || state.s === "loading") {
      return;
    }

    setState({ s: "loading" });

    try {
      const response = await fetch("/api/auth/key/validate", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          key: value,
        }),
      });

      const result = await response.json().catch(() => null);

      if (response.status === 401) {
        notify.error(
          "Discord session expired",
          "Please sign in with Discord again.",
        );

        navigate({
          to: "/login",
        });

        return;
      }

      if (!response.ok || !result?.ok) {
        const errorText = String(
          result?.error ?? "",
        ).toLowerCase();

        const expired =
          result?.status === "expired" ||
          errorText.includes("expir") ||
          errorText.includes("expired");

        if (expired) {
          setState({
            s: "expired",
            at:
              result?.data?.expiredAt ??
              new Date().toISOString(),
          });
        } else {
          setState({ s: "invalid" });
        }

        setShakeId((x) => x + 1);
        return;
      }

      const keyResult = result?.data;

      if (keyResult?.valid !== true) {
        const reason = String(
          keyResult?.reason ?? "",
        ).toLowerCase();

        const expired =
          reason.includes("expir") ||
          keyResult?.status === "expired";

        if (expired) {
          setState({
            s: "expired",
            at:
              keyResult?.expiredAt ??
              new Date().toISOString(),
          });
        } else {
          setState({ s: "invalid" });
        }

        setShakeId((x) => x + 1);
        return;
      }

      const data = keyResult?.data ?? {};

      const keyRecord: KeyRecord = {
        key: value,
        plan:
          data.plan ??
          data.type ??
          "RD4X",
        expiresAt:
          data.expiresAt ??
          data.expiration ??
          (
            data.sessionExpiresAt
              ? data.sessionExpiresAt
              : "perm"
          ),
      };

      setState({
        s: "success",
        key: keyRecord,
      });

      notify.success(
        "Key activated",
        "Redirecting to your dashboard…",
      );

      setTimeout(() => {
        navigate({
          to: "/overview",
        });
      }, 1600);
    } catch {
      setState({ s: "idle" });

      notify.error(
        "Couldn't reach the key server",
        "Please try again in a moment.",
      );
    }
  };

  const error =
    state.s === "invalid" ||
    state.s === "expired";

  const username =
    admin?.username ?? "admin";

  const displayName =
    admin?.displayName ?? "RD4X Admin";

  return (
    <AuthShell>
      <div className="w-full max-w-[440px] fade-up">
        <div className="surface-float overflow-hidden rounded-2xl">
          <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-5 py-3.5">
            <UserAvatar
              name={displayName}
              src={admin?.avatar ?? undefined}
              status="online"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                @{username}
              </p>

              <p className="flex items-center gap-1.5 text-xs text-success">
                <span className="size-1.5 rounded-full bg-success" />
                Discord connected
              </p>
            </div>

            <Link
              to="/login"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Switch
            </Link>
          </div>

          <div className="p-6 sm:p-8">
            {state.s === "success" ? (
              <div className="flex flex-col items-center py-4 text-center fade-up">
                <span className="relative inline-flex size-14 items-center justify-center rounded-2xl border border-success/25 bg-success/10 text-success">
                  <span className="absolute inset-0 animate-ping rounded-2xl bg-success/10" />
                  <CheckCircle2 className="relative size-7" />
                </span>

                <h1 className="mt-5 text-xl font-semibold tracking-tight">
                  Access granted
                </h1>

                <p className="mt-1.5 text-sm text-muted-foreground">
                  {state.key.plan} key · valid until{" "}
                  {state.key.expiresAt === "perm"
                    ? "permanently"
                    : formatDate(state.key.expiresAt)}
                </p>

                <p className="mt-4 font-mono text-sm tracking-wider text-primary">
                  {state.key.key}
                </p>

                <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Opening dashboard…
                </div>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="flex flex-col items-center text-center">
                  <LogoMark className="size-12 rounded-xl" />

                  <h1 className="mt-5 text-xl font-semibold tracking-tight">
                    Enter your RD4X Key
                  </h1>

                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Activate your license to continue to the dashboard.
                  </p>
                </div>

                <label
                  htmlFor="rd4x-key"
                  className="mt-7 block text-xs font-medium text-muted-foreground"
                >
                  License key
                </label>

                <div
                  key={shakeId}
                  className={cn(
                    "relative mt-2",
                    shakeId > 0 &&
                      error &&
                      "animate-shake",
                  )}
                >
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    id="rd4x-key"
                    ref={inputRef}
                    value={value}
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                    inputMode="text"
                    onChange={(e) => {
                      setValue(
                        formatKeyInput(
                          e.target.value,
                        ),
                      );

                      if (
                        state.s !== "idle" &&
                        state.s !== "loading"
                      ) {
                        setState({
                          s: "idle",
                        });
                      }
                    }}
                    placeholder="RD4X-XXXX-XXXX-XXXX"
                    aria-invalid={error}
                    disabled={
                      state.s === "loading"
                    }
                    className={cn(
                      "h-12 w-full rounded-xl border bg-background/60 pl-10 pr-4 font-mono text-[15px] uppercase tracking-[0.14em] text-foreground placeholder:text-muted-foreground/50 transition-colors focus:outline-none focus:ring-2 disabled:opacity-60",
                      error
                        ? "border-danger/50 focus:ring-danger/30"
                        : "border-input focus:border-primary/40 focus:ring-ring/40",
                    )}
                  />
                </div>

                {state.s === "invalid" && (
                  <p
                    role="alert"
                    className="mt-2.5 flex items-center gap-1.5 text-xs text-danger fade-up"
                  >
                    <AlertCircle className="size-3.5" />
                    This key is invalid. Check for typos and try again.
                  </p>
                )}

                {state.s === "expired" && (
                  <p
                    role="alert"
                    className="mt-2.5 flex items-center gap-1.5 text-xs text-warning fade-up"
                  >
                    <Clock className="size-3.5" />
                    This key has expired. Renew it to continue.
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={
                    !complete ||
                    state.s === "loading"
                  }
                  className="mt-5 h-11 w-full"
                >
                  {state.s === "loading" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Validating key…
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </AuthShell>
  );
        }
