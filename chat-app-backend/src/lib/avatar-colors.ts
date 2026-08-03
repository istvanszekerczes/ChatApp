export const ALLOWED_AVATAR_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#a855f7', '#f59e0b', '#ec4899',
] as const;

export function isValidAvatarColor(color: unknown): color is typeof ALLOWED_AVATAR_COLORS[number] {
  return typeof color === 'string' && (ALLOWED_AVATAR_COLORS as readonly string[]).includes(color);
}