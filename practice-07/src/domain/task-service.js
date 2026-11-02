// Чистые функции: без React, DOM, сети, случайных значений и изменения аргументов.
// Точные контракты и допустимые входы приведены в методичке.
const PRIORITIES = ['low', 'medium', 'high'];

function isPositiveSafeInteger(value) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

// Приводит значение поля категории к числу. parseInt('2x') дал бы 2,
// поэтому строка должна состоять только из цифр. Иначе возвращается null.
function parseCategoryId(raw) {
  if (typeof raw === 'number') return Number.isSafeInteger(raw) ? raw : null;
  if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) {
    const number = Number(raw.trim());
    return Number.isSafeInteger(number) ? number : null;
  }
  return null;
}

export function validateTaskDraft(draft, categories) {
  const source = draft !== null && typeof draft === 'object' ? draft : {};
  const known = Array.isArray(categories) ? categories : [];
  const errors = {};

  let title = '';
  if (typeof source.title !== 'string') {
    errors.title = 'Название должно быть строкой.';
  } else {
    title = source.title.trim();
    if (title.length < 1 || title.length > 100) {
      errors.title = 'Название должно содержать от 1 до 100 символов.';
    }
  }

  if (!PRIORITIES.includes(source.priority)) {
    errors.priority = 'Выберите приоритет: низкий, средний или высокий.';
  }

  const categoryId = parseCategoryId(source.categoryId);
  if (categoryId === null || !known.some(category => category.id === categoryId)) {
    errors.categoryId = 'Выберите существующую категорию.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, value: null, errors };
  }
  return { valid: true, value: { title, priority: source.priority, categoryId }, errors: {} };
}

export function selectTasks(tasks, filters) {
  const query = typeof filters.q === 'string' ? filters.q.trim().toLowerCase() : '';
  const completed = filters.completed ?? '';
  const priority = filters.priority ?? '';
  const categoryId = filters.categoryId ?? '';

  return tasks.filter(task => {
    if (query !== '' && !task.title.toLowerCase().includes(query)) return false;
    // Boolean('false') === true, поэтому статус сравнивается со строками явно.
    if (completed === 'true' && !task.completed) return false;
    if (completed === 'false' && task.completed) return false;
    if (priority !== '' && task.priority !== priority) return false;
    if (categoryId !== '' && String(task.categoryId) !== String(categoryId)) return false;
    return true;
  });
}

export function getTaskStats(tasks) {
  const completed = tasks.filter(task => task.completed).length;
  return { total: tasks.length, completed, active: tasks.length - completed };
}

export function addTask(tasks, value, id) {
  if (!isPositiveSafeInteger(id)) {
    throw new RangeError('id должен быть положительным целым числом.');
  }
  if (tasks.some(task => task.id === id)) {
    throw new RangeError(`Задача с id ${id} уже существует.`);
  }
  const task = {
    id,
    title: value.title,
    completed: false,
    priority: value.priority,
    categoryId: value.categoryId,
  };
  return [...tasks, task];
}

export function updateTask(tasks, id, value) {
  if (!tasks.some(task => task.id === id)) return tasks;
  return tasks.map(task => (task.id === id
    ? { ...task, title: value.title, priority: value.priority, categoryId: value.categoryId }
    : task));
}

export function toggleTask(tasks, id) {
  if (!tasks.some(task => task.id === id)) return tasks;
  return tasks.map(task => (task.id === id ? { ...task, completed: !task.completed } : task));
}

export function removeTask(tasks, id) {
  if (!tasks.some(task => task.id === id)) return tasks;
  return tasks.filter(task => task.id !== id);
}
