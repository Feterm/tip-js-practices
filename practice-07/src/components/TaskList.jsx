import TaskItem from './TaskItem.jsx';

export default function TaskList({ tasks, categories, onToggle, onEdit, onDelete }) {
  const categoryNames = new Map(categories.map(category => [category.id, category.name]));

  return (
    <section aria-label="Список задач">
      <h2>Задачи</h2>
      <p>Найдено: <strong>{tasks.length}</strong></p>
      {tasks.length === 0 ? (
        <p>Задач по выбранным условиям нет.</p>
      ) : (
        <ul>
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              categoryName={categoryNames.get(task.categoryId) ?? 'Неизвестно'}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
