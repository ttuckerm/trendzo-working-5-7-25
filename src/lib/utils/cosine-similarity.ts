/**
 * Cosine Similarity Utility
 * Lightweight implementation for computing similarity between vectors
 */

/**
 * Calculate the dot product of two vectors
 */
function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

/**
 * Calculate the magnitude (Euclidean norm) of a vector
 */
function magnitude(vector: number[]): number {
  const sumOfSquares = vector.reduce((sum, val) => sum + val * val, 0);
  return Math.sqrt(sumOfSquares);
}

/**
 * Calculate cosine similarity between two vectors
 * Returns a value between -1 and 1, where:
 * - 1 means vectors are identical in direction
 * - 0 means vectors are orthogonal (perpendicular)
 * - -1 means vectors are opposite in direction
 * 
 * @param a First vector
 * @param b Second vector
 * @returns Cosine similarity value (-1 to 1)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  if (a.length === 0) {
    return 0;
  }
  
  const dot = dotProduct(a, b);
  const magA = magnitude(a);
  const magB = magnitude(b);
  
  // Handle zero vectors
  if (magA === 0 || magB === 0) {
    return 0;
  }
  
  return dot / (magA * magB);
}

/**
 * Calculate cosine distance between two vectors
 * Distance = 1 - similarity, so:
 * - 0 means vectors are identical
 * - 1 means vectors are orthogonal
 * - 2 means vectors are opposite
 * 
 * @param a First vector
 * @param b Second vector
 * @returns Cosine distance value (0 to 2)
 */
export function cosineDistance(a: number[], b: number[]): number {
  return 1 - cosineSimilarity(a, b);
}

/**
 * Convert boolean array to number array for vector calculations
 * @param boolArray Boolean array to convert
 * @returns Number array with 1s and 0s
 */
export function booleanToVector(boolArray: boolean[]): number[] {
  return boolArray.map(bool => bool ? 1 : 0);
}

/**
 * Normalize a vector to unit length
 * @param vector Input vector
 * @returns Normalized vector
 */
export function normalize(vector: number[]): number[] {
  const mag = magnitude(vector);
  if (mag === 0) {
    return vector.slice(); // Return copy of zero vector
  }
  return vector.map(val => val / mag);
}

/**
 * Find the most similar vector from a collection
 * @param target Target vector to match against
 * @param vectors Collection of vectors to search
 * @returns Object with index, similarity, and distance of best match
 */
export function findMostSimilar(
  target: number[], 
  vectors: number[][]
): { index: number; similarity: number; distance: number } | null {
  if (vectors.length === 0) {
    return null;
  }
  
  let bestIndex = 0;
  let bestSimilarity = cosineSimilarity(target, vectors[0]);
  
  for (let i = 1; i < vectors.length; i++) {
    const similarity = cosineSimilarity(target, vectors[i]);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestIndex = i;
    }
  }
  
  return {
    index: bestIndex,
    similarity: bestSimilarity,
    distance: 1 - bestSimilarity
  };
}