// Shared error type for the tool, carrying a machine-readable code alongside the human message.
// Callers that need to react differently depending on the failure (e.g. retry vs. abort) can
// switch on the code instead of parsing the message text, and toJSON() gives a stable shape for
// any output that needs to serialize the error.
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
