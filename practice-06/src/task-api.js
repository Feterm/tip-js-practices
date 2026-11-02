import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

export function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

function assertId(id) {
  if (!isPositiveSafeInteger(id)) {
    throw new TypeError("id должен быть положительным целым числом.");
  }
}

// Фильтры проверяются до запроса. Неверное значение - ошибка вызывающего кода.
function normalizeFilters(filters = {}) {
  if (!isPlainObject(filters)) {
    throw new TypeError("Фильтры должны быть обычным объектом.");
  }

  const query = {};
  for (const [name, value] of Object.entries(filters)) {
    if (!ALLOWED_FILTERS.has(name)) {
      throw new TypeError(`Неизвестный фильтр: ${name}.`);
    }
    if (value === undefined) continue;

    if (name === "completed") {
      if (typeof value !== "boolean") throw new TypeError("completed должен быть boolean.");
      query.completed = value;
    } else if (name === "priority") {
      if (!ALLOWED_PRIORITIES.has(value)) {
        throw new TypeError("priority должен быть low, medium или high.");
      }
      query.priority = value;
    } else if (name === "categoryId") {
      if (!isPositiveSafeInteger(value)) {
        throw new TypeError("categoryId должен быть положительным целым числом.");
      }
      query.categoryId = value;
    } else {
      if (typeof value !== "string") throw new TypeError("q должен быть строкой.");
      const q = value.trim();
      if (q.length > 100) throw new TypeError("q не должен быть длиннее 100 символов.");
      if (q !== "") query.q = q;
    }
  }
  return query;
}

// Массив data, проверка элементов, уникальность id и совпадение meta.total.
function readCollection(payload, isItem, label) {
  if (!isPlainObject(payload) || !Array.isArray(payload.data)) {
    throw invalidResponse(`Ответ (${label}) должен содержать массив data.`);
  }
  if (!payload.data.every(isItem)) {
    throw invalidResponse(`Ответ (${label}) содержит запись неверной формы.`);
  }
  const ids = new Set(payload.data.map((item) => item.id));
  if (ids.size !== payload.data.length) {
    throw invalidResponse(`Ответ (${label}) содержит повторяющиеся id.`);
  }
  if (!isPlainObject(payload.meta) || payload.meta.total !== payload.data.length) {
    throw invalidResponse(`meta.total (${label}) не совпадает с длиной data.`);
  }
  return payload.data;
}

function readTask(payload) {
  if (!isPlainObject(payload) || !isTask(payload.data)) {
    throw invalidResponse("Ответ не содержит корректную задачу.");
  }
  return payload.data;
}

// Методы результата:
// getTasks, getTaskById, getCategories, loadInitialData, createTask, updateTask,
// setTaskCompleted, deleteTask и resetDemoData.
// Последний аргумент каждого метода данных - { signal }.
export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("client должен иметь метод requestJson.");
  }

  async function getTasks(filters = {}, { signal } = {}) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { query, signal });
    const tasks = readCollection(payload, isTask, "задачи");
    if (!isPlainObject(payload.meta.filters)) {
      throw invalidResponse("meta.filters должен быть объектом.");
    }
    return { tasks, meta: payload.meta };
  }

  async function getTaskById(id, { signal } = {}) {
    assertId(id);
    return readTask(await client.requestJson(`/tasks/${id}`, { signal }));
  }

  async function getCategories({ signal } = {}) {
    const payload = await client.requestJson("/categories", { signal });
    return readCollection(payload, isCategory, "категории");
  }

  async function loadInitialData(filters = {}, options = {}) {
    // Оба запроса стартуют до общего await - они независимы.
    const tasksPromise = getTasks(filters, options);
    const categoriesPromise = getCategories(options);

    const [taskResult, categories] = await Promise.all([
      tasksPromise,
      categoriesPromise,
    ]);
    return { tasks: taskResult.tasks, categories, meta: taskResult.meta };
  }

  async function createTask(draft, { signal } = {}) {
    if (!isPlainObject(draft)) {
      throw new TypeError("draft должен быть объектом.");
    }
    // id и completed назначает сервер, поэтому в тело идут только три поля.
    const body = {
      title: draft.title,
      priority: draft.priority,
      categoryId: draft.categoryId,
    };
    return readTask(await client.requestJson("/tasks", { method: "POST", body, signal }));
  }

  async function updateTask(id, changes, { signal } = {}) {
    assertId(id);
    if (!isPlainObject(changes)) {
      throw new TypeError("changes должен быть объектом.");
    }
    return readTask(await client.requestJson(`/tasks/${id}`, {
      method: "PATCH",
      body: { ...changes },
      signal,
    }));
  }

  async function setTaskCompleted(id, completed, options = {}) {
    if (typeof completed !== "boolean") {
      throw new TypeError("completed должен быть boolean.");
    }
    return updateTask(id, { completed }, options);
  }

  async function deleteTask(id, { signal } = {}) {
    assertId(id);
    const result = await client.requestJson(`/tasks/${id}`, { method: "DELETE", signal });
    // Успешный DELETE - 204 без тела, клиент отдаёт null.
    if (result !== null) {
      throw invalidResponse("DELETE должен вернуть пустой ответ 204.");
    }
    return null;
  }

  async function resetDemoData({ signal } = {}) {
    const payload = await client.requestJson("/debug/reset", { method: "POST", signal });
    const data = isPlainObject(payload) ? payload.data : null;
    if (!isPlainObject(data) || data.reset !== true || !Number.isSafeInteger(data.total)) {
      throw invalidResponse("Ответ reset не подтверждает восстановление данных.");
    }
    return data;
  }

  return {
    getTasks,
    getTaskById,
    getCategories,
    loadInitialData,
    createTask,
    updateTask,
    setTaskCompleted,
    deleteTask,
    resetDemoData,
  };
}
