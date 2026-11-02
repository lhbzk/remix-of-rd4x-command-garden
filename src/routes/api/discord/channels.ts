import { createFileRoute } from "@tanstack/react-router";

const RD4X_API_URL = process.env.RD4X_API_URL;
const DASHBOARD_API_KEY = process.env.DASHBOARD_API_KEY;

export const Route = createFileRoute("/api/discord/channels")({
  server: {
    handlers: {
      GET: async () => {
        if (!RD4X_API_URL || !DASHBOARD_API_KEY) {
          console.error(
            "[RD4X] RD4X_API_URL ou DASHBOARD_API_KEY não configurados.",
          );

          return Response.json(
            {
              ok: false,
              error: "Servidor não configurado corretamente.",
            },
            { status: 500 },
          );
        }

        try {
          const response = await fetch(
            `${RD4X_API_URL.replace(/\/$/, "")}/api/dashboard/discord/channels`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${DASHBOARD_API_KEY}`,
                Accept: "application/json",
              },
            },
          );

          const data = await response.json().catch(() => null);

          if (!response.ok) {
            console.error(
              "[RD4X] API de canais respondeu com erro:",
              response.status,
            );

            return Response.json(
              {
                ok: false,
                error:
                  data?.error ||
                  "Não foi possível carregar os canais do Discord.",
              },
              { status: response.status },
            );
          }

          return Response.json(data?.channels ?? [], {
  status: 200,
  headers: {
    "Cache-Control": "no-store",
  },
});
        } catch (error) {
          console.error(
            "[RD4X] Erro ao consultar canais do Discord:",
            error,
          );

          return Response.json(
            {
              ok: false,
              error: "Não foi possível conectar ao servidor do Discord.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
