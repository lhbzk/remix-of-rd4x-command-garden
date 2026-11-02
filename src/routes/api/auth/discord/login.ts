import { createFileRoute } from "@tanstack/react-router";
import { createOAuthState } from "@/server/auth";

export const Route = createFileRoute("/api/auth/discord/login")({
  server: {
    handlers: {
      GET: async () => {
        const clientId = process.env.DISCORD_CLIENT_ID;
        const redirectUri =
          process.env.DISCORD_OAUTH_REDIRECT_URI;

        if (!clientId || !redirectUri) {
          console.error(
            "[RD4X OAuth] DISCORD_CLIENT_ID ou DISCORD_OAUTH_REDIRECT_URI não configurado.",
          );

          return Response.json(
            {
              ok: false,
              error:
                "Discord OAuth is not configured on the server.",
            },
            { status: 500 },
          );
        }

        try {
          /*
           * Creates a cryptographically random OAuth state and
           * stores it inside a signed, HttpOnly cookie.
           *
           * The state is consumed exactly once by the callback.
           */
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

          return Response.redirect(
            authorizationUrl,
            302,
          );
        } catch (error) {
          console.error(
            "[RD4X OAuth] Erro ao iniciar autenticação com Discord:",
            error,
          );

          return Response.json(
            {
              ok: false,
              error:
                "Unable to start Discord authentication.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
