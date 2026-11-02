const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Возвращает { valid, value, errors }.
// value содержит нормализованные title, priority и числовой categoryId.
export function validateTaskDraft(draft, categories) {
  const errors = {};
  const source = draft !== null && typeof draft === "object" ? draft : {};
  const known = Array.isArray(categories) ? categories : [];

  // Название: строка, после trim от 1 до 100 символов.
  let title = null;
  if (typeof source.title !== "string") {
    errors.title = "Название должно быть строкой.";
  } else {
    const trimmed = source.title.trim();
    if (trimmed.length < 1 || trimmed.length > 100) {
      errors.title = "Название должно содержать от 1 до 100 символов.";
    } else {
      title = trimmed;
    }
  }

  // Приоритет: одно из трёх значений.
  const priority = source.priority;
  if (!ALLOWED_PRIORITIES.has(priority)) {
    errors.priority = "Выберите приоритет: низкий, средний или высокий.";
  }

  // Категория: значение select приходит строкой. Number("2x") даёт NaN,
  // а Number("") даёт 0, поэтому пустую строку и нецелые значения отсекаем явно.
  let categoryId = null;
  const raw = source.categoryId;
  if (typeof raw === "number" || (typeof raw === "string" && /^\d+$/.test(raw.trim()))) {
    const number = Number(raw);
    if (Number.isSafeInteger(number) && known.some((category) => category.id === number)) {
      categoryId = number;
    }
  }
  if (categoryId === null) {
    errors.categoryId = "Выберите существующую категорию.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, value: null, errors };
  }
  return { valid: true, value: { title, priority, categoryId }, errors: {} };
}
