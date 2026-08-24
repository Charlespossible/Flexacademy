import { api } from '@/lib/axios';
import type { ApiSuccess, BookingStatus, TutorApplicationStatus } from '@/types';

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface TutorDashboardStudent {
  assignmentId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  subject: string;
  gradeLevel: string | null;
  curriculum: string | null;
  streakDays: number;
  openGaps: number;
  lastScore: number | null;
  startedAt: string;
}

export interface TutorDashboardBooking {
  id: string;
  subject: string;
  topic: string | null;
  scheduledAt: string;
  durationMins: number;
  status: BookingStatus;
  student: { id: string; firstName: string; lastName: string; avatar: string | null };
}

export interface TutorDashboardData {
  profile: {
    id: string;
    rating: number;
    totalReviews: number;
    totalSessions: number;
    isVerified: boolean;
    applicationStatus: TutorApplicationStatus;
  };
  stats: {
    unreadInsights: number;
    totalInsights: number;
    assignedStudents: number;
    upcomingBookings: number;
    completedSessions: number;
    monthlyEarnings: number;
    totalEarnings: number;
  };
  students: TutorDashboardStudent[];
  upcomingBookings: TutorDashboardBooking[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export interface TutorProfileUpdatePayload {
  bio: string;
  qualifications: string[];
  specializations: string[];
  subjectIds: string[];
  yearsOfExperience: number;
  hourlyRate: number;
}

export interface TutorApplicationPayload extends TutorProfileUpdatePayload {
  coverLetter?: string;
}

export const tutorService = {
  async getDashboard(): Promise<TutorDashboardData> {
    const res = await api.get<ApiSuccess<TutorDashboardData>>('/tutors/me/dashboard');
    return res.data.data;
  },

  async updateProfile(data: TutorProfileUpdatePayload): Promise<void> {
    await api.patch('/tutors/me', data);
  },

  // Saves profile fields + creates a formal TutorApplication in one request.
  // Backend sets applicationStatus → UNDER_REVIEW after this call.
  async submitApplication(data: TutorApplicationPayload): Promise<void> {
    await api.post('/tutors/apply', data);
  },
};
