let outline = null;
let navigateTo = null;
let visible = false;
let rendered = false;

async function initOutline(getOutline, goToDestination) {
  const outlineItems = await getOutline();
  const container = document.getElementById("js-viewer-outline");
  const toggleBtn = document.getElementById("js-viewer-outline-toggle-btn");
  navigateTo = goToDestination;

  if (container.firstElementChild) {
    toggleBtn.removeEventListener("click", toggleOutline);
    container.firstElementChild.remove();
  }
  container.classList.remove("visible");
  container.removeEventListener("click", handleOutlineClick);
  toggleBtn.classList.toggle("visible", outlineItems.length);

  if (outlineItems.length) {
    toggleBtn.addEventListener("click", toggleOutline);
  }
  outline = outlineItems;
  rendered = false;
  visible = false;
}

async function toggleOutline() {
  const container = document.getElementById("js-viewer-outline");

  visible = !visible;

  if (!rendered) {
    const div = document.createElement("div");
    div.classList.add("viewer-outline");
    container.append(div);
    renderOutline(outline, div);
    container.addEventListener("click", handleOutlineClick);
    rendered = true;
  }
  container.classList.toggle("visible", visible);
}

function handleOutlineClick(event) {
  if (event.target === event.currentTarget) {
    visible = false;
    event.currentTarget.classList.remove("visible");
    return;
  }
  const { nodeName } = event.target;

  if (nodeName === "A") {
    navigateTo(event.target.href);
    event.preventDefault();
    return;
  }
  const element = event.target.closest(".btn");

  if (element?.nodeName === "BUTTON") {
    element.classList.toggle("rotated");
    element.parentElement.nextElementSibling.classList.toggle("visible");
  }
}

function renderOutline(items, container) {
  const fragment = new DocumentFragment();

  for (const item of items) {
    const div = document.createElement("div");
    const a = `<a href="${item.href}" class="viewer-outline-link">${item.title}</a>`;

    div.classList.add("viewer-outline-item");

    if (item.items.length) {
      div.insertAdjacentHTML("beforeend", `
        <div class="viewer-outline-item-title">
          <button class="btn icon-btn viewer-outline-tree-toggle-btn">
            <svg viewBox="0 0 24 24">
                <path d="M7,10L12,15L17,10H7Z"/>
            </svg>
          </button>
          ${a}
        </div>
      `);
    }
    else {
      div.insertAdjacentHTML("beforeend", a);
    }

    if (item.items.length) {
      const div2 = document.createElement("div");

      div2.classList.add("viewer-outline-inner-tree");
      renderOutline(item.items, div2);
      div.append(div2);
    }
    fragment.append(div);
  }
  container.append(fragment);
}

export {
  initOutline
};
