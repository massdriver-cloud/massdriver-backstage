// Deterministic per-account accent color for presence UI (cursors, avatar
// rings). Ported from apps/web features/environments/realtime/userColor.js —
// same palette and hash so a user gets the same color in both apps.
const PALETTE = [
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#16a34a',
  '#ea580c',
  '#0284c7',
  '#9333ea',
  '#ca8a04',
];

const hash = (value: string): number => {
  let acc = 0;
  for (let index = 0; index < value.length; index += 1) {
    acc = (acc * 31 + value.charCodeAt(index)) >>> 0;
  }
  return acc;
};

const userColor = (accountId: string | null | undefined): string =>
  PALETTE[hash(accountId || '') % PALETTE.length];

export default userColor;
