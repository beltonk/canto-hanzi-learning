export interface LevelUpRewards {
  stickersToAdd: string[];
  gardenItemsToAdd: string[];
}

// One sticker per level milestone, one garden item every 2 levels
export function awardLevelUpRewards(newLevel: number, existingStickers: string[]): LevelUpRewards {
  const stickersToAdd: string[] = [];
  const gardenItemsToAdd: string[] = [];

  // Award a sticker every level
  const stickerId = `sticker_${((newLevel - 1) % 20) + 1}`;
  if (!existingStickers.includes(stickerId)) {
    stickersToAdd.push(stickerId);
  }

  // Award a garden plant every 2 levels (up to 10)
  if (newLevel % 2 === 0) {
    const plantIdx = Math.min(newLevel / 2, 10);
    gardenItemsToAdd.push(`garden_plant_${plantIdx}`);
  }

  return { stickersToAdd, gardenItemsToAdd };
}
