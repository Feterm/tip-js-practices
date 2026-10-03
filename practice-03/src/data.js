// Общий набор задач для обязательных заданий. Не менять и не подменять
// своими данными - свой набор задаётся отдельно ниже (variantTasks).
export const demoTasks = [
  { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
  { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
  { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
  { id: 10, title: "Оформить README", completed: true, priority: "medium" },
];

// Вариант тот же, что был в ПР1 - вариант 2, тема "Подготовка выступления".
export const variantNumber = 2;

// K = 1, значит выполненной считается только первая задача в списке (id 11).
export const variantTasks = [
  { id: 11, title: "Определить тему выступления", completed: true, priority: "high" },
  { id: 23, title: "Собрать тезисы доклада", completed: false, priority: "medium" },
  { id: 37, title: "Подготовить слайды презентации", completed: false, priority: "medium" },
  { id: 41, title: "Отрепетировать выступление вслух", completed: false, priority: "low" },
  { id: 58, title: "Подготовить ответы на вопросы", completed: false, priority: "low" },
  { id: 64, title: "Проверить работу оборудования", completed: false, priority: "high" },
];
