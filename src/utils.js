function setDocumentTitle(title) {
  document.title = `${title} | ModestRead`;
}

function classNames(...classNames) {
  return classNames.join(" ").trimEnd();
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

async function getPdfInstance(file, pdfjs) {
  const arrayBuffer = await file.arrayBuffer();
  return pdfjs.getDocument(new Uint8Array(arrayBuffer)).promise;
}

function parseMetadata(metadata) {
  const data = {};

  if (metadata.info.Title) {
    data.title = metadata.info.Title;
  }

  if (metadata.info.Author) {
    data.author = metadata.info.Author;
  }
  return data;
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

function scrollToPage(number, elements, keepToolbarVisible) {
  execFuncOnPageElement(elements, number, element => {
    const offset = keepToolbarVisible ? 40 : 0;
    window.scrollTo(document.documentElement.scrollLeft, element.offsetTop - offset);
  });
}

export {
  setDocumentTitle,
  classNames,
  pageToDataURL,
  getPdfInstance,
  parseMetadata,
  getFileSizeString,
  getPageElementBox,
  scrollToPage
};
