import { useState } from 'react';
import { validateTaskDraft } from '../domain/task-service.js';

function createDraft(initialTask, categories) {
  if (initialTask) {
    return {
      title: initialTask.title,
      priority: initialTask.priority,
      // Значение select - строка, поэтому id категории переводится в строку.
      categoryId: String(initialTask.categoryId),
    };
  }
  return { title: '', priority: 'medium', categoryId: String(categories[0]?.id ?? '') };
}

export default function TaskForm({ categories, initialTask = null, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => createDraft(initialTask, categories));
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const editing = initialTask !== null;

  const handleChange = event => {
    const { name, value } = event.target;
    setDraft(previous => ({ ...previous, [name]: value }));
  };

  const handleSubmit = event => {
    event.preventDefault();
    const result = validateTaskDraft(draft, categories);
    setErrors(result.errors);
    if (!result.valid) return; // введённые значения остаются в draft

    // onSave вызывается вне функций обновления состояния.
    const saved = onSave(result.value);
    if (saved === true) {
      setSaveError('');
      // После создания форма очищается. После редактирования App сменит key.
      if (!editing) setDraft(createDraft(null, categories));
    } else {
      setSaveError('Не удалось сохранить задачу. Возможно, она уже удалена.');
    }
  };

  return (
    <section aria-label="Форма задачи">
      <h2>{editing ? 'Редактирование задачи' : 'Новая задача'}</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="task-title">Название</label>
        <input
          id="task-title"
          name="title"
          type="text"
          value={draft.title}
          onChange={handleChange}
          aria-invalid={errors.title ? 'true' : undefined}
          aria-describedby={errors.title ? 'task-title-error' : undefined}
        />
        {errors.title && <p id="task-title-error" className="error">{errors.title}</p>}

        <label htmlFor="task-priority">Приоритет</label>
        <select
          id="task-priority"
          name="priority"
          value={draft.priority}
          onChange={handleChange}
          aria-invalid={errors.priority ? 'true' : undefined}
          aria-describedby={errors.priority ? 'task-priority-error' : undefined}
        >
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>
        {errors.priority && <p id="task-priority-error" className="error">{errors.priority}</p>}

        <label htmlFor="task-category">Категория</label>
        <select
          id="task-category"
          name="categoryId"
          value={draft.categoryId}
          onChange={handleChange}
          aria-invalid={errors.categoryId ? 'true' : undefined}
          aria-describedby={errors.categoryId ? 'task-category-error' : undefined}
        >
          {categories.map(category => (
            <option key={category.id} value={String(category.id)}>{category.name}</option>
          ))}
        </select>
        {errors.categoryId && <p id="task-category-error" className="error">{errors.categoryId}</p>}

        {saveError && <p role="alert">{saveError}</p>}

        <div className="actions">
          <button type="submit">{editing ? 'Сохранить изменения' : 'Добавить задачу'}</button>
          {editing && <button type="button" onClick={onCancel}>Отменить</button>}
        </div>
      </form>
    </section>
  );
}
