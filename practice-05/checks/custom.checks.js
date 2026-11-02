// Собственные проверки ПР5 (сверх готовых наборов). Реальный API поднимается сам.
import assert from "node:assert/strict";
import { createApiServer } from "../api/server.mjs";
import { ApiError, buildUrl, createApiClient } from "../src/api-client.js";
import { createTaskApi } from "../src/task-api.js";
import { variantFilters } from "../src/variant.js";

let passed = 0;
let failed = 0;

async function check(name, action) {
  try {
    await action();
    passed += 1;
    console.log(`OK: ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL: ${name}`);
    console.error(error.stack ?? error.message);
  }
}

async function expectApiError(action, kind) {
  let caught;
  try {
    await action();
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof ApiError, "Ожидался экземпляр ApiError");
  assert.equal(caught.kind, kind);
  return caught;
}

const server = createApiServer();
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
const client = createApiClient({ baseUrl, timeoutMs: 1000 });
const api = createTaskApi(client);

try {
  // 1. Комбинация query-параметров.
  await check("С1. буль, число и строка с пробелом и & кодируются вместе", () => {
    const url = new URL(buildUrl("http://localhost:5505/api/", "/tasks", {
      completed: true,
      priority: "high",
      categoryId: 2,
      q: "про вер&ка",
    }));
    assert.equal(url.searchParams.get("completed"), "true");
    assert.equal(url.searchParams.get("priority"), "high");
    assert.equal(url.searchParams.get("categoryId"), "2");
    assert.equal(url.searchParams.get("q"), "про вер&ка");
    assert.equal(url.pathname, "/api/tasks");
    assert.equal(url.searchParams.size, 4);
  });

  // 2. Дополнительный HTTP-сценарий.
  await check("С2. повторяющийся query-параметр даёт http 400 INVALID_QUERY", async () => {
    // Повтор параметра задаётся прямо в пути: через объект query одно имя дважды не передать.
    const error = await expectApiError(
      () => client.requestJson("/tasks?priority=low&priority=high"),
      "http",
    );
    assert.equal(error.status, 400);
    assert.equal(error.code, "INVALID_QUERY");
  });

  await check("С3. несуществующая категория даёт http 404 CATEGORY_NOT_FOUND", async () => {
    const error = await expectApiError(() => client.requestJson("/categories/999"), "http");
    assert.equal(error.status, 404);
    assert.equal(error.code, "CATEGORY_NOT_FOUND");
  });

  // 3. Граница отмены и схемы.
  await check("С4. сигнал, отменённый до вызова, даёт aborted без ответа сервера", async () => {
    const controller = new AbortController();
    controller.abort();
    await expectApiError(
      () => client.requestJson("/health", { signal: controller.signal }),
      "aborted",
    );
  });

  await check("С5. название длиной 100 принимается, 101 отклоняется схемой", async () => {
    const makeApi = (title) => createTaskApi({
      async requestJson() {
        return {
          data: [{ id: 1, title, completed: false, priority: "low", categoryId: 1 }],
          meta: { total: 1, filters: {} },
        };
      },
    });
    const ok = await makeApi("я".repeat(100)).getTasks();
    assert.equal(ok.tasks[0].title.length, 100);
    await expectApiError(() => makeApi("я".repeat(101)).getTasks(), "invalid-response");
  });

  // 4. Индивидуальный вариант (вариант 2).
  await check("С6. фильтры варианта дают ожидаемые id и meta.total", async () => {
    const result = await api.getTasks(variantFilters);
    assert.deepEqual(result.tasks.map((task) => task.id), [1, 10, 16, 25, 31]);
    assert.equal(result.meta.total, 5);
    assert.equal(result.meta.filters.completed, true);
  });
} finally {
  await new Promise((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
}

console.log(`\nИтог собственных проверок: успешно ${passed}, ошибок ${failed}.`);
if (failed > 0) process.exitCode = 1;
