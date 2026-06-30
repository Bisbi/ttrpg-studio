import { htmlDocument, escapeHtml } from "../render/html.js";

export function renderItemCardHtml(model, { css = "", width = 800, height = 1200 } = {}) {
  const att = model.attunement ? `<p class="attune">Richiede sintonia</p>` : "";
  const img = model.image ? `<img class="art" src="${escapeHtml(model.image)}" alt="">` : "";
  const body = `
  ${img}
  <h1 class="name">${escapeHtml(model.name)}</h1>
  <p class="rarity">${escapeHtml(model.rarity)}</p>
  ${att}
  <div class="desc">${escapeHtml(model.description)}</div>`;
  return htmlDocument({ title: model.name, css, body, width, height });
}
