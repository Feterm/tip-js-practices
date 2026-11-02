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

function isTask(value) {
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

function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

// Проверяет фильтры до запроса и возвращает новый объект для query.
// Неверное значение - ошибка вызывающего кода, поэтому TypeError, а не ApiError.
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

// Общая часть для коллекций: массив data, проверка элементов, уникальность id
// и совпадение meta.total с длиной массива.
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

// client — объект, созданный createApiClient.
// Контракт результата:
// getTasks(filters) -> Promise<{ tasks, meta }>
// getTaskById(id) -> Promise<task>
// getCategories() -> Promise<category[]>
// loadInitialData(filters) -> Promise<{ tasks, categories, meta }>
export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("client должен иметь метод requestJson.");
  }

  async function getTasks(filters = {}) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { query });
    const tasks = readCollection(payload, isTask, "задачи");
    if (!isPlainObject(payload.meta.filters)) {
      throw invalidResponse("meta.filters должен быть объектом.");
    }
    return { tasks, meta: payload.meta };
  }

  async function getTaskById(id) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError("id должен быть положительным целым числом.");
    }
    const payload = await client.requestJson(`/tasks/${id}`);
    if (!isPlainObject(payload) || !isTask(payload.data)) {
      throw invalidResponse("Ответ не содержит корректную задачу.");
    }
    return payload.data;
  }

  async function getCategories() {
    const payload = await client.requestJson("/categories");
    return readCollection(payload, isCategory, "категории");
  }

  async function loadInitialData(filters = {}) {
    // Оба запроса начинаются здесь, до общего await: Promise создаётся в момент
    // вызова функции, поэтому запросы идут одновременно.
    const tasksPromise = getTasks(filters);
    const categoriesPromise = getCategories();

    const [taskResult, categories] = await Promise.all([
      tasksPromise,
      categoriesPromise,
    ]);
    return { tasks: taskResult.tasks, categories, meta: taskResult.meta };
  }

  return { getTasks, getTaskById, getCategories, loadInitialData };
}
