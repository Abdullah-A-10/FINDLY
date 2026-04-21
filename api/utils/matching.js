const stringSimilarity = require('string-similarity');

const calculateMatchScore = (lostItem, foundItem) => {
  let score = 0;

  // 1. Category (25%)
  if (lostItem.category === foundItem.category) score += 25;

  // 2. Name (35%)
  score += stringSimilarity.compareTwoStrings(
    lostItem.item_name.toLowerCase(),
    foundItem.item_name.toLowerCase()
  ) * 35;

  // 3. Description (20%)
  if (lostItem.description && foundItem.description) {
    score += stringSimilarity.compareTwoStrings(
      lostItem.description.toLowerCase(),
      foundItem.description.toLowerCase()
    ) * 20;
  }

  // 4. Location (15% - Simplified LIKE matching + Keyword Matching)
  
  const lostLoc = lostItem.lost_location.toLowerCase();
  const foundLoc = foundItem.found_location.toLowerCase();
  
  // Split into keywords and check partial matches
  const lostWords = lostLoc.split(/\W+/);
  const foundWords = foundLoc.split(/\W+/);
  const hasCommonWord = lostWords.some(word => 
    word.length > 3 && foundWords.includes(word)
  );
  
  if (hasCommonWord) score += 15;

  // 5. Date (5%)
  const dateDiff = Math.abs(new Date(lostItem.lost_date) - new Date(foundItem.found_date)) / (1000 * 60 * 60 * 24);
  if (dateDiff <= 3) score += 5;

  return Math.min(Math.round(score), 100);
};

module.exports = { calculateMatchScore };
