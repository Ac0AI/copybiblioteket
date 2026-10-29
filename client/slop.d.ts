export interface SlopFinding { id: string; start: number; end: number; quote: string; label: [string, string]; fix: [string, string]; }
export const slopPatterns: { id: string; re: RegExp; label: [string, string]; fix: [string, string] }[];
export function findSlop(text: string): SlopFinding[];
