import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import type { ApiSuccess, ApiPaginated } from '@/types';

export type LessonContentType =
  | 'VIDEO' | 'TEXT' | 'QUIZ' | 'FLASHCARD' | 'PAST_QUESTION' | 'LIVE_CLASS' | 'DOCUMENT';

/** The tutor who authored a course, as students see them. */
export interface CourseTutor {
  id: string;
  bio?: string | null;
  isVerified: boolean;
  rating: number | string;
  totalReviews?: number;
  yearsOfExperience?: number;
  specializations?: string[];
  user: { firstName: string; lastName: string; avatar: string | null };
}

/** Where a student should be sent back to in a course they have started. */
export interface ResumePoint {
  lessonId: string;
  title: string;
  duration: number | null;
  watchedSecs: number;
  /** False when the lesson has never been opened — the CTA reads "Start". */
  hasStarted: boolean;
  lastAccessedAt: string | null;
}

export interface CatalogueCourse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  difficulty: string;
  gradeLevel: string | null;
  totalLessons: number;
  totalDuration: number;
  subject: { id: string; name: string; icon: string | null; slug: string };
  tutorProfile: CourseTutor | null;
  _count?: { enrollments: number; lessons: number };
  /** Present on the "my learning" list only. */
  progress?: number;
  enrolledAt?: string | null;
  isCompleted?: boolean;
  /** Present on the "my learning" list only. Null once every lesson is done. */
  resume?: ResumePoint | null;
}

export interface SyllabusLesson {
  id: string;
  title: string;
  slug: string;
  order: number;
  isFree: boolean;
  contentType: LessonContentType;
  duration: number | null;
}

export interface CourseDetail extends CatalogueCourse {
  lessons: SyllabusLesson[];
  isEnrolled: boolean;
  enrolledAt: string | null;
  progress: number;
  reviews: { id: string; rating: number; comment: string | null; createdAt: string }[];
}

export interface LessonDetail {
  id: string;
  courseId: string;
  title: string;
  contentType: LessonContentType;
  content: string | null;
  videoUrl: string | null;
  duration: number | null;
  order: number;
  isFree: boolean;
  course: { id: string; title: string; slug: string };
  topic: { id: string; name: string } | null;
  isCompleted: boolean;
  watchedSeconds: number;
  isBookmarked: boolean;
}

export const courseService = {
  /** GET /courses/courses — public catalogue */
  async getCourses(params: {
    subject?: string;
    difficulty?: string;
    grade?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiPaginated<CatalogueCourse>> {
    const res = await api.get<ApiPaginated<CatalogueCourse>>('/courses/courses', { params });
    return res.data;
  },

  /** GET /courses/courses/me/enrolled — the student's own courses */
  async getMyCourses(): Promise<CatalogueCourse[]> {
    const res = await api.get<ApiSuccess<CatalogueCourse[]>>('/courses/courses/me/enrolled');
    return res.data.data;
  },

  /** GET /courses/courses/:id — detail with syllabus and enrolment state */
  async getCourse(id: string): Promise<CourseDetail> {
    const res = await api.get<ApiSuccess<CourseDetail>>(`/courses/courses/${id}`);
    return res.data.data;
  },

  /** POST /courses/courses/:id/enroll */
  async enroll(courseId: string): Promise<void> {
    await api.post(`/courses/courses/${courseId}/enroll`);
  },

  /** GET /lessons/:id — a single lesson with the viewer's progress */
  async getLesson(lessonId: string): Promise<LessonDetail> {
    const res = await api.get<ApiSuccess<LessonDetail>>(`/lessons/${lessonId}`);
    return res.data.data;
  },

  /** POST /lessons/:id/complete */
  async completeLesson(lessonId: string, watchedSecs?: number): Promise<void> {
    await api.post(`/lessons/${lessonId}/complete`, { watchedSecs });
  },

  /** POST /lessons/:id/progress — heartbeat while playing. Never completes. */
  async saveProgress(lessonId: string, watchedSecs: number): Promise<void> {
    await api.post(`/lessons/${lessonId}/progress`, { watchedSecs });
  },

  /**
   * Last-gasp save when the tab is closing.
   *
   * A normal XHR is cancelled the moment the document starts unloading, so the
   * final position would be lost — precisely the case resume exists for.
   * `keepalive` hands the request to the browser to finish after the page is
   * gone, and unlike `sendBeacon` it can still carry the Authorization header,
   * so no token has to be smuggled through the request body.
   */
  flushProgressOnUnload(lessonId: string, watchedSecs: number): void {
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';
    // Read the live token from the store, the same source the axios
    // interceptor uses — not a localStorage key, which may be stale or absent.
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    void fetch(`${base}/lessons/${lessonId}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ watchedSecs }),
      keepalive: true,
    }).catch(() => {
      // Nothing useful to do — the page is going away.
    });
  },

  /** POST /lessons/:id/bookmark — toggles */
  async toggleBookmark(lessonId: string): Promise<void> {
    await api.post(`/lessons/${lessonId}/bookmark`);
  },
};
