export const messages: Record<string, [string, string]>;
export function message(key: string, language?: string, values?: Record<string, string | number>): string;
export function pagePath(path: string, language: string): string;
