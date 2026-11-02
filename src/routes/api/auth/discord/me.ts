import { createFileRoute } from "@tanstack/react-router";
import { getDiscordSession } from "@/server/auth";

export const Route = createFileRoute("/api/auth/discord/me")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const session = await getDiscordSession();

          if (!session) {
            return Response.json(
              {
                ok: false,
                error: "Não autenticado.",
              },
              {
                status: 401,
                headers: {
                  "Cache-Control": "no-store",
                },
              },
            );
          }

          return Response.json(
            {
              ok: true,
              data: {
                discordId: session.discordId,
                username: session.username,
                globalName: session.globalName,
                avatar: session.avatar,
                role: session.role,
                isOwner: session.isOwner,
                isAdmin: session.isAdmin,
                expiresAt: session.expiresAt,
              },
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
            "[RD4X Auth] Erro ao consultar sessão do Discord:",
            error,
          );

          return Response.json(
            {
              ok: false,
              error: "Não foi possível verificar a sessão.",
            },
            {
              status: 500,
              headers: {
                "Cache-Control": "no-store",
              },
            },
          );
        }
      },
    },
  },
});
