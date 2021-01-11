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
  }
  else if (nodeName === "BUTTON") {
    event.target.classList.toggle("rotated");
    event.target.parentElement.nextElementSibling.classList.toggle("visible");
  }
}

function renderOutline(items, container) {
  const fragment = new DocumentFragment();

  for (const item of items) {
    const div = document.createElement("div");
    const a = document.createElement("a");

    div.classList.add("viewer-outline-item");
    a.classList.add("viewer-outline-link");
    a.textContent = item.title;
    a.href = item.href;

    if (item.items.length) {
      const div2 = document.createElement("div");
      const button = document.createElement("button");

      button.innerHTML = "&#x25BE";
      button.classList.add("btn", "icon-btn", "viewer-outline-tree-toggle-btn");

      div2.append(button);
      div2.append(a);
      div.append(div2);
      container.classList.add("has-inner-tree");
    }
    else {
      div.append(a);
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
