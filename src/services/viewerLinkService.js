import { scrollToPage } from "utils";
import { getSetting } from "services/settingsService";

export default class LinkService {
  constructor(pdfDocument, pdfElement, url) {
    this.pdfDocument = pdfDocument;
    this.pdfElement = pdfElement;
    this.url = url;
  }

  navigateTo(dest) {
    this.goToDestination(dest);
  }

  addLinkAttributes(link, url) {
    link.setAttribute("href", url);
  }

  async goToDestination(dest) {
    let explicitDest = null;

    if (typeof dest === "string") {
      explicitDest = await this.pdfDocument.getDestination(dest);
    }
    else {
      explicitDest = dest;
    }
    const index = await this.pdfDocument.getPageIndex(explicitDest[0]);

    scrollToPage(index + 1, this.pdfElement.children, { keepToolbarVisible: getSetting("keepToolbarVisible") });
  }

  getDestinationHash(dest) {
    if (typeof dest === "string") {
      if (dest.length) {
        return this.getAnchorUrl(`#${escape(dest)}`);
      }
    }
    if (Array.isArray(dest)) {
      const str = JSON.stringify(dest);

      if (str.length) {
        return this.getAnchorUrl(`#${escape(str)}`);
      }
    }
    return this.getAnchorUrl("");
  }

  getAnchorUrl(anchor) {
    return this.url + anchor;
  }
}
