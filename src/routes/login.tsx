import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AuthShell,
  DiscordIcon,
} from "@/components/dashboard/AuthShell";
import { LogoMark } from "@/components/dashboard/Logo";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  head: () =>
    pageHead(
      "Sign in with Discord",
      "Sign in to the RD4X admin console with your Discord account.",
    ),
  component: LoginPage,
});

const SCOPES = [
  "Read your Discord username and avatar",
  "Verify your RD4X server roles",
  "Link your RD4X keys",
];

function LoginPage() {
  const [loading, setLoading] = useState(false);

  const connect = () => {
    if (loading) {
      return;
    }

    setLoading(true);

    /*
     * The real OAuth flow is handled server-side.
     *
     * The browser never receives:
     * - DISCORD_CLIENT_SECRET
     * - DASHBOARD_API_KEY
     * - RD4X_API_URL credentials
     *
     * The server creates the OAuth state, stores it in a
     * secure HttpOnly cookie and redirects the browser to Discord.
     */
    window.location.assign("/api/auth/discord/login");
  };

  return (
    <AuthShell>
      <div className="w-full max-w-[420px] fade-up">
        <div className="surface-float rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <LogoMark className="size-12 rounded-xl" />

            <h1 className="mt-5 text-xl font-semibold tracking-tight">
              Welcome to RD4X Dashboard
            </h1>

            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in with Discord to access the admin console.
            </p>
          </div>

          <Button
            size="lg"
            onClick={connect}
            disabled={loading}
            className="mt-7 h-11 w-full bg-discord text-discord-foreground hover:bg-discord/90"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <DiscordIcon className="size-5" />
            )}

            {loading
              ? "Connecting to Discord…"
              : "Continue with Discord"}
          </Button>

          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-eyebrow mb-3">
              RD4X will be able to
            </p>

            <ul className="space-y-2.5">
              {SCOPES.map((scope) => (
                <li
                  key={scope}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="size-3" />
                  </span>

                  {scope}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Lock className="size-3" />
            We never see your Discord password.
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          By continuing you agree to the RD4X Terms and Privacy Policy.
        </p>
      </div>
    </AuthShell>
  );
}
