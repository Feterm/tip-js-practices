// Фильтр по статусу. Вход: корректный массив задач и фильтр all/pending/completed.
// Результат: новый массив, исходный порядок и объекты сохраняются.
export function getVisibleTasks(tasks, filter = "all") {
  if (filter === "pending") {
    return tasks.filter((task) => task.completed === false);
  }

  if (filter === "completed") {
    return tasks.filter((task) => task.completed === true);
  }

  // filter === "all" (и вообще любое другое значение по умолчанию) - просто копия
  return tasks.slice();
}
