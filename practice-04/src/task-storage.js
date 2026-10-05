export const STORAGE_VERSION = 1;

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Все функции принимают объект storage явно (а не лезут в window.localStorage
// напрямую) - так модуль можно проверить без браузера, подсунув ему имитацию.

// Проверяет весь массив целиком: либо он весь правильный, либо отклоняем
// весь список. Никакой починки "наполовину хороших" записей тут нет.
export function isValidTaskList(value) {
  if (!Array.isArray(value)) return false;

  const seenIds = new Set();

  for (const item of value) {
    if (item === null || typeof item !== "object") return false;

    const { id, title, completed, priority } = item;

    if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) return false;
    if (seenIds.has(id)) return false; // id должны быть уникальны
    seenIds.add(id);

    if (typeof title !== "string") return false;
    const trimmedLength = title.trim().length;
    if (trimmedLength === 0 || trimmedLength > 100) return false;

    if (typeof completed !== "boolean") return false;
    if (!ALLOWED_PRIORITIES.has(priority)) return false;
  }

  return true;
}

export function loadTasks(storage, key, fallbackTasks) {
  // независимая копия fallback - на случай отсутствия записи или любой ошибки ниже
  const fallbackCopy = fallbackTasks.map((task) => ({ ...task }));

  try {
    const raw = storage.getItem(key);

    if (raw === null) {
      return { ok: true, source: "initial", tasks: fallbackCopy };
    }

    const parsed = JSON.parse(raw);

    const schemaOk =
      parsed !== null &&
      typeof parsed === "object" &&
      parsed.version === STORAGE_VERSION &&
      isValidTaskList(parsed.tasks);

    if (!schemaOk) {
      return {
        ok: false,
        source: "fallback",
        tasks: fallbackCopy,
        error: "Сохранённые данные повреждены или имеют неизвестную версию, использован исходный набор.",
      };
    }

    return {
      ok: true,
      source: "storage",
      tasks: parsed.tasks.map((task) => ({ ...task })),
    };
  } catch (error) {
    // сюда попадают и ошибка JSON.parse, и исключение самого storage.getItem
    return {
      ok: false,
      source: "fallback",
      tasks: fallbackCopy,
      error: `Не удалось прочитать сохранённые данные: ${error.message}`,
    };
  }
}

export function saveTasks(storage, key, tasks) {
  if (!isValidTaskList(tasks)) {
    return { ok: false, error: "Список задач не прошёл проверку схемы, запись отменена." };
  }

  try {
    storage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, tasks }));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось сохранить данные: ${error.message}` };
  }
}

export function removeSavedTasks(storage, key) {
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось удалить сохранённые данные: ${error.message}` };
  }
}
