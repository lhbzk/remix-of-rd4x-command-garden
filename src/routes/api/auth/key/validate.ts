import { createFileRoute } from "@tanstack/react-router";
import { getDiscordSession } from "@/server/auth";

export const Route = createFileRoute("/api/auth/key/validate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await getDiscordSession();

        if (!session) {
          return Response.json(
            {
              ok: false,
              error: "Discord session required.",
            },
            { status: 401 },
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
            { status: 400 },
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
            { status: 400 },
          );
        }

        const RD4X_API_URL = process.env.RD4X_API_URL;
        const DASHBOARD_API_KEY =
          process.env.DASHBOARD_API_KEY;

        if (!RD4X_API_URL || !DASHBOARD_API_KEY) {
          console.error(
            "[RD4X KEY] Servidor não configurado corretamente.",
          );

          return Response.json(
            {
              ok: false,
              error: "Key server is not configured.",
            },
            { status: 500 },
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
                Authorization: `Bearer ${DASHBOARD_API_KEY}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                key,
                discordId: session.discordId,
              }),
            },
          );

          const data = await response.json().catch(() => null);

          if (!response.ok) {
            return Response.json(
              {
                ok: false,
                error:
                  data?.error ||
                  "Unable to validate the RD4X Key.",
                status: data?.status,
              },
              {
                status:
                  response.status >= 400 &&
                  response.status < 600
                    ? response.status
                    : 502,
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
                "Cache-Control": "no-store",
              },
            },
          );
        } catch (error) {
          console.error(
            "[RD4X KEY] Erro ao comunicar com o servidor RD4X:",
            error,
          );

          return Response.json(
            {
              ok: false,
              error:
                "Não foi possível conectar ao servidor de Keys.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
