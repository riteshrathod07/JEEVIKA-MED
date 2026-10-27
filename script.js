/* =========================================
   StudyBloom — Main JavaScript
   File: script.js
   ========================================= */

"use strict";

const STORAGE_KEYS = {
  targets: "studybloom_targets_v1",
  lectures: "studybloom_lectures_v1",
  timer: "studybloom_timer_v1"
};

/* ---------- Safe local storage helpers ---------- */

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    console.warn("Could not read saved data:", error);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("Could not save data:", error);
    return false;
  }
}

/* ---------- Daily targets ---------- */

let targets = readStorage(STORAGE_KEYS.targets, []);

if (!Array.isArray(targets)) {
  targets = [];
}

const targetForm = document.getElementById("target-form");
const targetInput = document.getElementById("target-input");
const targetList = document.getElementById("target-list");
const targetSummary = document.getElementById("target-summary");

function saveTargets() {
  writeStorage(STORAGE_KEYS.targets, targets);
}

function renderTargets() {
  if (!targetList) return;

  targetList.replaceChildren();

  if (targets.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "Your goals will appear here. Start with one small step. ♡";
    targetList.appendChild(empty);
  }

  targets.forEach((target) => {
    const item = document.createElement("li");

    if (target.completed) {
      item.classList.add("completed");
    }

    const label = document.createElement("label");
    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.checked = Boolean(target.completed);
    checkbox.setAttribute(
      "aria-label",
      "Mark target complete: " + target.text
    );

    checkbox.addEventListener("change", () => {
      target.completed = checkbox.checked;
      saveTargets();
      renderTargets();
    });

    const text = document.createElement("span");
    text.textContent = target.text;

    label.append(checkbox, text);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn btn-secondary btn-small";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", "Delete target: " + target.text);

    deleteButton.addEventListener("click", () => {
      targets = targets.filter((itemTarget) => itemTarget.id !== target.id);
      saveTargets();
      renderTargets();
    });

    item.append(label, deleteButton);
    targetList.appendChild(item);
  });

  if (targetSummary) {
    const completed = targets.filter((target) => target.completed).length;
    targetSummary.textContent =
      `${completed} of ${targets.length} daily targets completed`;
  }
}

if (targetForm && targetInput) {
  targetForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = targetInput.value.trim();

    if (!text) {
      targetInput.focus();
      return;
    }

    targets.push({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      text,
      completed: false
    });

    saveTargets();
    renderTargets();

    targetInput.value = "";
    targetInput.focus();
  });
}

renderTargets();

/* ---------- Lecture completion and progress ---------- */

let lectures = readStorage(STORAGE_KEYS.lectures, {});

if (!lectures || typeof lectures !== "object" || Array.isArray(lectures)) {
  lectures = {};
}

function lectureKey(subject, chapter) {
  return `${subject}-${chapter}`;
}

function updateSubjectProgress(subject) {
  const checkboxes = Array.from(
    document.querySelectorAll(
      `.lecture-checkbox[data-subject="${subject}"]`
    )
  );

  const total = checkboxes.length;
  const completed = checkboxes.filter((checkbox) => checkbox.checked).length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  const progressBar = document.getElementById(`${subject}-progress`);
  const progressText = document.getElementById(`${subject}-progress-text`);

  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
    progressBar.setAttribute("role", "progressbar");
    progressBar.setAttribute("aria-valuemin", "0");
    progressBar.setAttribute("aria-valuemax", "100");
    progressBar.setAttribute("aria-valuenow", String(percentage));
  }

  if (progressText) {
    progressText.textContent =
      `${completed} of ${total} lectures completed (${percentage}%)`;
  }
}

function initialiseLectures() {
  const checkboxes = document.querySelectorAll(".lecture-checkbox");
  const subjects = new Set();

  checkboxes.forEach((checkbox) => {
    const subject = checkbox.dataset.subject;
    const chapter = checkbox.dataset.chapter;

    if (!subject || !chapter) return;

    const key = lectureKey(subject, chapter);
    checkbox.checked = Boolean(lectures[key]);
    subjects.add(subject);

    checkbox.addEventListener("change", () => {
      lectures[key] = checkbox.checked;
      writeStorage(STORAGE_KEYS.lectures, lectures);
      updateSubjectProgress(subject);
    });
  });

  subjects.forEach(updateSubjectProgress);
}

initialiseLectures();

/* ---------- Study timer: persistent across pages ---------- */

const timerDisplay = document.getElementById("timer-display");
const timerMessage = document.getElementById("timer-message");
const timerStart = document.getElementById("timer-start");
const timerPause = document.getElementById("timer-pause");
const timerReset = document.getElementById("timer-reset");

const savedTimer = readStorage(STORAGE_KEYS.timer, { seconds: 0 });

let elapsedSeconds =
  Number.isFinite(savedTimer.seconds) && savedTimer.seconds >= 0
    ? Math.floor(savedTimer.seconds)
    : 0;

// Keep the original start timestamp when navigating between pages.
let timerStartedAt =
  savedTimer.running === true &&
  Number.isFinite(savedTimer.startedAt)
    ? savedTimer.startedAt
    : null;

let timerInterval = null;

function getElapsedSeconds() {
  if (timerStartedAt === null) {
    return elapsedSeconds;
  }

  return elapsedSeconds +
    Math.max(0, Math.floor((Date.now() - timerStartedAt) / 1000));
}

function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0")
  ].join(":");
}

function updateTimerDisplay() {
  if (timerDisplay) {
    timerDisplay.textContent = formatTime(getElapsedSeconds());
  }
}

function saveTimer() {
  writeStorage(STORAGE_KEYS.timer, {
    seconds: elapsedSeconds,
    running: timerStartedAt !== null,
    startedAt: timerStartedAt
  });
}

function refreshTimer() {
  updateTimerDisplay();

  // Save the running state so another page can resume accurately.
  saveTimer();
}

function startTimer() {
  if (timerStartedAt !== null) return;

  timerStartedAt = Date.now();
  saveTimer();

  if (timerMessage) {
    timerMessage.textContent =
      "Focus on your dreams, one second at a time. ♡";
  }

  if (timerStart) timerStart.disabled = true;
  if (timerPause) timerPause.disabled = false;

  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
  }

  timerInterval = window.setInterval(refreshTimer, 1000);
  updateTimerDisplay();
}

function pauseTimer() {
  if (timerStartedAt === null) return;

  elapsedSeconds = getElapsedSeconds();
  timerStartedAt = null;

  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }

  saveTimer();
  updateTimerDisplay();

  if (timerMessage) {
    timerMessage.textContent =
      "Timer paused. Take a breath, then continue. ♡";
  }

  if (timerStart) timerStart.disabled = false;
  if (timerPause) timerPause.disabled = true;
}

function resetTimer() {
  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }

  elapsedSeconds = 0;
  timerStartedAt = null;

  saveTimer();
  updateTimerDisplay();

  if (timerMessage) {
    timerMessage.textContent =
      "Fresh start. Make this study session count. ♡";
  }

  if (timerStart) timerStart.disabled = false;
  if (timerPause) timerPause.disabled = true;
}

if (timerStart) {
  timerStart.addEventListener("click", startTimer);
}

if (timerPause) {
  timerPause.addEventListener("click", pauseTimer);
}

if (timerReset) {
  timerReset.addEventListener("click", resetTimer);
}

// Resume automatically if the timer was running on another page.
updateTimerDisplay();

if (timerStartedAt !== null) {
  if (timerStart) timerStart.disabled = true;
  if (timerPause) timerPause.disabled = false;

  timerInterval = window.setInterval(refreshTimer, 1000);
} else {
  if (timerStart) timerStart.disabled = false;
  if (timerPause) timerPause.disabled = true;
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    updateTimerDisplay();
  }
});

window.addEventListener("pagehide", () => {
  // Save without resetting the original start time.
  saveTimer();
});
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .catch((error) => {
        console.error("Jeevika Med service worker:", error);
      });
  });
}