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

        const discordId =
          String(
            session.discordId ??
              "",
          ).trim();

        if (!discordId) {
          console.error(
            "[RD4X KEY] Sessão sem Discord ID.",
          );

          return Response.json(
            {
              ok: false,
              error:
                "Discord session is missing the Discord ID.",
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
          console.log(
            "[RD4X KEY] Validando Key para Discord ID:",
            discordId,
          );

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

                  discordId,
                }),
              },
            );

          const data =
            await response
              .json()
              .catch(
                () => null,
              );

          console.log(
            "[RD4X KEY] Resposta do Bot:",
            {
              status:
                response.status,
              ok:
                response.ok,
              valid:
                data?.valid,
              reason:
                data?.reason ??
                data?.data?.reason ??
                null,
            },
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

                data,
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

          if (
            data?.valid !== true
          ) {
            console.warn(
              "[RD4X KEY] Bot rejeitou a Key:",
              {
                discordId,
                reason:
                  data?.reason ??
                  data?.data?.reason ??
                  null,
              },
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
          }

          await createKeySession(
            discordId,
          );

          console.log(
            "[RD4X KEY] Key validada com sucesso para Discord ID:",
            discordId,
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
