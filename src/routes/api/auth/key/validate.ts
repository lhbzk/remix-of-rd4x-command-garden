import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

import {
  createKeySession,
  getDiscordSession,
} from "@/server/auth";

function describeSafeError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`.slice(0, 500);
  }

  return String(error).slice(0, 500);
}

export const Route = createFileRoute(
  "/api/auth/key/validate",
)({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let session;

        try {
          session = await getDiscordSession();
        } catch (error) {
          console.error(
            "[RD4X KEY] Erro ao ler sessão do Discord:",
            error,
          );

          return Response.json(
            {
              ok: false,
              error: "Discord session could not be read.",
              diagnostic: "discord_session_read_failed",
              detail: describeSafeError(error),
            },
            {
              status: 500,
              headers: {
                "Cache-Control": "no-store",
              },
            },
          );
        }

        if (!session) {
          return Response.json(
            {
              ok: false,
              error: "Discord session required.",
              diagnostic: "discord_session_missing",
            },
            {
              status: 401,
              headers: {
                "Cache-Control": "no-store",
              },
            },
          );
        }

        let body: {
          key?: unknown;
        };

        try {
          body = await request.json();
        } catch {
          return Response.json(
            {
              ok: false,
              error: "Invalid request body.",
            },
            {
              status: 400,
              headers: {
                "Cache-Control": "no-store",
              },
            },
          );
        }

        const key =
          typeof body.key === "string"
            ? body.key.trim().toUpperCase()
            : "";

        if (!key) {
          return Response.json(
            {
              ok: false,
              error: "RD4X Key is required.",
            },
            {
              status: 400,
              headers: {
                "Cache-Control": "no-store",
              },
            },
          );
        }

        const discordId = String(
          session.discordId ?? "",
        ).trim();

        if (!discordId) {
          return Response.json(
            {
              ok: false,
              error:
                "Discord session is missing the Discord ID.",
            },
            {
              status: 401,
              headers: {
                "Cache-Control": "no-store",
              },
            },
          );
        }

        const RD4X_API_URL = String(
          env.RD4X_API_URL ?? "",
        ).trim();

        const DASHBOARD_API_KEY = String(
          env.DASHBOARD_API_KEY ?? "",
        ).trim();

        if (
          !RD4X_API_URL ||
          !DASHBOARD_API_KEY
        ) {
          return Response.json(
            {
              ok: false,
              error:
                "Key server is not configured.",
              diagnostic:
                "key_server_config_missing",
            },
            {
              status: 500,
              headers: {
                "Cache-Control": "no-store",
              },
            },
          );
        }

        try {
          const response = await fetch(
            `${RD4X_API_URL.replace(
              /\/$/,
              "",
            )}/api/v2/keys/validate`,
            {
              method: "POST",
              headers: {
                Authorization:
                  `Bearer ${DASHBOARD_API_KEY}`,
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
                "Cache-Control":
                  "no-store",
              },
              body: JSON.stringify({
                key,
                discordId,
              }),
            },
          );

          const data =
            await response
              .json()
              .catch(() => null);

          if (!response.ok) {
            return Response.json(
              {
                ok: false,
                error:
                  data?.error ??
                  "Unable to validate the RD4X Key.",
                status:
                  data?.status ??
                  response.status,
                data,
              },
              {
                status:
                  response.status >= 400 &&
                  response.status <= 599
                    ? response.status
                    : 502,
                headers: {
                  "Cache-Control":
                    "no-store",
                },
              },
            );
          }

          if (data?.valid !== true) {
            return Response.json(
              {
                ok: true,
                data,
              },
              {
                status: 200,
                headers: {
                  "Cache-Control":
                    "no-store",
                },
              },
            );
          }

          try {
            await createKeySession(
              discordId,
            );
          } catch (error) {
            console.error(
              "[RD4X KEY] Key aceita, mas falhou ao criar sessão:",
              error,
            );

            return Response.json(
              {
                ok: false,
                error:
                  "Key was accepted, but the dashboard session could not be created.",
                diagnostic:
                  "key_session_create_failed",
                detail:
                  describeSafeError(
                    error,
                  ),
              },
              {
                status: 500,
                headers: {
                  "Cache-Control":
                    "no-store",
                },
              },
            );
          }

          return Response.json(
            {
              ok: true,
              data,
            },
            {
              status: 200,
              headers: {
                "Cache-Control":
                  "no-store",
              },
            },
          );
        } catch (error) {
          console.error(
            "[RD4X KEY] Erro no servidor de Keys:",
            error,
          );

          return Response.json(
            {
              ok: false,
              error:
                "Não foi possível conectar ao servidor de Keys.",
              diagnostic:
                "key_server_request_failed",
              detail:
                describeSafeError(error),
            },
            {
              status: 502,
              headers: {
                "Cache-Control":
                  "no-store",
              },
            },
          );
        }
      },
    },
  },
});
