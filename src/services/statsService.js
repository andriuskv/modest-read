import { getDaysInMonth, getCurrentDate, getResponse } from "utils";

let readingTime = JSON.parse(localStorage.getItem("reading-time")) || {};
let countLocally = true;
let timeStamp = 0;
let timeStampIntervalId = 0;

function startCounting(local) {
  countLocally = local;
  timeStamp = Date.now();
  timeStampIntervalId = setInterval(saveTimeStamp, 30000);
  document.addEventListener("visibilitychange", handlePageVisibilityChange);
}

function stopCounting() {
  if (timeStampIntervalId) {
    clearInterval(timeStampIntervalId);
    timeStampIntervalId = 0;
    saveTimeStamp();
  }
}

function resetCounting() {
  countLocally = false;
  stopCounting();
  document.removeEventListener("visibilitychange", handlePageVisibilityChange);
}

function handlePageVisibilityChange() {
  if (document.hidden) {
    stopCounting();
  }
  else if (!timeStampIntervalId) {
    startCounting(countLocally);
  }
}

function fetchStatistics(user) {
  if (!user.email) {
    return {
      data: readingTime
    };
  }
  return fetchUserStatistics();
}

function resetStatistics(user) {
  readingTime = {};

  localStorage.removeItem("reading-time");

  if (user.email) {
    return resetUserStatistics();
  }
  return { code: 204 };
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

  timeStamp = Date.now();

  if (countLocally) {
    readingTime[year] ??= {};
    readingTime[year][month] ??= {};
    readingTime[year][month][day] = Number(readingTime[year][month][day] || 0) + Math.round(diff / 1000);

    localStorage.setItem("reading-time", JSON.stringify(readingTime));
  }
  else {
    try {
      storeStatistics({
        [year]: {
          [month]: {
            [day]: Math.round(diff / 1000)
          }
        }
      });
    } catch (e) {
      console.log(e);
    }
  }
}

function fetchUserStatistics() {
  return fetch("/api/stats/me").then(getResponse);
}

function storeStatistics(data) {
  return fetch("/api/stats", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }).then(getResponse);
}

function resetUserStatistics() {
  return fetch("/api/stats", {
    method: "DELETE"
  }).then(getResponse);
}

export {
  startCounting,
  resetCounting,
  fetchStatistics,
  resetStatistics,
  getCalendarYear
};
