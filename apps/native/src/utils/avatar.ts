/**
 * Generate DiceBear avatar URL
 * @param seed - Seed string for avatar generation (usually user's name)
 * @returns DiceBear avatar URL
 */
export const getDiceBearUrl = (seed: string): string => {
  const encodedSeed = encodeURIComponent(seed.trim());
  return `https://api.dicebear.com/9.x/personas/png?seed=${encodedSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
};

/**
 * Extract initials from name
 * @param name - Full name
 * @returns Initials (max 2 characters)
 */
export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0]?.substring(0, 2).toUpperCase() || '?';
};
