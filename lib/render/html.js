export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

export function htmlDocument({ title = "", css = "", body = "", width, height }) {
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="hz:canvas-width" content="${width}">
<meta name="hz:canvas-height" content="${height}">
<title>${escapeHtml(title)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{margin:0}
.canvas{width:${width}px;height:${height}px;overflow:hidden;position:relative}
${css}
</style>
</head>
<body>
<div class="canvas">${body}</div>
</body>
</html>
`;
}
