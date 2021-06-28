import { getDaysInMonth, getCurrentDate } from "../utils";

const readingTime = JSON.parse(localStorage.getItem("reading-time")) || {};
let timeStamp = 0;
let timeStampIntervalId = 0;

(function() {
  let changed = false;

  for (const year of Object.keys(readingTime)) {
    if (Array.isArray(readingTime[year])) {
      changed = true;
      delete readingTime[year];
    }
  }

  if (changed) {
    localStorage.setItem("reading-time", JSON.stringify(readingTime));
  }
})();

function startCounting() {
  timeStamp = Date.now();
  timeStampIntervalId = setInterval(saveTimeStamp, 10000);
}

function stopCounting() {
  clearInterval(timeStampIntervalId);
  saveTimeStamp();
}

function getReadingTime() {
  return readingTime;
}

function getCalendarYear(year) {
  return Array.from(new Array(12), (_, i) => getMonth(year, i));
}

function getMonth(year, month) {
  const daysInMonth = getDaysInMonth(year, month);
  return new Array(daysInMonth).fill(0);
}

function saveTimeStamp() {
  const { year, month, day } = getCurrentDate();
  const diff = Date.now() - timeStamp;

  readingTime[year] = readingTime[year] || {};
  readingTime[year][month] = readingTime[year][month] || {};
  readingTime[year][month][day] = (readingTime[year][month][day] || 0) + Math.round(diff / 1000);
  timeStamp = Date.now();

  localStorage.setItem("reading-time", JSON.stringify(readingTime));
}

export {
  startCounting,
  stopCounting,
  getReadingTime,
  getCalendarYear
};
