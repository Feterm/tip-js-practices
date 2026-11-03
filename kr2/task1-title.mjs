// КР2, задание 1: проверка названия в validateTaskDraft (ПР4).
import { validateTaskDraft } from "../practice-04/src/form-validation.js";

const tasks = [];

const withSpaces = validateTaskDraft(
  { id: "20", title: "  Изучить localStorage  ", priority: "high" },
  tasks,
);
console.log('title = "  Изучить localStorage  "');
console.log(withSpaces);

const onlySpace = validateTaskDraft(
  { id: "20", title: " ", priority: "high" },
  tasks,
);
console.log('title = " "');
console.log(onlySpace);
