import { createFileRoute } from "@tanstack/react-router";
import {
  clearDiscordSession,
  clearKeySession,
} from "@/server/auth";

export const Route = createFileRoute("/api/auth/discord/logout")({
  server: {
    handlers: {
      POST: async () => {
        try {
          clearKeySession();
          clearDiscordSession();

          return Response.json(
            {
              ok: true,
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
            "[RD4X Auth] Erro ao encerrar sessão:",
            error,
          );

          return Response.json(
            {
              ok: false,
              error: "Não foi possível encerrar a sessão.",
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
