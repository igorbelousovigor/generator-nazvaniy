// Здесь можно менять оба списка слов.
const nouns = ["река", "история", "путь"];
const additions = ["времени", "истории", "памяти"];

const button = document.querySelector("#generate");
const result = document.querySelector("#result");
const copyButton = document.querySelector("#copy");
const reels = {
  noun: document.querySelector("#noun-reel"),
  addition: document.querySelector("#addition-reel"),
};

let nounIndex = 0;
let additionIndex = 0;
let spinning = false;
let timers = [];

function pickIndex(length, previous) {
  if (length < 2) return 0;
  let next = previous;
  while (next === previous) next = Math.floor(Math.random() * length);
  return next;
}

function renderReel(reel, words, index) {
  reel.querySelector(".before").textContent = words[(index - 1 + words.length) % words.length];
  reel.querySelector(".after").textContent = words[(index + 1) % words.length];
  const active = reel.querySelector(".active-word");
  active.textContent = words[index];
  active.classList.remove("drop");
  void active.offsetWidth;
  active.classList.add("drop");
}

function updateResult() {
  result.textContent = `${nouns[nounIndex]} ${additions[additionIndex]}`;
}

function spinReel(reel, words, duration, getIndex, setIndex) {
  const start = performance.now();
  reel.classList.add("is-spinning");

  function step() {
    const progress = Math.min((performance.now() - start) / duration, 1);
    const next = pickIndex(words.length, getIndex());
    setIndex(next);
    renderReel(reel, words, next);
    updateResult();

    if (progress < 1) {
      timers.push(setTimeout(step, 52 + Math.pow(progress, 3) * 230));
    } else {
      reel.classList.remove("is-spinning");
    }
  }

  step();
}

function generate() {
  if (spinning) return;
  timers.forEach(clearTimeout);
  timers = [];
  spinning = true;
  button.disabled = true;
  button.querySelector("span").textContent = "ищем название";

  spinReel(reels.noun, nouns, 1050, () => nounIndex, value => { nounIndex = value; });
  spinReel(reels.addition, additions, 1320, () => additionIndex, value => { additionIndex = value; });

  timers.push(setTimeout(() => {
    spinning = false;
    button.disabled = false;
    button.querySelector("span").textContent = "сгенерировать название";
  }, 1580));
}

button.addEventListener("click", generate);

copyButton.addEventListener("click", async () => {
  const name = result.textContent.trim();
  try {
    await navigator.clipboard.writeText(name);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = name;
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }

  copyButton.classList.add("is-copied");
  copyButton.querySelector(".copy-status").textContent = "скопировано";
  copyButton.setAttribute("aria-label", "Название скопировано");
  setTimeout(() => {
    copyButton.classList.remove("is-copied");
    copyButton.querySelector(".copy-status").textContent = "копировать";
    copyButton.setAttribute("aria-label", "Копировать название");
  }, 1400);
});

window.addEventListener("keydown", event => {
  if (event.code === "Space" && !event.repeat && event.target === document.body) {
    event.preventDefault();
    generate();
  }
});
