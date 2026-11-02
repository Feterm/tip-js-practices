import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}

const API_METHODS = [
  "loadInitialData", "getTasks", "createTask", "updateTask",
  "setTaskCompleted", "deleteTask", "resetDemoData",
];
const VIEW_METHODS = [
  "setListState", "setTasks", "setCategories", "setTotal",
  "setFormTask", "showFormErrors", "setMutationPending", "notify",
];

function requireMethods(target, names, label) {
  if (!target || typeof target !== "object") {
    throw new TypeError(`${label} должен быть объектом.`);
  }
  for (const name of names) {
    if (typeof target[name] !== "function") {
      throw new TypeError(`${label}.${name} должен быть функцией.`);
    }
  }
}

// view — адаптер из dom-app.js. Контроллер не должен обращаться к document.
// Обязательные методы результата:
// start, applyFilters, refresh, submit, beginEdit, cancelEdit,
// toggleTask, deleteTask, resetData и destroy.
export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  requireMethods(api, API_METHODS, "api");
  requireMethods(view, VIEW_METHODS, "view");
  if (typeof validateDraft !== "function") {
    throw new TypeError("validateDraft должен быть функцией.");
  }

  // Снимок последнего ответа сервера; источник данных - API.
  let tasks = [];
  let categories = [];
  let categoriesLoaded = false;
  let filters = {};
  let editingId = null;

  let activeLoad = null; // AbortController текущей загрузки
  let loadSequence = 0; // номер последней загрузки
  let mutationPending = false;

  // Загрузка списка. До получения категорий нужен loadInitialData,
  // после этого достаточно getTasks с текущими фильтрами.
  async function loadCurrentTasks() {
    activeLoad?.abort();
    const controller = new AbortController();
    activeLoad = controller;
    loadSequence += 1;
    const sequence = loadSequence;
    const options = { signal: controller.signal };

    view.setListState("loading");
    try {
      let result;
      if (categoriesLoaded) {
        result = await api.getTasks({ ...filters }, options);
      } else {
        result = await api.loadInitialData({ ...filters }, options);
      }

      // Устаревший ответ нельзя применять, даже если он всё же дошёл.
      if (sequence !== loadSequence) return;

      tasks = result.tasks;
      if (result.categories) {
        categories = result.categories;
        categoriesLoaded = true;
        view.setCategories(categories);
      }
      view.setTasks(tasks, categories);
      view.setTotal(tasks.length);
      view.setListState(tasks.length > 0 ? "ready" : "empty");
    } catch (error) {
      if (sequence !== loadSequence) return;
      // Отмена - обычное управление потоком, пользователю её не показываем.
      if (error instanceof ApiError && error.kind === "aborted") return;
      view.setListState("error", messageForError(error));
    }
  }

  // Общая схема изменения: блокировка, запрос, сообщение, повторный GET, разблокировка.
  async function runMutation(action, successMessage, onSuccess) {
    if (mutationPending) return false;
    mutationPending = true;
    view.setMutationPending(true);
    try {
      await action();
      onSuccess?.();
      view.notify(successMessage, "success");
      await loadCurrentTasks();
      return true;
    } catch (error) {
      view.notify(messageForError(error), "error");
      return false;
    } finally {
      mutationPending = false;
      view.setMutationPending(false);
    }
  }

  function leaveEditMode() {
    editingId = null;
    view.setFormTask(null);
    view.showFormErrors({});
  }

  return {
    start(initialFilters = {}) {
      filters = { ...initialFilters };
      return loadCurrentTasks();
    },

    applyFilters(nextFilters = {}) {
      filters = { ...nextFilters };
      return loadCurrentTasks();
    },

    refresh() {
      return loadCurrentTasks();
    },

    async submit(draft) {
      const result = validateDraft(draft, categories);
      if (!result.valid) {
        view.showFormErrors(result.errors);
        return false;
      }
      view.showFormErrors({});

      if (editingId === null) {
        return runMutation(
          () => api.createTask(result.value),
          "Задача добавлена.",
          leaveEditMode,
        );
      }
      const id = editingId;
      return runMutation(
        () => api.updateTask(id, result.value),
        "Изменения сохранены.",
        leaveEditMode,
      );
    },

    beginEdit(id) {
      const task = tasks.find((item) => item.id === id);
      if (!task) {
        view.notify("Задачи нет в текущем списке. Обновите список.", "error");
        return;
      }
      editingId = id;
      view.showFormErrors({});
      view.setFormTask(task);
    },

    cancelEdit() {
      leaveEditMode();
    },

    async toggleTask(id) {
      const task = tasks.find((item) => item.id === id);
      if (!task) {
        view.notify("Задачи нет в текущем списке. Обновите список.", "error");
        return false;
      }
      return runMutation(
        () => api.setTaskCompleted(id, !task.completed),
        task.completed ? "Задача возвращена в работу." : "Задача завершена.",
      );
    },

    async deleteTask(id) {
      return runMutation(
        () => api.deleteTask(id),
        "Задача удалена.",
        () => {
          if (editingId === id) leaveEditMode();
        },
      );
    },

    async resetData() {
      return runMutation(
        () => api.resetDemoData(),
        "Учебные данные восстановлены.",
        leaveEditMode,
      );
    },

    destroy() {
      activeLoad?.abort();
      // Номер увеличивается, чтобы поздний ответ не изменил интерфейс.
      loadSequence += 1;
    },
  };
}
