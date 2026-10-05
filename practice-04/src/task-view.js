import { getTaskStats } from "./task-service.js";

// словари для перевода значений модели в подписи на экране
const PRIORITY_LABELS = { low: "Низкий", medium: "Средний", high: "Высокий" };

// Здесь создаётся DOM, но не изменяется состояние приложения.
// Контракт карточки, селекторы и тексты описаны в методичке.
export function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-card";
  li.dataset.taskId = String(task.id);
  if (task.completed) {
    li.classList.add("is-completed");
  }

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title; // textContent, а не innerHTML - название не должно стать разметкой

  const status = document.createElement("span");
  status.className = "task-status";
  status.textContent = task.completed ? "Выполнена" : "В работе";

  const priority = document.createElement("span");
  priority.className = "task-priority";
  priority.textContent = PRIORITY_LABELS[task.priority] ?? task.priority;

  const actions = document.createElement("div");
  actions.className = "task-actions";

  function makeButton(action, labelText, extra) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = action;
    if (extra) extra(button);
    const label = document.createElement("span");
    label.className = "action-label";
    label.textContent = labelText;
    button.append(label);
    return button;
  }

  const toggleButton = makeButton("toggle", "Выполнена", (btn) => {
    btn.setAttribute("aria-pressed", task.completed ? "true" : "false");
  });
  const editButton = makeButton("edit", "Изменить");
  const deleteButton = makeButton("delete", "Удалить");

  actions.append(toggleButton, editButton, deleteButton);
  li.append(title, status, priority, actions);

  return li;
}

export function renderTaskList(listElement, tasks) {
  // ul сам остаётся на месте - меняются только его дети, обработчик на ul не слетает
  const cards = tasks.map((task) => createTaskElement(task));
  listElement.replaceChildren(...cards);
}

export function renderSummary(summaryElement, tasks, visibleCount) {
  const stats = getTaskStats(tasks);

  summaryElement.querySelector('[data-stat="total"]').textContent = String(stats.total);
  summaryElement.querySelector('[data-stat="completed"]').textContent = String(stats.completed);
  summaryElement.querySelector('[data-stat="pending"]').textContent = String(stats.pending);
  summaryElement.querySelector('[data-stat="progress"]').textContent = `${stats.progress.toFixed(1)}%`;
  summaryElement.querySelector('[data-stat="visible"]').textContent = String(visibleCount);
}

export function renderEmptyState(messageElement, total, visibleCount) {
  if (visibleCount > 0) {
    messageElement.textContent = "";
    messageElement.hidden = true;
    return;
  }

  if (total === 0) {
    messageElement.textContent = "Список задач пуст.";
  } else {
    messageElement.textContent = "Нет задач по выбранному фильтру.";
  }
  messageElement.hidden = false;
}
