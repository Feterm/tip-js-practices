// Временный эксперимент для отчёта: два независимых запроса с задержкой 300 мс.
// Последовательные await против Promise.all. В src/ эти задержки не используются.
import { createApiClient } from "../src/api-client.js";

const baseUrl = process.env.API_URL ?? "http://127.0.0.1:5505/api";
const client = createApiClient({ baseUrl, timeoutMs: 2000 });
const delay = { query: { ms: 300 } };

async function sequential() {
  await client.requestJson("/debug/delay", delay);
  await client.requestJson("/debug/delay", delay);
}

async function together() {
  // Оба Promise создаются до await, поэтому запросы стартуют одновременно.
  const first = client.requestJson("/debug/delay", delay);
  const second = client.requestJson("/debug/delay", delay);
  await Promise.all([first, second]);
}

async function measure(name, action) {
  const startedAt = performance.now();
  await action();
  console.log(`${name}: ${(performance.now() - startedAt).toFixed(0)} мс`);
}

try {
  for (let run = 1; run <= 3; run += 1) {
    console.log(`Запуск ${run}`);
    await measure("  два последовательных await", sequential);
    await measure("  Promise.all", together);
  }
} catch (error) {
  console.error("Эксперимент не выполнен:", error.message);
  process.exitCode = 1;
}
