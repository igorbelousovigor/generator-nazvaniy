let nouns = ["связь"];
let additions = ["времён"];

const button = document.querySelector("#generate");
const result = document.querySelector("#result");
const copyButton = document.querySelector("#copy");
const telegramLink = document.querySelector("#telegram-link");
const ratingButtons = [...document.querySelectorAll(".rating-button")];
const ratingStatus = document.querySelector("#rating-status");
const metrikaCounterId = 111522186;

function trackGoal(goal, params = {}) {
  if (typeof window.ym === "function") {
    window.ym(metrikaCounterId, "reachGoal", goal, params);
  }
}
const reels = {
  noun: document.querySelector("#noun-reel"),
  addition: document.querySelector("#addition-reel"),
};

let nounIndex = 0;
let additionIndex = 0;
let spinning = false;
let ratingSubmitted = false;
let timers = [];

function setRatingDisabled(disabled) {
  ratingButtons.forEach(ratingButton => {
    ratingButton.disabled = disabled;
  });
}

function resetRating() {
  ratingSubmitted = false;
  ratingStatus.textContent = "";
  ratingButtons.forEach(ratingButton => {
    ratingButton.classList.remove("is-selected");
    ratingButton.disabled = false;
    ratingButton.removeAttribute("aria-pressed");
  });
}

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
  active.classList.remove("drop", "is-long", "is-very-long");
  if (words[index].length >= 14) active.classList.add("is-very-long");
  else if (words[index].length >= 10) active.classList.add("is-long");
  void active.offsetWidth;
  active.classList.add("drop");
}

async function loadWords() {
  try {
    const response = await fetch("words.json?v=16", { cache: "no-store" });
    if (!response.ok) throw new Error("Не удалось загрузить список слов");
    const data = await response.json();
    if (!Array.isArray(data.nouns) || !data.nouns.length || !Array.isArray(data.additions) || !data.additions.length) {
      throw new Error("Некорректный список слов");
    }
    nouns = data.nouns;
    additions = data.additions;
    nounIndex = nouns.indexOf("связь");
    additionIndex = additions.indexOf("времён");
    if (nounIndex < 0) nounIndex = 0;
    if (additionIndex < 0) additionIndex = 0;
    renderReel(reels.noun, nouns, nounIndex);
    renderReel(reels.addition, additions, additionIndex);
    updateResult();
  } catch (error) {
    console.warn(error);
  }
}

function updateResult() {
  result.textContent = `${nouns[nounIndex]} ${additions[additionIndex]}`;
}

function spinReel(reel, words, duration, targetIndex, getIndex, setIndex) {
  const start = performance.now();
  reel.classList.add("is-spinning");

  function step() {
    const progress = Math.min((performance.now() - start) / duration, 1);
    const next = progress >= 1 ? targetIndex : pickIndex(words.length, getIndex());
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

function generate(source = "button") {
  if (spinning) return;
  trackGoal("generate_name", { source });
  resetRating();
  setRatingDisabled(true);
  timers.forEach(clearTimeout);
  timers = [];
  spinning = true;
  button.disabled = true;
  button.querySelector("span").textContent = "ищем название";

  const previousNounIndex = nounIndex;
  const previousAdditionIndex = additionIndex;
  let targetNounIndex;
  let targetAdditionIndex;

  do {
    targetNounIndex = Math.floor(Math.random() * nouns.length);
    targetAdditionIndex = Math.floor(Math.random() * additions.length);
  } while (targetNounIndex === previousNounIndex && targetAdditionIndex === previousAdditionIndex);

  spinReel(reels.noun, nouns, 1050, targetNounIndex, () => nounIndex, value => { nounIndex = value; });
  spinReel(reels.addition, additions, 1320, targetAdditionIndex, () => additionIndex, value => { additionIndex = value; });

  timers.push(setTimeout(() => {
    spinning = false;
    button.disabled = false;
    setRatingDisabled(false);
    button.querySelector("span").textContent = "сгенерировать название";
  }, 1580));
}

button.addEventListener("click", () => generate("button"));

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

  trackGoal("copy_name", { name });
  copyButton.classList.add("is-copied");
  copyButton.querySelector(".copy-status").textContent = "скопировано";
  copyButton.setAttribute("aria-label", "Название скопировано");
  setTimeout(() => {
    copyButton.classList.remove("is-copied");
    copyButton.querySelector(".copy-status").textContent = "копировать";
    copyButton.setAttribute("aria-label", "Копировать название");
  }, 1400);
});

ratingButtons.forEach(ratingButton => {
  ratingButton.addEventListener("click", () => {
    if (ratingSubmitted || spinning) return;

    ratingSubmitted = true;
    const vote = ratingButton.dataset.vote;
    const name = result.textContent.trim();
    const ratingData = {
      rating: {
        [vote]: {
          names: {
            [name]: 1,
          },
        },
      },
    };

    ratingButton.classList.add("is-selected");
    ratingButton.setAttribute("aria-pressed", "true");
    setRatingDisabled(true);
    ratingStatus.textContent = "спасибо";

    trackGoal("rate_name", ratingData);
    if (typeof window.ym === "function") {
      window.ym(metrikaCounterId, "params", { name_rating: ratingData });
    }
  });
});

telegramLink.addEventListener("click", () => {
  trackGoal("telegram_click");
});

window.addEventListener("keydown", event => {
  if (event.code === "Space" && !event.repeat && event.target === document.body) {
    event.preventDefault();
    generate("space");
  }
});

loadWords();
