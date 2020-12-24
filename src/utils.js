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
  const pdfjs = await import("pdfjs-dist/webpack");
  const arrayBuffer = await file.arrayBuffer();
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

function scrollToPage(number, elements, { keepToolbarVisible, scrollLeft = document.documentElement.scrollLeft }) {
  execFuncOnPageElement(elements, number, element => {
    const offset = keepToolbarVisible || number === 1 ? 40 : 0;
    window.scrollTo(scrollLeft, element.offsetTop - offset);
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

function dispatchCustomEvent(eventName, data) {
  const event = new CustomEvent(eventName, { detail: data });

  window.dispatchEvent(event);
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
  dispatchCustomEvent
};
