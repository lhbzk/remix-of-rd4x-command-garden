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

          const dashboardApiKey = String(
            env.DASHBOARD_API_KEY ?? "",
          ).trim();

          if (!apiUrl) {
            console.error("[RD4X] RD4X_API_URL não configurada.");

            return Response.json(
              {
                ok: false,
                error: "rd4x_api_url_missing",
                message:
                  "RD4X_API_URL não foi configurada no Worker.",
              },
              { status: 500 },
            );
          }

          if (!dashboardApiKey) {
            console.error(
              "[RD4X] DASHBOARD_API_KEY não configurada.",
            );

            return Response.json(
              {
                ok: false,
                error: "dashboard_api_key_missing",
                message:
                  "DASHBOARD_API_KEY não foi configurada no Worker.",
              },
              { status: 500 },
            );
          }

          const validationUrl = `${apiUrl}/api/v2/keys/validate`;

          console.log("[RD4X] Chamando bot:", {
            validationUrl,
            discordId: discordSession.discordId,
            keyPrefix: key.slice(0, 5),
            keyLength: key.length,
          });

          let botResponse: Response;

          try {
            botResponse = await fetch(validationUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${dashboardApiKey}`,
              },
              body: JSON.stringify({
                key,
                discordId: discordSession.discordId,
              }),
            });
          } catch (error) {
            console.error(
              "[RD4X] Erro ao fazer fetch para o bot:",
              error,
            );

            return Response.json(
              {
                ok: false,
                error: "bot_connection_failed",
                message:
                  "Não foi possível conectar ao servidor RD4X.",
              },
              { status: 502 },
            );
          }

          const contentType =
            botResponse.headers.get("content-type") ?? "";

          const responseText = await botResponse.text();

          console.log("[RD4X] RESPOSTA BRUTA DO BOT:", {
            status: botResponse.status,
            statusText: botResponse.statusText,
            contentType,
            url: botResponse.url,
            bodyLength: responseText.length,
            body: responseText.slice(0, 2000),
          });

          let botData: Record<string, unknown> | null = null;

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
              "[RD4X] BOT_INVALID_RESPONSE:",
              {
                status: botResponse.status,
                contentType,
                body: responseText.slice(0, 2000),
              },
            );

            return Response.json(
              {
                ok: false,
                error: "bot_invalid_response",
                message:
                  "O bot não retornou JSON válido.",
                botStatus: botResponse.status,
                botContentType: contentType,
                botBody: responseText.slice(0, 2000),
                validationUrl,
              },
              { status: 502 },
            );
          }

          if (!botData) {
            return Response.json(
              {
                ok: false,
                error: "bot_invalid_response",
                message:
                  "O bot retornou uma resposta JSON inválida.",
                botStatus: botResponse.status,
                botContentType: contentType,
                botBody: responseText.slice(0, 2000),
              },
              { status: 502 },
            );
          }

          console.log("[RD4X] Dados retornados pelo bot:", botData);

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
                    : "A Key RD4X não foi validada pelo bot.",
                botResponse: botData,
              },
              { status: 400 },
            );
          }

          try {
            await createKeySession(discordSession.discordId);
          } catch (error) {
            console.error(
              "[RD4X] Key validada, mas erro ao criar sessão:",
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
            "[RD4X] Erro inesperado:",
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
