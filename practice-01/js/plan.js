"use strict";

const totalTasks = 15;
const completedTasks = 0;
const dailyLimit = 4;

if (typeof totalTasks !== "number" || typeof completedTasks !== "number") {
  console.log("Ошибка: количество задач должно быть числом, а не строкой или другим типом");
} else if (!Number.isFinite(totalTasks) || !Number.isFinite(completedTasks)) {
  console.log("Ошибка: недопустимое числовое значение количества задач (NaN или бесконечность)");
} else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
  console.log("Ошибка: количество задач должно быть целым, дробное значение недопустимо");
} else if (totalTasks < 0 || completedTasks < 0) {
  console.log("Ошибка: количество задач не может быть отрицательным");
} else if (totalTasks > 1000) {
  console.log("Ошибка: превышена верхняя граница, всего задач не может быть больше 1000");
} else if (completedTasks > totalTasks) {
  console.log("Ошибка: некорректное число выполненных задач, их больше, чем существует");
} else if (typeof dailyLimit !== "number") {
  console.log("Ошибка: дневная норма должна быть числом, а не строкой или другим типом");
} else if (!Number.isFinite(dailyLimit)) {
  console.log("Ошибка: недопустимое числовое значение дневной нормы (NaN или бесконечность)");
} else if (!Number.isInteger(dailyLimit)) {
  console.log("Ошибка: дробной дневной нормы быть не должно");
} else if (dailyLimit < 1 || dailyLimit > 1000) {
  console.log("Ошибка: дневная норма должна быть целым числом от 1 до 1000");
} else {
  let remainingTasks = totalTasks - completedTasks;
  let day = 0;

  console.log(`Осталось задач: ${remainingTasks}`);

  if (remainingTasks === 0) {
    console.log("Все задачи уже выполнены");
  }

  while (remainingTasks > 0) {
    day += 1;
    const doneToday = Math.min(dailyLimit, remainingTasks);
    remainingTasks -= doneToday;
    console.log(`День ${day}: выполнено ${doneToday}, осталось ${remainingTasks}`);
  }

  console.log(`Потребуется дней: ${day}`);
}