import { createFileRoute } from "@tanstack/react-router";
import {
  consumeOAuthState,
  createDiscordSession,
} from "@/server/auth";

export const Route = createFileRoute("/api/auth/discord/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);

        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const oauthError = url.searchParams.get("error");

        if (oauthError) {
          return Response.redirect(
            new URL(
              "/login?error=discord_denied",
              request.url,
            ),
            302,
          );
        }

        if (!code || !state) {
          return Response.redirect(
            new URL(
              "/login?error=invalid_oauth",
              request.url,
            ),
            302,
          );
        }

        try {
          const validState =
            await consumeOAuthState(state);

          if (!validState) {
            console.warn(
              "[RD4X AUTH] OAuth state inválido ou expirado.",
            );

            return Response.redirect(
              new URL(
                "/login?error=invalid_state",
                request.url,
              ),
              302,
            );
          }

          const RD4X_API_URL =
            process.env.RD4X_API_URL;

          const DASHBOARD_API_KEY =
            process.env.DASHBOARD_API_KEY;

          const DISCORD_OAUTH_REDIRECT_URI =
            process.env.DISCORD_OAUTH_REDIRECT_URI;

          if (
            !RD4X_API_URL ||
            !DASHBOARD_API_KEY ||
            !DISCORD_OAUTH_REDIRECT_URI
          ) {
            console.error(
              "[RD4X AUTH] Variáveis de ambiente do OAuth não configuradas.",
            );

            return Response.redirect(
              new URL(
                "/login?error=server_config",
                request.url,
              ),
              302,
            );
          }

          const response = await fetch(
            `${RD4X_API_URL.replace(
              /\/$/,
              "",
            )}/api/auth/discord/exchange`,
            {
              method: "POST",
              headers: {
                Authorization:
                  `Bearer ${DASHBOARD_API_KEY}`,
                "Content-Type":
                  "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                code,
                redirectUri:
                  DISCORD_OAUTH_REDIRECT_URI,
              }),
            },
          );

          const data = await response
            .json()
            .catch(() => null);

          if (
            !response.ok ||
            !data?.success ||
            !data?.data
          ) {
            console.error(
              "[RD4X AUTH] Falha na troca do código Discord:",
              response.status,
            );

            return Response.redirect(
              new URL(
                "/login?error=discord_exchange",
                request.url,
              ),
              302,
            );
          }

          const discordUser = data.data;

          if (
            !discordUser.id ||
            !discordUser.discordId ||
            !discordUser.username
          ) {
            console.error(
              "[RD4X AUTH] Resposta do servidor RD4X sem dados obrigatórios.",
            );

            return Response.redirect(
              new URL(
                "/login?error=invalid_user",
                request.url,
              ),
              302,
            );
          }

          await createDiscordSession({
            discordId:
              discordUser.discordId,
            username:
              discordUser.username,
            globalName:
              discordUser.globalName ?? null,
            avatar:
              discordUser.avatar ?? null,
            role:
              discordUser.role === "Dono"
                ? "Dono"
                : "Administrador",
            isOwner:
              Boolean(discordUser.isOwner),
            isAdmin:
              Boolean(discordUser.isAdmin),
          });

          return new Response(null, {
            status: 302,
            headers: {
              Location: new URL(
                "/key",
                request.url,
              ).toString(),
              "Cache-Control": "no-store",
            },
          });
        } catch (error) {
          console.error(
            "[RD4X AUTH] Erro durante o callback OAuth:",
            error,
          );

          return Response.redirect(
            new URL(
              "/login?error=server_unavailable",
              request.url,
            ),
            302,
          );
        }
      },
    },
  },
});
