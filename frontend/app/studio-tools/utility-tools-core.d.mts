export type RestoreRecord = {
  sourceId: string;
  kind: 'task' | 'note' | 'planner' | 'habit';
  title: string;
  status: string;
  due_at: number | null;
  data: Record<string, unknown>;
};
export function calculate(source: string): number;
export function convert(value: string, category: string, from: string, to: string): number;
export function normalizeBackup(backup: unknown): RestoreRecord[];
