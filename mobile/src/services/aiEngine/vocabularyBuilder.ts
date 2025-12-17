/**
 * Vocabulary Builder
 * Builds vocabulary from training data for bag-of-words model
 */

import { TRAINING_DATA } from './trainingData';

const STOP_WORDS = new Set([
  // Articles
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'l',
  // Prepositions
  'à', 'au', 'aux', 'en', 'dans', 'sur', 'sous', 'avec', 'sans', 'pour', 'par',
  // Pronouns
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
  'me', 'te', 'se', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
  'ce', 'cette', 'ces', 'cet',
  // Verbs
  'est', 'sont', 'être', 'avoir', 'a', 'ai', 'as', 'ont',
  // Conjunctions
  'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car',
  // Other common words
  'ne', 'pas', 'plus', 'très', 'tout', 'tous', 'toute', 'toutes',
  'c', 'd', 'qu', 'n', 's', 't', 'y',
]);

export class VocabularyBuilder {
  private vocabulary: Map<string, number> = new Map();
  private wordFrequency: Map<string, number> = new Map();
  private vocabularySize: number = 500;

  constructor(vocabularySize: number = 500) {
    this.vocabularySize = vocabularySize;
  }

  /**
   * Build vocabulary from training data
   */
  build(): Map<string, number> {
    // Count word frequencies
    for (const example of TRAINING_DATA) {
      const words = this.tokenize(example.text);
      for (const word of words) {
        if (!STOP_WORDS.has(word) && word.length > 2) {
          const count = this.wordFrequency.get(word) || 0;
          this.wordFrequency.set(word, count + 1);
        }
      }
    }

    // Sort by frequency and take top N words
    const sortedWords = Array.from(this.wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.vocabularySize);

    // Build vocabulary map (word -> index)
    sortedWords.forEach(([word], index) => {
      this.vocabulary.set(word, index);
    });

    console.log(`📚 Vocabulary built: ${this.vocabulary.size} words`);
    console.log(`Most common words:`, Array.from(sortedWords.slice(0, 20).map(([w, f]) => `${w}(${f})`)));

    return this.vocabulary;
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .normalize('NFD') // Normalize accents
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Convert text to vector (bag of words)
   */
  textToVector(text: string, vocabulary: Map<string, number>): number[] {
    const vector = new Array(this.vocabularySize).fill(0);
    const words = this.tokenize(text);

    for (const word of words) {
      const index = vocabulary.get(word);
      if (index !== undefined && index < this.vocabularySize) {
        vector[index] = 1; // Binary bag of words
      }
    }

    return vector;
  }

  /**
   * Get vocabulary
   */
  getVocabulary(): Map<string, number> {
    if (this.vocabulary.size === 0) {
      this.build();
    }
    return this.vocabulary;
  }

  /**
   * Get word frequency
   */
  getWordFrequency(word: string): number {
    return this.wordFrequency.get(word.toLowerCase()) || 0;
  }

  /**
   * Check if word is in vocabulary
   */
  hasWord(word: string): boolean {
    return this.vocabulary.has(word.toLowerCase());
  }

  /**
   * Get vocabulary size
   */
  size(): number {
    return this.vocabulary.size;
  }

  /**
   * Save vocabulary to storage
   */
  toJSON(): any {
    return {
      vocabulary: Array.from(this.vocabulary.entries()),
      wordFrequency: Array.from(this.wordFrequency.entries()),
      vocabularySize: this.vocabularySize
    };
  }

  /**
   * Load vocabulary from storage
   */
  fromJSON(data: any): void {
    this.vocabulary = new Map(data.vocabulary);
    this.wordFrequency = new Map(data.wordFrequency);
    this.vocabularySize = data.vocabularySize;
  }
}

// Create singleton instance
export const vocabularyBuilder = new VocabularyBuilder(500);
