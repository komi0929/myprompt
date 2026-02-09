/**
 * Template variable utilities for prompt templates.
 * Extracts {variableName} placeholders and fills them with user values.
 */

const VARIABLE_REGEX = /\{([^{}]+)\}/g;
const STORAGE_KEY = "myprompt-template-values";

/** Extract unique variable names from a prompt template */
export function extractVariables(content: string): string[] {
  const matches = content.matchAll(VARIABLE_REGEX);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const match of matches) {
    const name = match[1].trim();
    if (!seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }
  return result;
}

/** Fill variables in a template with provided values */
export function fillTemplate(content: string, values: Record<string, string>): string {
  return content.replace(VARIABLE_REGEX, (full, name: string) => {
    const trimmed = name.trim();
    return values[trimmed] !== undefined && values[trimmed] !== ""
      ? values[trimmed]
      : full;
  });
}

/** Check if a prompt has any template variables */
export function hasVariables(content: string): boolean {
  return /\{[^{}]+\}/.test(content);
}

/** Save variable values to localStorage (keyed by promptId) */
export function saveTemplateValues(promptId: string, values: Record<string, string>): void {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, Record<string, string>>;
    stored[promptId] = values;
    // Keep only last 50 prompts to limit storage
    const keys = Object.keys(stored);
    if (keys.length > 50) {
      for (const k of keys.slice(0, keys.length - 50)) {
        delete stored[k];
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // ignore storage errors
  }
}

/** Load previously saved variable values for a prompt */
export function loadTemplateValues(promptId: string): Record<string, string> {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, Record<string, string>>;
    return stored[promptId] ?? {};
  } catch {
    return {};
  }
}
