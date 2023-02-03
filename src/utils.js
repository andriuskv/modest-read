function setDocumentTitle(title) {
  document.title = `${title} | ModestRead`;
}

function classNames(...classNames) {
  return classNames.join(" ").trimEnd();
}

function getElementByAttr(attr, element, endElement = null) {
  while (element && element !== endElement) {
    if (element.hasAttribute(attr)) {
      return {
        elementRef: element,
        attrValue: element.getAttribute(attr)
      };
    }
    element = element.parentElement;
  }
}

function dispatchCustomEvent(eventName, data) {
  const event = new CustomEvent(eventName, { detail: data });

  window.dispatchEvent(event);
}

async function pageToDataURL(pdf) {
  const DEFAULT_SCALE = 0.4;
  const page = await pdf.getPage(1);
  const canvas = document.createElement("canvas");
  const maxWidth = 162;
  const maxHeight = 240;
  let viewport = page.getViewport({ scale: DEFAULT_SCALE });

  if (viewport.width < maxWidth) {
    viewport = page.getViewport({ scale: DEFAULT_SCALE * maxWidth / viewport.width });
  }
  else if (viewport.height > maxHeight) {
    viewport = page.getViewport({ scale: DEFAULT_SCALE * maxHeight / viewport.height });
  }
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
  return canvas.toDataURL("image/jpeg", 0.8);
}

async function getPdfInstance(file) {
  const [pdfjs, arrayBuffer] = await Promise.all([import("pdfjs-dist/webpack"), file.arrayBuffer()]);
  return pdfjs.getDocument(new Uint8Array(arrayBuffer)).promise;
}

function parsePdfMetadata(metadata) {
  const data = {};

  if (metadata.info.Title) {
    data.title = metadata.info.Title;
  }

  if (metadata.info.Author) {
    data.author = metadata.info.Author;
  }
  return data;
}

function resizeImageBlob(blob) {
  return new Promise(resolve => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.width = 162;
    img.height = 240;
    img.src = blob;
  });
}

async function getEpubCoverUrl(book) {
  const coverUrl = await book.coverUrl();

  if (coverUrl) {
    return resizeImageBlob(coverUrl);
  }
  else {
    await book.opened;

    for (const [index, url] of Object.entries(book.resources.urls)) {
      if (url.toLowerCase().includes("cover")) {
        return resizeImageBlob(book.resources.replacementUrls[index]);
      }
    }
    return new Promise(resolve => {
      const div = document.createElement("div");
      div.id = "area";
      div.classList.add("files-thumbnail-render-area");
      document.body.appendChild(div);

      const rendition = book.renderTo("area", { width: 684, height: 980 });

      rendition.display();
      rendition.hooks.content.register(async contents => {
        const { default: html2canvas } = await import("html2canvas");
        const canvas = await html2canvas(contents.content, { width: 684 });

        div.remove();
        canvas.toBlob(blob => {
          resolve(resizeImageBlob(URL.createObjectURL(blob)));
        }, "image/jpeg", 0.8);
      });
    });
  }
}

function getFileSizeString(bytes) {
  const suffixes = ["B", "kB", "MB", "GB"];
  let size = bytes;
  let l = 0;

  while (l < suffixes.length) {
    if (size < 1000) {
      break;
    }
    else {
      size /= 1000;
    }
    l += 1;
  }
  size = l > 0 ? size.toFixed(1) : Math.round(size);
  return `${size} ${suffixes[l]}`;
}

function execFuncOnPageElement(elements, number, callback) {
  for (const element of elements) {
    if (parseInt(element.getAttribute("data-page-number"), 10) === number) {
      return callback(element);
    }
  }
}

function getPageElementBox(number, elements) {
  return execFuncOnPageElement(elements, number, element => element.getBoundingClientRect());
}

function scrollToPage(number, elements, { scrollLeft = document.documentElement.scrollLeft } = {}) {
  execFuncOnPageElement(elements, number, element => {
    window.scrollTo(scrollLeft, element.offsetTop);
  });
}

function getScrollbarWidth() {
  const outer = document.createElement("div");
  const inner = document.createElement("div");

  outer.style.visibility = "hidden";
  outer.style.overflow = "scroll";

  outer.appendChild(inner);
  document.body.appendChild(outer);

  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

  outer.remove();
  return scrollbarWidth;
}

function getMonthName(month, useShortName = false) {
  const months = {
    0: "January",
    1: "February",
    2: "March",
    3: "April",
    4: "May",
    5: "June",
    6: "July",
    7: "August",
    8: "September",
    9: "October",
    10: "November",
    11: "December"
  };

  return useShortName ? months[month].slice(0, 3) : months[month];
}

function getWeekdayName(day, useShortName = false) {
  const weekdays = {
    0: "Monday",
    1: "Tuesday",
    2: "Wednesday",
    3: "Thursday",
    4: "Friday",
    5: "Saturday",
    6: "Sunday"
  };

  return useShortName ? weekdays[day].slice(0, 3) : weekdays[day];
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getCurrentWeek(currentYear, currentMonth, currentDay) {
  const firstDayIndex = getFirstDayIndex(currentYear, 0);
  let days = firstDayIndex;

  for (let i = 0; i < 12; i += 1) {
    const daysInMonth = getDaysInMonth(currentYear, i);

    for (let j = 0; j < daysInMonth; j += 1) {
      if (i === currentMonth && j === currentDay) {
        return Math.floor(days / 7);
      }
      days += 1;
    }
  }
}

function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate() - 1;
  const weekday = date.getDay();

  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    week: getCurrentWeek(year, month, day),
    weekday: weekday === 0 ? 6 : weekday - 1,
    day
  };
}

function getWeekday(year, month, day) {
  return new Date(`${year}-${month + 1}-${day}`).getDay();
}

function getFirstDayIndex(year, month) {
  const day = getWeekday(year, month, 1);

  return day === 0 ? 6 : day - 1;
}

async function getResponse(response) {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const json = isJson ? await response.json() : {};

  return { code: response.status, ...json };
}

function delay(milliseconds) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

async function computeHash(buffer) {
  const { default: CryptoJS } = await import("crypto-js");
  const wordArray = CryptoJS.lib.WordArray.create(buffer);
  return CryptoJS.MD5(wordArray).toString();
}

function copyObject(obj, mainObj) {
  for (const key of Object.keys(mainObj)) {
    if (typeof obj[key] === "undefined") {
      obj[key] = mainObj[key];
    }
    else if (typeof obj[key] === "object") {
      obj[key] = copyObject(obj[key], mainObj[key]);
    }
  }
  return obj;
}

export {
  setDocumentTitle,
  classNames,
  getElementByAttr,
  pageToDataURL,
  getPdfInstance,
  parsePdfMetadata,
  getEpubCoverUrl,
  getFileSizeString,
  getPageElementBox,
  scrollToPage,
  getScrollbarWidth,
  dispatchCustomEvent,
  getMonthName,
  getWeekdayName,
  getDaysInMonth,
  getCurrentDate,
  getFirstDayIndex,
  getResponse,
  delay,
  computeHash,
  copyObject
};
