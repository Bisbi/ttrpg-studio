import { htmlDocument, escapeHtml } from "../render/html.js";

export function renderHandoutHtml({ kind = "letter", title = "", content = "", css = "", width = 800, height = 1200 } = {}) {
  const body = `<div class="handout ${escapeHtml(kind)}">
  <h1 class="ho-title">${escapeHtml(title)}</h1>
  <div class="ho-content">${escapeHtml(content)}</div>
  </div>`;
  return htmlDocument({ title, css, body, width, height });
}
