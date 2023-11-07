export const rarityMapping = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
  mythic: 6,
};

export const rarityOptions = Object.keys(rarityMapping);

export const getBestSat = (satRanges) => {
  let bestSat = undefined;
  let highestRarityValue = -1;

  satRanges?.forEach((sat) => {
    const currentRarityValue = rarityMapping[sat.rarity];
    if (currentRarityValue > highestRarityValue) {
      highestRarityValue = currentRarityValue;
      bestSat = sat;
    }
  });

  return bestSat?.rarity;
};
