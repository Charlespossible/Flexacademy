import { api } from '@/lib/axios';
import type { ApiSuccess, ApiPaginated, TutorApplicationStatus } from '@/types';

// ─── Shapes ───────────────────────────────────────────────────────────────────

export interface AdminStats {
  users: {
    total: number;
    students: number;
    tutors: number;
    parents: number;
    admins: number;
  };
  applications: {
    pending: number;
    approved: number;
  };
  recentSignups: number;
  paidSubscriptions: number;
}

export type AdminCourseStatus =
  | 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

/** A tutor-submitted course as the review queue sees it, lessons included. */
export interface AdminCourseSubmission {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  difficulty: string;
  status: AdminCourseStatus;
  totalLessons: number;
  totalDuration: number;
  submittedAt: string | null;
  reviewNote: string | null;
  subject: { id: string; name: string };
  tutorProfile: {
    id: string;
    user: { firstName: string; lastName: string; email: string; avatar: string | null };
  } | null;
  lessons: {
    id: string;
    title: string;
    contentType: string;
    videoUrl: string | null;
    duration: number | null;
    order: number;
    isFree: boolean;
  }[];
}

export interface AdminApplication {
  id: string;
  status: TutorApplicationStatus;
  coverLetter: string | null;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  submittedAt: string;
  tutorProfile: {
    id: string;
    bio: string | null;
    qualifications: string[];
    specializations: string[];
    subjects: { id: string; name: string }[];
    yearsOfExperience: number;
    hourlyRate: number | null;
    applicationStatus: TutorApplicationStatus;
    isVerified: boolean;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar: string | null;
      createdAt: string;
      isActive: boolean;
    };
  };
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  /** Hard deactivation — cannot sign in at all. */
  isActive: boolean;
  /** Soft suspension: set means suspended. The user can still sign in. */
  suspendedAt: string | null;
  suspensionReason: string | null;
  isEmailVerified: boolean;
  avatar: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  tutorProfile: { isVerified: boolean; applicationStatus: TutorApplicationStatus } | null;
  subscription: { tier: string; status: string } | null;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const res = await api.get<ApiSuccess<AdminStats>>('/admin/stats');
    return res.data.data;
  },

  async getTutorApplications(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ applications: AdminApplication[]; pagination: Pagination }> {
    const res = await api.get('/admin/tutors/applications', { params });
    return res.data.data;
  },

  async reviewApplication(
    tutorProfileId: string,
    action: 'approve' | 'reject',
    reviewNote?: string
  ): Promise<void> {
    await api.patch(`/admin/tutors/${tutorProfileId}/approve`, { action, reviewNote });
  },

  async getUsers(params?: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<{ users: AdminUser[]; pagination: Pagination }> {
    const res = await api.get('/admin/users', { params });
    return res.data.data;
  },

  /**
   * Suspend or reinstate a user.
   * `reason` is required when suspending — it is shown to the user on their
   * dashboard, so the API rejects a suspension without one.
   */
  async toggleUserSuspension(
    userId: string,
    suspend: boolean,
    reason?: string
  ): Promise<void> {
    await api.post(`/admin/users/${userId}/suspend`, { suspend, reason });
  },

  // ── Content review ────────────────────────────────────────────────────
  /** GET /admin/courses — submissions awaiting review (default PENDING_REVIEW) */
  async getCourseSubmissions(params: {
    status?: AdminCourseStatus;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiPaginated<AdminCourseSubmission>> {
    const res = await api.get<ApiPaginated<AdminCourseSubmission>>('/admin/courses', { params });
    return res.data;
  },

  /** PATCH /admin/courses/:id/review — approve or reject submitted content */
  async reviewCourse(
    courseId: string,
    action: 'approve' | 'reject',
    reviewNote?: string
  ): Promise<void> {
    await api.patch(`/admin/courses/${courseId}/review`, { action, reviewNote });
  },
};
