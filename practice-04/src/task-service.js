// Тут вся логика работы со списком задач. Функции ничего не выводят
// и не хранят список у себя - им всегда передают tasks аргументом.

const PRIORITIES = ["low", "medium", "high"];

// id должен быть целым положительным числом и влезать в безопасный диапазон
function idIsOk(id) {
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0;
}

// проверяем и одновременно чистим название - используется и в create, и в rename, и в update
function checkTitle(title) {
  if (typeof title !== "string") {
    return { ok: false, error: "title должен быть строкой" };
  }

  const trimmed = title.trim();
  if (trimmed.length === 0 || trimmed.length > 100) {
    return { ok: false, error: "длина title после trim должна быть от 1 до 100" };
  }

  return { ok: true, title: trimmed };
}

// ---------- Задание 2 (ПР2) ----------

export function createTask(id, title, priority = "medium") {
  if (!idIsOk(id)) {
    return { ok: false, error: "некорректный id" };
  }

  const titleCheck = checkTitle(title);
  if (!titleCheck.ok) {
    return titleCheck;
  }

  if (!PRIORITIES.includes(priority)) {
    return { ok: false, error: "приоритет должен быть low, medium или high" };
  }

  return {
    ok: true,
    task: {
      id,
      title: titleCheck.title,
      completed: false,
      priority,
    },
  };
}

// ---------- Задание 3 (ПР2) ----------

export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => task.completed === false);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;
  const progress = total === 0 ? 0 : (completed / total) * 100;

  return { total, completed, pending, progress };
}

// ---------- Задание 4 (ПР2) ----------

export function addTask(tasks, id, title, priority = "medium") {
  const created = createTask(id, title, priority);
  if (!created.ok) {
    return created;
  }

  const exists = tasks.some((task) => task.id === created.task.id);
  if (exists) {
    return { ok: false, error: "задача с таким id уже есть" };
  }

  return { ok: true, tasks: [...tasks, created.task] };
}

export function setTaskCompleted(tasks, id, completed) {
  if (!idIsOk(id)) {
    return { ok: false, error: "некорректный id" };
  }

  if (typeof completed !== "boolean") {
    return { ok: false, error: "completed должен быть true или false" };
  }

  const exists = tasks.some((task) => task.id === id);
  if (!exists) {
    return { ok: false, error: "задача не найдена" };
  }

  const newTasks = tasks.map((task) =>
    task.id === id ? { ...task, completed } : task
  );

  return { ok: true, tasks: newTasks };
}

export function renameTask(tasks, id, title) {
  if (!idIsOk(id)) {
    return { ok: false, error: "некорректный id" };
  }

  const titleCheck = checkTitle(title);
  if (!titleCheck.ok) {
    return titleCheck;
  }

  const exists = tasks.some((task) => task.id === id);
  if (!exists) {
    return { ok: false, error: "задача не найдена" };
  }

  const newTasks = tasks.map((task) =>
    task.id === id ? { ...task, title: titleCheck.title } : task
  );

  return { ok: true, tasks: newTasks };
}

export function removeTask(tasks, id) {
  if (!idIsOk(id)) {
    return { ok: false, error: "некорректный id" };
  }

  const exists = tasks.some((task) => task.id === id);
  if (!exists) {
    return { ok: false, error: "задача не найдена" };
  }

  return { ok: true, tasks: tasks.filter((task) => task.id !== id) };
}

// ---------- ПР4: редактирование через форму ----------
// В отличие от rename, тут меняются сразу два поля - title и priority.
// completed трогать нельзя, иначе при сохранении формы редактирования
// выполненная задача снова станет невыполненной.
export function updateTask(tasks, id, title, priority) {
  if (!idIsOk(id)) {
    return { ok: false, error: "некорректный id" };
  }

  const existing = tasks.find((task) => task.id === id);
  if (!existing) {
    return { ok: false, error: "задача не найдена" };
  }

  const titleCheck = checkTitle(title);
  if (!titleCheck.ok) {
    return titleCheck;
  }

  if (!PRIORITIES.includes(priority)) {
    return { ok: false, error: "приоритет должен быть low, medium или high" };
  }

  const newTasks = tasks.map((task) =>
    task.id === id
      ? { ...task, title: titleCheck.title, priority } // completed не трогаем - берётся из task через spread
      : task
  );

  return { ok: true, tasks: newTasks };
}
