const PRIORITY_LABELS = Object.freeze({
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
});

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function actionButton(action, label) {
  const button = element("button");
  button.type = "button";
  button.dataset.action = action;
  button.append(element("span", "action-label", label));
  return button;
}

export function createTaskElement(task, category) {
  const item = element("li", `task-card${task.completed ? " is-completed" : ""}`);
  item.dataset.taskId = String(task.id);

  // Все строки с сервера попадают в DOM только через textContent.
  const title = element("h3", "task-title", task.title);

  const meta = element("div", "task-meta");
  const categoryLabel = element("span", "", "Категория: ");
  categoryLabel.append(element("span", "task-category", category?.name ?? "Неизвестно"));
  meta.append(
    element("span", "task-status", task.completed ? "Выполнена" : "В работе"),
    element("span", "task-priority", `Приоритет: ${PRIORITY_LABELS[task.priority] ?? task.priority}`),
    categoryLabel,
  );

  const actions = element("div", "task-actions");
  actions.append(
    actionButton("toggle", task.completed ? "Вернуть в работу" : "Завершить"),
    actionButton("edit", "Изменить"),
    actionButton("delete", "Удалить"),
  );

  item.append(title, meta, actions);
  return item;
}

export function renderTaskList(list, tasks, categories) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  // replaceChildren удаляет старые карточки, поэтому они не накапливаются.
  list.replaceChildren(...tasks.map((task) => createTaskElement(task, byId.get(task.categoryId))));
}
