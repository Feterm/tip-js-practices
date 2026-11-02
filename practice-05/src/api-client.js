export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

// Проверяет baseUrl и возвращает объект URL: только абсолютный http/https
// без query и hash.
function parseBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
    throw new TypeError("baseUrl должен быть непустой строкой.");
  }

  let url;
  try {
    url = new URL(baseUrl);
  } catch (cause) {
    throw new TypeError("baseUrl должен быть абсолютным адресом.", { cause });
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError("baseUrl должен использовать http или https.");
  }
  if (url.search !== "" || url.hash !== "" || baseUrl.includes("?") || baseUrl.includes("#")) {
    throw new TypeError("baseUrl не должен содержать query или hash.");
  }
  return url;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidTimeout(value) {
  return Number.isSafeInteger(value) && value > 0;
}

// Создаёт URL относительно baseUrl и добавляет непустые параметры query.
// Значения кодируются средствами URL и URLSearchParams, а не вручную.
export function buildUrl(baseUrl, path, query = {}) {
  const base = parseBaseUrl(baseUrl);

  if (typeof path !== "string" || path.trim() === "") {
    throw new TypeError("path должен быть непустой строкой.");
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) {
    throw new TypeError("path должен быть относительным путём.");
  }
  if (!isPlainObject(query)) {
    throw new TypeError("query должен быть обычным объектом.");
  }

  // Убираем лишние "/" с обеих сторон, чтобы на стыке остался ровно один.
  const basePath = base.pathname.replace(/\/+$/, "");
  const relativePath = path.replace(/^\/+/, "");
  const url = new URL(`${base.origin}${basePath}/${relativePath}`);

  for (const [name, value] of Object.entries(query)) {
    // false и 0 - содержательные значения, пропускаем только эти три.
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(name, String(value));
  }
  return url.href;
}

// fetchFn передаётся явно, чтобы модуль можно было проверить без реальной сети.
// Возвращаемый объект: { requestJson(path, { query, signal, timeoutMs } = {}) }.
export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 2000,
} = {}) {
  // Проверяем конфигурацию один раз при создании клиента.
  parseBaseUrl(baseUrl);
  if (typeof fetchFn !== "function") {
    throw new TypeError("fetchFn должен быть функцией.");
  }
  if (!isValidTimeout(timeoutMs)) {
    throw new TypeError("timeoutMs должен быть положительным целым числом.");
  }

  async function requestJson(path, {
    query = {},
    signal,
    timeoutMs: requestTimeoutMs = timeoutMs,
  } = {}) {
    if (!isValidTimeout(requestTimeoutMs)) {
      throw new TypeError("timeoutMs должен быть положительным целым числом.");
    }
    if (signal !== undefined && !(signal instanceof AbortSignal)) {
      throw new TypeError("signal должен быть AbortSignal.");
    }

    const url = buildUrl(baseUrl, path, query);

    // Тайм-аут и внешняя отмена - два разных сигнала, потому что их
    // нужно различать в ApiError. fetch получает один объединённый.
    const timeoutSignal = AbortSignal.timeout(requestTimeoutMs);
    const fetchSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

    // Превращает причину отказа в ApiError timeout или aborted.
    // Если ни один сигнал не сработал, возвращает null.
    function abortError(cause) {
      if (signal?.aborted) {
        return new ApiError("Запрос отменён.", { kind: "aborted", url, cause });
      }
      if (timeoutSignal.aborted) {
        return new ApiError(
          `Превышено время ожидания ответа (${requestTimeoutMs} мс).`,
          { kind: "timeout", url, cause },
        );
      }
      return null;
    }

    // Отдельный try только вокруг fetch: сюда попадает отказ без ответа сервера.
    // HTTP-ошибка (404, 503) сюда не попадёт, она обрабатывается ниже.
    let response;
    try {
      response = await fetchFn(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: fetchSignal,
      });
    } catch (cause) {
      throw abortError(cause)
        ?? new ApiError("Не удалось получить ответ от сервера.", { kind: "network", url, cause });
    }

    if (!(response instanceof Response)) {
      throw new ApiError("fetchFn вернул не Response.", { kind: "invalid-response", url });
    }

    // Сначала HTTP-ошибка: статус важнее формата тела.
    if (!response.ok) {
      let payload = null;
      try {
        payload = JSON.parse(await response.text());
      } catch {
        // Тело не JSON или не прочиталось - остаётся только числовой статус.
      }
      const info = isPlainObject(payload?.error) ? payload.error : {};
      throw new ApiError(
        typeof info.message === "string" && info.message !== ""
          ? info.message
          : `Сервер вернул HTTP ${response.status}.`,
        {
          kind: "http",
          status: response.status,
          code: typeof info.code === "string" ? info.code : null,
          details: info.details ?? null,
          url,
        },
      );
    }

    // У 204 тела нет, response.json() здесь упал бы на пустой строке.
    if (response.status === 204) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      throw new ApiError(
        `Ожидался JSON, получен Content-Type: ${contentType || "не указан"}.`,
        { kind: "invalid-response", status: response.status, url },
      );
    }

    try {
      return await response.json();
    } catch (cause) {
      throw abortError(cause)
        ?? new ApiError("Ответ сервера не удалось разобрать как JSON.", {
          kind: "invalid-response",
          status: response.status,
          url,
          cause,
        });
    }
  }

  return { requestJson };
}
