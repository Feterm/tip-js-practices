// Вспомогательный пример для отчёта: какие поля получает ApiError в каждом сценарии.
// Нужен запущенный API (npm start).
import { ApiError, createApiClient } from "../src/api-client.js";

const baseUrl = process.env.API_URL ?? "http://127.0.0.1:5505/api";
const client = createApiClient({ baseUrl, timeoutMs: 1000 });

const scenarios = [
  ["Задача 999", () => client.requestJson("/tasks/999")],
  ["completed=yes", () => client.requestJson("/tasks", { query: { completed: "yes" } })],
  ["/debug/error", () => client.requestJson("/debug/error")],
  ["/debug/invalid-json", () => client.requestJson("/debug/invalid-json")],
  ["/debug/text", () => client.requestJson("/debug/text")],
  ["Не запущен API", () => createApiClient({ baseUrl: "http://127.0.0.1:1/api" }).requestJson("/health")],
  ["Задержка больше тайм-аута", () => client.requestJson("/debug/delay", { query: { ms: 150 }, timeoutMs: 20 })],
  ["AbortController.abort()", () => {
    const controller = new AbortController();
    const pending = client.requestJson("/debug/delay", { query: { ms: 150 }, signal: controller.signal });
    controller.abort();
    return pending;
  }],
];

for (const [name, run] of scenarios) {
  try {
    await run();
    console.log(`${name}: ошибки нет`);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    console.log(`${name}:`, JSON.stringify({
      kind: error.kind,
      status: error.status,
      code: error.code,
      details: error.details,
      message: error.message,
    }));
  }
}
