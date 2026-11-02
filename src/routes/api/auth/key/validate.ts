import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

import {
  createKeySession,
  getDiscordSession,
} from "@/server/auth";

export const Route = createFileRoute(
  "/api/auth/key/validate",
)({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session =
          await getDiscordSession();

        if (!session) {
          return Response.json(
            {
              ok: false,
              error:
                "Discord session required.",
            },
            {
              status: 401,
              headers: {
                "Cache-Control":
                  "no-store",
              },
            },
          );
        }

        let body: {
          key?: unknown;
        };

        try {
          body =
            await request.json();
        } catch {
          return Response.json(
            {
              ok: false,
              error:
                "Invalid request body.",
            },
            {
              status: 400,
              headers: {
                "Cache-Control":
                  "no-store",
              },
            },
          );
        }

        const key =
          typeof body.key ===
          "string"
            ? body.key
                .trim()
                .toUpperCase()
            : "";

        if (!key) {
          return Response.json(
            {
              ok: false,
              error:
                "RD4X Key is required.",
            },
            {
              status: 400,
              headers: {
                "Cache-Control":
                  "no-store",
              },
            },
          );
        }

        const RD4X_API_URL =
          String(
            env.RD4X_API_URL ??
              "",
          ).trim();

        const DASHBOARD_API_KEY =
          String(
            env.DASHBOARD_API_KEY ??
              "",
          ).trim();

        if (
          !RD4X_API_URL ||
          !DASHBOARD_API_KEY
        ) {
          console.error(
            "[RD4X KEY] Servidor não configurado corretamente.",
          );

          return Response.json(
            {
              ok: false,
              error:
                "Key server is not configured.",
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

        try {
          const response =
            await fetch(
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

                  discordId:
                    session.discordId,
                }),
              },
            );

          const data =
            await response
              .json()
              .catch(
                () => null,
              );

          if (!response.ok) {
            console.error(
              "[RD4X KEY] Bot API retornou status:",
              response.status,
            );

            return Response.json(
              {
                ok: false,
                error:
                  data?.error ??
                  "Unable to validate the RD4X Key.",

                status:
                  data?.status ??
                  response.status,
              },
              {
                status:
                  response.status >=
                    400 &&
                  response.status <=
                    599
                    ? response.status
                    : 502,

                headers: {
                  "Cache-Control":
                    "no-store",
                },
              },
            );
          }

          /*
           * O BOT é a autoridade da Key.
           *
           * Não criamos sessão no Dashboard
           * até o Bot responder valid:true.
           */
          if (
            data?.valid !== true
          ) {
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

          /*
           * O Bot confirmou:
           *
           * - Key existe
           * - Key está ativa
           * - Key pertence ao Discord ID
           * - Key não expirou
           * - Key pode ser utilizada
           *
           * Agora liberamos a sessão do Dashboard.
           */
          await createKeySession(
            session.discordId,
          );

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
            "[RD4X KEY] Erro ao comunicar com o servidor de Keys:",
            error,
          );

          return Response.json(
            {
              ok: false,
              error:
                "Não foi possível conectar ao servidor de Keys.",
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
