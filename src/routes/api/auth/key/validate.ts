import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

import {
  createKeySession,
  getDiscordSession,
} from "@/server/auth";

export const Route = createFileRoute("/api/auth/key/validate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const discordSession = await getDiscordSession();

          if (!discordSession?.discordId) {
            return Response.json(
              {
                ok: false,
                error: "discord_session_missing",
                message:
                  "Sua sessão do Discord não foi encontrada. Faça login novamente.",
              },
              { status: 401 },
            );
          }

          let body: unknown;

          try {
            body = await request.json();
          } catch {
            return Response.json(
              {
                ok: false,
                error: "invalid_json",
                message: "A solicitação enviada é inválida.",
              },
              { status: 400 },
            );
          }

          const rawKey =
            typeof body === "object" &&
            body !== null &&
            "key" in body &&
            typeof (body as { key?: unknown }).key === "string"
              ? (body as { key: string }).key
              : "";

          const key = rawKey.trim().toUpperCase();

          if (!key) {
            return Response.json(
              {
                ok: false,
                error: "key_missing",
                message: "Informe uma Key RD4X.",
              },
              { status: 400 },
            );
          }

          const apiUrl = String(env.RD4X_API_URL ?? "")
            .trim()
            .replace(/\/+$/, "");

          const dashboardApiKey = String(env.DASHBOARD_API_KEY ?? "").trim();

          if (!apiUrl) {
            console.error("[RD4X] RD4X_API_URL não configurada.");

            return Response.json(
              {
                ok: false,
                error: "rd4x_api_url_missing",
                message:
                  "O servidor não está configurado corretamente: RD4X_API_URL não foi encontrada.",
              },
              { status: 500 },
            );
          }

          if (!dashboardApiKey) {
            console.error("[RD4X] DASHBOARD_API_KEY não configurada.");

            return Response.json(
              {
                ok: false,
                error: "dashboard_api_key_missing",
                message:
                  "O servidor não está configurado corretamente: DASHBOARD_API_KEY não foi encontrada.",
              },
              { status: 500 },
            );
          }

          const validationUrl = `${apiUrl}/api/v2/keys/validate`;

          console.log("[RD4X] Validando Key.", {
            discordId: discordSession.discordId,
            keyPrefix: key.slice(0, 5),
            keyLength: key.length,
            validationUrl,
          });

          let botResponse: Response;

          try {
            botResponse = await fetch(validationUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${dashboardApiKey}`,
              },
              body: JSON.stringify({
                key,
                discordId: discordSession.discordId,
              }),
            });
          } catch (error) {
            console.error("[RD4X] Falha ao comunicar com o bot:", error);

            return Response.json(
              {
                ok: false,
                error: "bot_connection_failed",
                message:
                  "Não foi possível comunicar com o servidor RD4X.",
              },
              { status: 502 },
            );
          }

          const responseText = await botResponse.text();

          let botData: Record<string, unknown> = {};

          if (responseText.trim()) {
            try {
              const parsed = JSON.parse(responseText);

              if (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
              ) {
                botData = parsed as Record<string, unknown>;
              }
            } catch {
              console.error(
                "[RD4X] O bot retornou uma resposta que não é JSON.",
                {
                  status: botResponse.status,
                  responsePreview: responseText.slice(0, 300),
                },
              );

              return Response.json(
                {
                  ok: false,
                  error: "bot_invalid_response",
                  message:
                    "O servidor RD4X retornou uma resposta inválida.",
                  botStatus: botResponse.status,
                },
                { status: 502 },
              );
            }
          }

          console.log("[RD4X] Resposta da validação:", {
            status: botResponse.status,
            ok: botResponse.ok,
            valid: botData.valid,
            reason: botData.reason,
            error: botData.error,
          });

          /*
           * O bot pode retornar motivos como:
           *
           * key_invalida
           * key_de_outro_usuario
           * key_nao_resgatada
           * key_inativa
           *
           * Nós devolvemos o motivo para o frontend poder mostrar
           * exatamente o que aconteceu.
           */

          if (!botResponse.ok) {
            return Response.json(
              {
                ok: false,
                error:
                  typeof botData.error === "string"
                    ? botData.error
                    : "key_validation_failed",
                reason:
                  typeof botData.reason === "string"
                    ? botData.reason
                    : undefined,
                message:
                  typeof botData.message === "string"
                    ? botData.message
                    : typeof botData.error === "string"
                      ? botData.error
                      : "O servidor RD4X recusou a Key.",
                botStatus: botResponse.status,
              },
              { status: botResponse.status },
            );
          }

          const valid = botData.valid === true;

          if (!valid) {
            return Response.json(
              {
                ok: false,
                valid: false,
                error:
                  typeof botData.error === "string"
                    ? botData.error
                    : "key_invalid",
                reason:
                  typeof botData.reason === "string"
                    ? botData.reason
                    : undefined,
                message:
                  typeof botData.message === "string"
                    ? botData.message
                    : "A Key RD4X não pôde ser validada.",
              },
              { status: 400 },
            );
          }

          /*
           * Só criamos a sessão depois que o bot confirmou
           * que a Key é realmente válida.
           */
          try {
            await createKeySession(discordSession.discordId);
          } catch (error) {
            console.error(
              "[RD4X] A Key foi validada, mas não foi possível criar a sessão:",
              error,
            );

            return Response.json(
              {
                ok: false,
                error: "key_session_create_failed",
                message:
                  "A Key foi validada, mas não foi possível criar sua sessão.",
              },
              { status: 500 },
            );
          }

          return Response.json({
            ok: true,
            valid: true,
            message: "Key RD4X validada com sucesso.",
          });
        } catch (error) {
          console.error(
            "[RD4X] Erro inesperado na validação da Key:",
            error,
          );

          return Response.json(
            {
              ok: false,
              error: "key_validation_unexpected_error",
              message:
                "Ocorreu um erro inesperado ao validar sua Key.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
