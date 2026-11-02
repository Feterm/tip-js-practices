const log = (label) => console.log(label);

log("A: синхронный код");

setTimeout(() => {
  log("F: задача таймера");
}, 0);

Promise.resolve().then(() => {
  log("D: обработчик Promise");
});

async function demonstrateAwait() {
  log("B: начало async-функции");
  await null;
  log("E: продолжение после await");
}

demonstrateAwait();

// Мой обработчик (задание 2, п. 6): поставлен в очередь микрозадач после
// продолжения async-функции, поэтому должен выполниться после E, но до таймера F.
Promise.resolve().then(() => {
  log("G: мой обработчик Promise");
});

log("C: конец синхронного кода");

// До запуска записать прогноз порядка A–F в отчёт, затем объяснить результат.
