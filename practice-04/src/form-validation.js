const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Чистая проверка данных формы. Сама в DOM не лезет и ничего не показывает -
// этим занимается main.js. Тут только данные на входе и объект на выходе.
// draft: { id, title, priority }; editingId: null либо id редактируемой задачи.
export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  let id;
  let title;
  const priority = draft.priority;

  // --- id ---
  if (editingId === null) {
    // режим создания - id берём из черновика (формы) и проверяем на уникальность
    const numericId = Number(draft.id);
    if (typeof draft.id !== "number" && typeof draft.id !== "string") {
      errors.id = "id должен быть числом";
    } else if (draft.id === "" || !Number.isSafeInteger(numericId) || numericId <= 0) {
      errors.id = "id должен быть положительным целым числом";
    } else if (tasks.some((task) => task.id === numericId)) {
      errors.id = "задача с таким id уже существует";
    } else {
      id = numericId;
    }
  } else {
    // режим редактирования - id с формы вообще не используется (поле заблокировано),
    // источник правды - editingId
    const existing = tasks.find((task) => task.id === editingId);
    if (!existing) {
      errors.id = "редактируемая задача не найдена";
    } else {
      id = editingId;
    }
  }

  // --- title ---
  if (typeof draft.title !== "string") {
    errors.title = "название должно быть строкой";
  } else {
    const trimmed = draft.title.trim();
    if (trimmed.length === 0 || trimmed.length > 100) {
      errors.title = "длина названия после удаления пробелов должна быть от 1 до 100";
    } else {
      title = trimmed;
    }
  }

  // --- priority ---
  if (!ALLOWED_PRIORITIES.has(priority)) {
    errors.priority = "приоритет должен быть low, medium или high";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: { id, title, priority } };
}
