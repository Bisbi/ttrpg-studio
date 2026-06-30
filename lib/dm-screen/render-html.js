import { htmlDocument, escapeHtml } from "../render/html.js";

export function renderScreenHtml(screen, { css = "", width = 1920, height = 1080 } = {}) {
  const panels = (screen.panels ?? []).map((p) => `
  <section class="panel">
    <h2>${escapeHtml(p.heading)}</h2>
    <ul>${(p.items ?? []).map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
  </section>`).join("");
  const body = `<header class="screen-head"><h1>${escapeHtml(screen.title)}</h1></header>
  <div class="grid">${panels}</div>`;
  return htmlDocument({ title: screen.title, css, body, width, height });
}
