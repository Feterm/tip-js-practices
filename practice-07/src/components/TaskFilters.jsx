const EMPTY_FILTERS = { q: '', completed: '', priority: '', categoryId: '' };

export default function TaskFilters({ filters, categories, onChange }) {
  // Одна функция для всех полей: меняется только поле с этим именем.
  const handleChange = event => {
    const { name, value } = event.target;
    onChange({ ...filters, [name]: value });
  };

  return (
    <section aria-label="Фильтры">
      <h2>Фильтры</h2>

      <label htmlFor="filter-q">Поиск по названию</label>
      <input id="filter-q" name="q" type="search" value={filters.q} onChange={handleChange} />

      <label htmlFor="filter-completed">Статус</label>
      <select id="filter-completed" name="completed" value={filters.completed} onChange={handleChange}>
        <option value="">Все</option>
        <option value="false">В работе</option>
        <option value="true">Выполненные</option>
      </select>

      <label htmlFor="filter-priority">Приоритет</label>
      <select id="filter-priority" name="priority" value={filters.priority} onChange={handleChange}>
        <option value="">Все</option>
        <option value="low">Низкий</option>
        <option value="medium">Средний</option>
        <option value="high">Высокий</option>
      </select>

      <label htmlFor="filter-category">Категория</label>
      <select id="filter-category" name="categoryId" value={filters.categoryId} onChange={handleChange}>
        <option value="">Все</option>
        {categories.map(category => (
          <option key={category.id} value={String(category.id)}>{category.name}</option>
        ))}
      </select>

      <div className="actions">
        <button type="button" onClick={() => onChange({ ...EMPTY_FILTERS })}>Сбросить фильтры</button>
      </div>
    </section>
  );
}
