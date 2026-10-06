
import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";
 

function printStats(label, tasks) {
  const { total, completed, pending, progress } = getTaskStats(tasks);
  console.log(`${label} -> всего: ${total}, выполнено: ${completed}, осталось: ${pending}`);
  if (total === 0) {
    console.log("Задач пока нет");
  } else {
    console.log(`Прогресс: ${progress.toFixed(1)}%`);
  }
}
 
console.log("Общий сценарий");
 
console.log("Исходные задачи:", demoTasks);
console.log("Названия:", getTaskTitles(demoTasks));
console.log("Невыполненные:", getPendingTasks(demoTasks));
printStats("Сводка исходного набора", demoTasks);
 
let currentTasks = demoTasks;
 

const addResult = addTask(currentTasks, 20, "Добавить проверку", "high");
if (addResult.ok) {
  currentTasks = addResult.tasks;
  printStats("После добавления id 20", currentTasks);
} else {
  console.error("Ошибка:", addResult.error);
}
 

const doneResult = setTaskCompleted(currentTasks, 4, true);
if (doneResult.ok) {
  currentTasks = doneResult.tasks;
  printStats("После выполнения id 4", currentTasks);
} else {
  console.error("Ошибка:", doneResult.error);
}
 

const renameResult = renameTask(currentTasks, 10, "Подготовить инструкцию запуска");
if (renameResult.ok) {
  currentTasks = renameResult.tasks;
  printStats("После переименования id 10", currentTasks);
} else {
  console.error("Ошибка:", renameResult.error);
}
 

const removeResult = removeTask(currentTasks, 7);
if (removeResult.ok) {
  currentTasks = removeResult.tasks;
  printStats("После удаления id 7", currentTasks);
} else {
  console.error("Ошибка:", removeResult.error);
}
 

console.log("Пробуем добавить id 20 ещё раз (должна быть ошибка):");
const duplicateResult = addTask(currentTasks, 20, "Ещё раз", "low");
if (!duplicateResult.ok) {
  console.log("Ошибка:", duplicateResult.error);
} else {
  currentTasks = duplicateResult.tasks;
}
 
console.log("Итоговый список:", currentTasks);
console.log("Итоговые id:", currentTasks.map((task) => task.id));
console.log("Проверка, что demoTasks не тронут:", demoTasks);
 
console.log("\n===== Индивидуальный вариант", variantNumber, "=====");
 
console.log("Исходные задачи варианта:", variantTasks);
printStats("Сводка исходного набора варианта", variantTasks);
 
let currentVariant = variantTasks;
 
const addVariant = addTask(currentVariant, 80, "Проверить оборудование перед выступлением", "medium");
if (addVariant.ok) {
  currentVariant = addVariant.tasks;
  printStats("После добавления id 80", currentVariant);
}
 
const doneVariant = setTaskCompleted(currentVariant, 11, true);
if (doneVariant.ok) {
  currentVariant = doneVariant.tasks;
  printStats("После (повторного) выполнения id 11", currentVariant);
}
 
const renameVariant = renameTask(currentVariant, 23, "Собрать и оформить тезисы доклада");
if (renameVariant.ok) {
  currentVariant = renameVariant.tasks;
  console.log("id 23 теперь:", findTaskById(currentVariant, 23));
}
 
const removeVariant = removeTask(currentVariant, 37);
if (removeVariant.ok) {
  currentVariant = removeVariant.tasks;
  printStats("После удаления id 37", currentVariant);
}
 
console.log("Пробуем добавить id 80 ещё раз (должна быть ошибка):");
const duplicateVariant = addTask(currentVariant, 80, "Дубликат", "low");
if (!duplicateVariant.ok) {
  console.log("Ошибка:", duplicateVariant.error);
} else {
  currentVariant = duplicateVariant.tasks;
}
 
console.log("Итоговый список варианта:", currentVariant);
console.log("Итоговые id варианта:", currentVariant.map((task) => task.id));
console.log("Проверка, что variantTasks не тронут:", variantTasks);