const PRIORITY_LABELS = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };

export default function TaskItem({ task, categoryName, onToggle, onEdit, onDelete }) {
  return (
    <li>
      <strong>{task.title}</strong>
      <div>
        {task.completed ? 'Выполнена' : 'В работе'}
        {' · '}Приоритет: {PRIORITY_LABELS[task.priority]}
        {' · '}Категория: {categoryName}
      </div>
      <div className="actions">
        <button type="button" onClick={() => onToggle(task.id)}>
          {task.completed ? 'Вернуть в работу' : 'Завершить'}
        </button>
        <button type="button" aria-label={`Редактировать: ${task.title}`} onClick={() => onEdit(task.id)}>
          Редактировать
        </button>
        <button type="button" aria-label={`Удалить: ${task.title}`} onClick={() => onDelete(task.id)}>
          Удалить
        </button>
      </div>
    </li>
  );
}
