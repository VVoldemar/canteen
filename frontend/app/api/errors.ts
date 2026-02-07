export interface ApiError {
  message: string;
  code?: string;
  detail?: unknown;
}

const DEFAULT_ERROR_MESSAGE = "Неизвестная ошибка";

function extractDetailMessage(detail: unknown): string | null {
  if (!detail) return null;
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          const msg = (item as { msg?: unknown }).msg;
          return typeof msg === "string" ? msg : null;
        }
        return null;
      })
      .filter(Boolean);

    return messages.length > 0 ? messages.join(", ") : null;
  }

  if (typeof detail === "object") {
    const obj = detail as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
  }

  return null;
}

export function getApiErrorMessage(data?: unknown): string {
  if (!data) return DEFAULT_ERROR_MESSAGE;
  if (typeof data === "string") return data;

  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.code === "string" && typeof obj.detail === "string") {
      return obj.detail;
    }

    if ("detail" in obj) {
      const detailMessage = extractDetailMessage(obj.detail);
      if (detailMessage) return detailMessage;
    }
  }

  return DEFAULT_ERROR_MESSAGE;
}

export class ApiException extends Error {
  constructor(public status: number, public error: ApiError) {
    super(error.message);
    this.name = "ApiException";
  }
}
