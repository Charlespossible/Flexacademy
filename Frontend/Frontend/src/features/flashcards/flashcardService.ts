import { api } from '@/lib/axios';
import type { DueFlashcard, DeckStats, ApiSuccess, ApiPaginated, FlashcardReviewResult } from '@/types';

/**
 * Flashcard Service — handles spaced repetition study
 * Integrates SM-2 algorithm responses from backend
 */
export const flashcardService = {
  /**
   * GET /api/v1/flashcards/due
   * Get flashcards due for review today (SM-2 scheduled)
   */
  async getDueFlashcards(params: { page?: number; limit?: number; deckId?: string } = {}) {
    const queryParams = {
      page: params.page || 1,
      limit: Math.min(params.limit || 20, 100),
      ...(params.deckId && { deckId: params.deckId }),
    };

    const res = await api.get<ApiPaginated<DueFlashcard>>('/flashcards/due', {
      params: queryParams,
    });
    return res.data;
  },

  /**
   * GET /api/v1/flashcards/decks/me
   * Get user's flashcard decks with statistics
   */
  async getUserDecks(page = 1, limit = 20) {
    const res = await api.get<ApiPaginated<DeckStats>>('/flashcards/decks/me', {
      params: { page, limit: Math.min(limit, 100) },
    });
    return res.data;
  },

  /**
   * POST /api/v1/flashcards/decks
   * Create a new flashcard deck
   */
  async createDeck(title: string, topicId?: string, description?: string) {
    const res = await api.post<ApiSuccess<DeckStats>>('/flashcards/decks', {
      title,
      topicId,
      description,
    });
    return res.data.data;
  },

  /**
   * GET /api/v1/flashcards/:id
   * Get a single flashcard details
   */
  async getFlashcard(cardId: string) {
    const res = await api.get<ApiSuccess<DueFlashcard>>(`/flashcards/${cardId}`);
    return res.data.data;
  },

  /**
   * POST /api/v1/flashcards/:id/review
   * Review a flashcard and get SM-2 calculations
   *
   * Quality scale:
   * - 0 (AGAIN): Complete blackout
   * - 1 (HARD): Serious difficulty
   * - 2/3 (GOOD): Correct with effort/hesitation
   * - 4 (EASY): Perfect response
   */
  async reviewFlashcard(cardId: string, result: FlashcardReviewResult) {
    const res = await api.post<
      ApiSuccess<{
        nextEF: number; // ease factor
        nextInterval: number; // days until next review
        nextReviewDate: string;
      }>
    >(`/flashcards/${cardId}/review`, { result });
    return res.data.data;
  },

  /**
   * DELETE /api/v1/flashcards/decks/:id
   * Delete a flashcard deck and all its cards
   */
  async deleteDeck(deckId: string): Promise<void> {
    await api.delete(`/flashcards/decks/${deckId}`);
  },

  /**
   * DELETE /api/v1/flashcards/:id
   * Delete a single flashcard
   */
  async deleteFlashcard(cardId: string): Promise<void> {
    await api.delete(`/flashcards/${cardId}`);
  },
};
