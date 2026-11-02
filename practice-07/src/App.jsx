import { useState } from 'react';
import { tasks as initialTasks, categories } from './data.js';
import { createInitialFilters } from './variant.js';
import {
  addTask, getTaskStats, removeTask, selectTasks, toggleTask, updateTask,
} from './domain/task-service.js';
import TaskForm from './components/TaskForm.jsx';
import TaskFilters from './components/TaskFilters.jsx';
import TaskList from './components/TaskList.jsx';
import TaskStats from './components/TaskStats.jsx';

// Учебный локальный id: максимум полного массива плюс 1 (для пустого - 1).
function nextTaskId(tasks) {
  return tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
}

export default function App() {
  const [tasks, setTasks] = useState(() => initialTasks.map(task => ({ ...task })));
  const [filters, setFilters] = useState(createInitialFilters);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState('');

  // Производные данные считаются при каждом рендере, отдельного состояния нет.
  const visibleTasks = selectTasks(tasks, filters);
  const stats = getTaskStats(tasks);
  const editingTask = editingId === null
    ? null
    : tasks.find(task => task.id === editingId) ?? null;

  const handleToggle = id => {
    const task = tasks.find(item => item.id === id);
    setTasks(previous => toggleTask(previous, id));
    if (task) {
      setNotice(task.completed
        ? `Задача «${task.title}» возвращена в работу.`
        : `Задача «${task.title}» выполнена.`);
    }
  };

  const handleDelete = id => {
    // Подтверждение выполняется до setTasks, а не внутри функции обновления.
    if (!window.confirm('Удалить задачу?')) return;
    setTasks(previous => removeTask(previous, id));
    if (editingId === id) setEditingId(null);
    setNotice('Задача удалена.');
  };

  // Возвращает true, если изменение принято, и false, если сохранить не удалось.
  const handleSave = value => {
    if (editingId === null) {
      setTasks(previous => addTask(previous, value, nextTaskId(previous)));
      setNotice('Задача добавлена.');
      return true;
    }
    if (!editingTask) return false; // редактируемая задача уже отсутствует
    setTasks(previous => updateTask(previous, editingId, value));
    setEditingId(null);
    setNotice('Изменения сохранены.');
    return true;
  };

  return (
    <main>
      <h1>Задачи на React</h1>
      <p>ПР7: данные в памяти. Обновление страницы восстанавливает исходный набор.</p>
      <p role="status">{notice}</p>
      <TaskStats stats={stats} />
      <TaskFilters filters={filters} categories={categories} onChange={setFilters} />
      <TaskForm
        key={editingId ?? 'new'}
        categories={categories}
        initialTask={editingTask}
        onSave={handleSave}
        onCancel={() => setEditingId(null)}
      />
      <TaskList
        tasks={visibleTasks}
        categories={categories}
        onToggle={handleToggle}
        onEdit={setEditingId}
        onDelete={handleDelete}
      />
    </main>
  );
}
