const readingTime = JSON.parse(localStorage.getItem("reading-time")) || {};
let timeStamp = 0;
let timeStampIntervalId = 0;

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

function getYear() {
  return new Array(12).fill(0);
}

function saveTimeStamp() {
  const date = new Date();
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth();
  const diff = Date.now() - timeStamp;

  readingTime[currentYear] ||= getYear();
  readingTime[currentYear][currentMonth] += Math.round(diff / 1000);

  timeStamp = Date.now();

  localStorage.setItem("reading-time", JSON.stringify(readingTime));
}

export {
  startCounting,
  stopCounting,
  getReadingTime
};
