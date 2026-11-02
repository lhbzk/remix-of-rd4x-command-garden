import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { createOAuthState } from "@/server/auth";

export const Route = createFileRoute("/api/auth/discord/login")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const clientId = env.DISCORD_CLIENT_ID;
          const redirectUri = env.DISCORD_OAUTH_REDIRECT_URI;

          if (!clientId || !redirectUri) {
            console.error(
              "[RD4X OAuth] DISCORD_CLIENT_ID ou DISCORD_OAUTH_REDIRECT_URI não configurado.",
            );

            return Response.json(
              {
                ok: false,
                error: "Discord OAuth is not configured on the server.",
              },
              { status: 500 },
            );
          }

          const state = await createOAuthState();

          const params = new URLSearchParams({
            client_id: clientId,
            response_type: "code",
            redirect_uri: redirectUri,
            scope: "identify",
            state,
          });

          const authorizationUrl =
            `https://discord.com/oauth2/authorize?${params.toString()}`;

          return Response.redirect(authorizationUrl, 302);
        } catch (error) {
          console.error(
            "[RD4X OAuth] Erro ao iniciar autenticação com Discord:",
            error,
          );

          return Response.json(
            {
              ok: false,
              error: "Não foi possível iniciar a autenticação do Discord.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
