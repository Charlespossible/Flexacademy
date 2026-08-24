import { api } from '@/lib/axios';
import type { ApiSuccess } from '@/types';

export type CourseStatus =
  | 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

export type ContentType =
  | 'VIDEO' | 'TEXT' | 'QUIZ' | 'FLASHCARD' | 'PAST_QUESTION' | 'LIVE_CLASS' | 'DOCUMENT';

/** A revision card as its author sees it — drafts included. */
export interface AuthoredCard {
  id: string;
  front: string;
  back: string;
  tags: string[];
  /** True when Claude drafted it. Drives the "AI draft" marker. */
  aiGenerated: boolean;
  /** False means students cannot see it yet. */
  isVerified: boolean;
  createdAt: string;
}

export interface LessonFlashcards {
  deck: { id: string; title: string; cardCount: number } | null;
  cards: AuthoredCard[];
  pendingReview: number;
  /** False when the lesson body is too short for Claude to draft from. */
  hasSourceContent: boolean;
}

export interface AuthoredLesson {
  id: string;
  title: string;
  slug: string;
  contentType: ContentType;
  content: string | null;
  videoUrl: string | null;
  videoPublicId: string | null;
  duration: number | null;
  order: number;
  isFree: boolean;
  isPublished: boolean;
}

export interface AuthoredCourse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  difficulty: string;
  gradeLevel: string | null;
  curriculum: string | null;
  status: CourseStatus;
  isPublished: boolean;
  totalLessons: number;
  totalDuration: number;
  reviewNote: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  subject: { id: string; name: string };
  lessons?: AuthoredLesson[];
}

/** Signed params for a direct browser → Cloudinary upload. */
export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  resourceType: 'video' | 'image';
  uploadUrl: string;
}

export interface CreateCoursePayload {
  subjectId: string;
  title: string;
  description?: string;
  difficulty?: string;
  gradeLevel?: string;
  curriculum?: string;
}

export interface CreateLessonPayload {
  title: string;
  contentType: ContentType;
  content?: string;
  videoPublicId?: string;
  topicId?: string;
  isFree?: boolean;
  isPublished?: boolean;
}

export const authoringService = {
  // ── Courses ───────────────────────────────────────────────────────────
  async listCourses(): Promise<AuthoredCourse[]> {
    const res = await api.get<ApiSuccess<AuthoredCourse[]>>('/authoring/courses');
    return res.data.data;
  },

  async getCourse(id: string): Promise<AuthoredCourse> {
    const res = await api.get<ApiSuccess<AuthoredCourse>>(`/authoring/courses/${id}`);
    return res.data.data;
  },

  async createCourse(payload: CreateCoursePayload): Promise<AuthoredCourse> {
    const res = await api.post<ApiSuccess<AuthoredCourse>>('/authoring/courses', payload);
    return res.data.data;
  },

  async updateCourse(id: string, payload: Partial<CreateCoursePayload> & { thumbnail?: string }): Promise<AuthoredCourse> {
    const res = await api.patch<ApiSuccess<AuthoredCourse>>(`/authoring/courses/${id}`, payload);
    return res.data.data;
  },

  async submitCourse(id: string): Promise<AuthoredCourse> {
    const res = await api.post<ApiSuccess<AuthoredCourse>>(`/authoring/courses/${id}/submit`);
    return res.data.data;
  },

  async withdrawCourse(id: string): Promise<AuthoredCourse> {
    const res = await api.post<ApiSuccess<AuthoredCourse>>(`/authoring/courses/${id}/withdraw`);
    return res.data.data;
  },

  async deleteCourse(id: string): Promise<void> {
    await api.delete(`/authoring/courses/${id}`);
  },

  // ── Lessons ───────────────────────────────────────────────────────────
  async createLesson(courseId: string, payload: CreateLessonPayload): Promise<AuthoredLesson> {
    const res = await api.post<ApiSuccess<AuthoredLesson>>(
      `/authoring/courses/${courseId}/lessons`, payload
    );
    return res.data.data;
  },

  async updateLesson(lessonId: string, payload: Partial<CreateLessonPayload>): Promise<AuthoredLesson> {
    const res = await api.patch<ApiSuccess<AuthoredLesson>>(
      `/authoring/lessons/${lessonId}`, payload
    );
    return res.data.data;
  },

  async reorderLessons(courseId: string, lessonIds: string[]): Promise<void> {
    await api.patch(`/authoring/courses/${courseId}/lessons/reorder`, { lessonIds });
  },

  async deleteLesson(lessonId: string): Promise<void> {
    await api.delete(`/authoring/lessons/${lessonId}`);
  },

  // ── Uploads ───────────────────────────────────────────────────────────
  async getUploadSignature(resourceType: 'video' | 'image' = 'video'): Promise<UploadSignature> {
    const res = await api.post<ApiSuccess<UploadSignature>>(
      '/authoring/uploads/sign', { resourceType }
    );
    return res.data.data;
  },

  /**
   * Upload straight to Cloudinary using a server-issued signature.
   *
   * Deliberately uses XHR rather than fetch: we need upload progress events for
   * multi-hundred-megabyte lesson videos, and fetch has no upload progress.
   * Returns the publicId, which is what the lesson endpoints verify against.
   */
  uploadToCloudinary(
    file: File,
    sig: UploadSignature,
    onProgress?: (percent: number) => void
  ): Promise<{ publicId: string; secureUrl: string; durationSecs: number | null }> {
    return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append('file', file);
      form.append('api_key', sig.apiKey);
      form.append('timestamp', String(sig.timestamp));
      form.append('signature', sig.signature);
      form.append('folder', sig.folder);
      form.append('public_id', sig.publicId);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', sig.uploadUrl);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const r = JSON.parse(xhr.responseText);
            resolve({
              publicId: r.public_id,
              secureUrl: r.secure_url,
              durationSecs: typeof r.duration === 'number' ? Math.round(r.duration) : null,
            });
          } catch {
            reject(new Error('Cloudinary returned an unreadable response.'));
          }
        } else {
          reject(new Error(`Upload failed (${xhr.status}).`));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed. Check your connection.'));
      xhr.send(form);
    });
  },

  // ── Flashcards ────────────────────────────────────────────────────────────
  // The tutor side. Unlike the student endpoints these return unverified
  // drafts, because reviewing them is the whole job here.

  /** GET /authoring/lessons/:id/flashcards */
  async getLessonFlashcards(lessonId: string): Promise<LessonFlashcards> {
    const res = await api.get<ApiSuccess<LessonFlashcards>>(
      `/authoring/lessons/${lessonId}/flashcards`
    );
    return res.data.data;
  },

  /** POST /authoring/lessons/:id/flashcards/generate — Claude drafts them */
  async generateFlashcards(
    lessonId: string,
    count = 15
  ): Promise<{ deckId: string; generated: number }> {
    const res = await api.post<ApiSuccess<{ deckId: string; generated: number }>>(
      `/authoring/lessons/${lessonId}/flashcards/generate`,
      { count }
    );
    return res.data.data;
  },

  /** POST /authoring/lessons/:id/flashcards — hand-written, trusted immediately */
  async addFlashcard(lessonId: string, front: string, back: string): Promise<AuthoredCard> {
    const res = await api.post<ApiSuccess<AuthoredCard>>(
      `/authoring/lessons/${lessonId}/flashcards`,
      { front, back }
    );
    return res.data.data;
  },

  /** PATCH /authoring/flashcards/:id — edit, and/or approve via isVerified */
  async updateFlashcard(
    cardId: string,
    patch: { front?: string; back?: string; isVerified?: boolean }
  ): Promise<AuthoredCard> {
    const res = await api.patch<ApiSuccess<AuthoredCard>>(
      `/authoring/flashcards/${cardId}`,
      patch
    );
    return res.data.data;
  },

  /** DELETE /authoring/flashcards/:id */
  async deleteFlashcard(cardId: string): Promise<void> {
    await api.delete(`/authoring/flashcards/${cardId}`);
  },

  /** POST /authoring/lessons/:id/flashcards/verify-all */
  async verifyAllFlashcards(lessonId: string): Promise<{ verified: number }> {
    const res = await api.post<ApiSuccess<{ verified: number }>>(
      `/authoring/lessons/${lessonId}/flashcards/verify-all`
    );
    return res.data.data;
  },
};
