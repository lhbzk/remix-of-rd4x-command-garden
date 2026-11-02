import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";

import handler, {
  createServerEntry,
} from "@tanstack/react-start/server-entry";

export default createServerEntry({
  async fetch(request, opts) {
    try {
      const response = await handler.fetch(request, opts);

      if (response.status < 500) {
        return response;
      }

      const contentType =
        response.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const body = await response.clone().text();

        if (isH3SwallowedErrorBody(body)) {
          console.error(
            consumeLastCapturedError() ??
              new Error(`h3 swallowed SSR error: ${body}`),
          );
        }
      }

      return response;
    } catch (error) {
      console.error(
        consumeLastCapturedError() ??
          (error instanceof Error
            ? error
            : new Error(String(error))),
      );

      throw error;
    }
  },
});

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as {
      unhandled?: unknown;
      message?: unknown;
    };

    return (
      payload.unhandled === true &&
      payload.message === "HTTPError"
    );
  } catch {
    return false;
  }
}
