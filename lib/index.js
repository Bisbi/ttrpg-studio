export { slugify } from "./common/slug.js";
export { writeFileSafe } from "./common/fs-atomic.js";
export { validateSettingConfig } from "./common/config.js";
export { ToolError, CODES } from "./common/errors.js";
export { createLogger } from "./common/logger.js";
export { parseRelations, serializeRelations } from "./relations/parse.js";
export { neighbors, outgoing, mergeEdges } from "./relations/graph.js";
export { scaffoldSetting } from "./setting/scaffold.js";
export { applyGeneration } from "./setting/apply-generation.js";
export { checkCanon } from "./lorekeeper/check.js";
export { collectKnownIds } from "./lorekeeper/collect.js";

// Adventure pipeline
export { validateAdventureConfig } from "./common/config.js";
export { validateAdventure, RULES as ADVENTURE_RULES } from "./adventure/validate.js";
export { scaffoldAdventure } from "./adventure/scaffold.js";
export { XP_THRESHOLDS, multiplierForCount } from "./encounter/thresholds.js";
export { partyBudget, adjustedXp } from "./encounter/budget.js";
export { proposeEncounters } from "./encounter/propose.js";
export { rollOnColumn, rollAll } from "./tables/roll.js";
export { extractOnePager } from "./session-prep/extract.js";

// Production / render (layer deterministico; il renderer Playwright è nel package render/)
export { resolveOutputPath } from "./common/output.js";
export { localizeField } from "./common/localize.js";
export { escapeHtml, htmlDocument } from "./render/html.js";
export { cardModel } from "./item-card/model.js";
export { renderItemCardHtml } from "./item-card/render-html.js";
export { playerSafe } from "./handout/sanitize.js";
export { renderHandoutHtml } from "./handout/render-html.js";
export { assembleScreen } from "./dm-screen/assemble.js";
export { renderScreenHtml } from "./dm-screen/render-html.js";

// Visuals (image-gen + battle-map; il rendering reale usa il package render/)
export { selectProvider } from "./image/select.js";
export { imageGenDisclaimer } from "./image/disclaimer.js";
export { apiGenerate } from "./image/api-provider.js";
export { browserGenerate } from "./image/browser-provider.js";
export { generateDungeon } from "./battlemap/generate.js";
export { mapToSvg } from "./battlemap/svg.js";
export { gridGroup, addGridToSvg, wrapImageWithGrid } from "./battlemap/add-grid.js";

// Voice
export { resolveVoice, loadVoice } from "./voice/resolve.js";
