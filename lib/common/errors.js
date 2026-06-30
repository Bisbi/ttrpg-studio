export const CODES = {
  NOT_FOUND: "NOT_FOUND",
  AMBIGUOUS: "AMBIGUOUS",
  INVALID_INPUT: "INVALID_INPUT",
  COLLISION: "COLLISION",
  INTERNAL: "INTERNAL",
};

export class ToolError extends Error {
  constructor(code, message, retriable = false) {
    super(message);
    this.name = "ToolError";
    this.code = code;
    this.retriable = retriable;
  }
  toJSON() {
    return { code: this.code, message: this.message, retriable: this.retriable };
  }
}
