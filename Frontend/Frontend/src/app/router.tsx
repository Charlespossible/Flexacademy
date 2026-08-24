import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { FullScreenLoader } from '@/components/shared/RouteGuards';
import { ProtectedRoute, PublicOnlyRoute, RoleGuard } from '@/components/shared/RouteGuards';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';

// ─── Lazy page imports ────────────────────────────────────────────────────────
// Public / marketing
const HomePage     = lazy(() => import('@/pages/HomePage'));
const ContactPage  = lazy(() => import('@/pages/Contact'));
const ExamPage     = lazy(() => import('@/pages/ExamsPage'));
const PricingPage  = lazy(() => import('@/pages/PricingPage'));

// Marketing — company, audience & legal pages
const AboutPage          = lazy(() => import('@/pages/marketing/AboutPage'));
const BlogPage           = lazy(() => import('@/pages/marketing/BlogPage'));
const CareersPage        = lazy(() => import('@/pages/marketing/CareersPage'));
const PressPage          = lazy(() => import('@/pages/marketing/PressPage'));
const HelpCentrePage     = lazy(() => import('@/pages/marketing/HelpCentrePage'));
const ReferralsPage      = lazy(() => import('@/pages/marketing/ReferralsPage'));
const CodingAiPage       = lazy(() => import('@/pages/marketing/CodingAiPage'));
const ForSchoolsPage     = lazy(() => import('@/pages/marketing/ForSchoolsPage'));
const ForParentsPage     = lazy(() => import('@/pages/marketing/ForParentsPage'));
const BecomeTutorPage    = lazy(() => import('@/pages/marketing/BecomeTutorPage'));
const LegalPage          = lazy(() => import('@/pages/marketing/LegalPage'));
const FeaturePreviewPage = lazy(() => import('@/pages/marketing/FeaturePreviewPage'));

// Auth pages
const LoginPage      = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage   = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPassword  = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const AuthCallback   = lazy(() => import('@/pages/auth/AuthCallbackPage'));
const VerifyEmail    = lazy(() => import('@/pages/auth/VerifyEmailPage'));
const OnboardingPage = lazy(() => import('@/pages/auth/OnboardingPage'));

// Core app pages
const DashboardPage       = lazy(() => import('@/pages/DashboardPage'));
const StudyDashboard      = lazy(() => import('@/pages/study/StudyDashboard'));
const ProfilePage         = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage        = lazy(() => import('@/pages/SettingsPage'));
const NotificationsPage   = lazy(() => import('@/pages/NotificationsPage'));
const LeaderboardPage     = lazy(() => import('@/pages/LeaderboardPage'));
const SubscriptionPage    = lazy(() => import('@/pages/SubscriptionPage'));

// Subject catalogue + progress
const ProgressPage        = lazy(() => import('@/pages/student/ProgressPage'));
const FlashcardsPage      = lazy(() => import('@/pages/student/FlashcardsPage'));
const CoursesPage         = lazy(() => import('@/pages/student/CoursesPage'));
const CourseDetailPage    = lazy(() => import('@/pages/student/CourseDetailPage'));
const LessonPlayerPage    = lazy(() => import('@/pages/student/LessonPlayerPage'));

// Student pipeline pages
const ExamSimulationPage  = lazy(() => import('@/pages/student/ExamSimulationPage'));
const GapDashboardPage    = lazy(() => import('@/pages/student/GapDashboardPage'));
const AiTutorPage         = lazy(() => import('@/pages/student/AiTutorPage'));

// Tutor portal pages
const TutorOnboardingPage   = lazy(() => import('@/pages/tutor/TutorOnboardingPage'));
const TutorDashboardPage    = lazy(() => import('@/pages/tutor/TutorDashboardPage'));
const InsightsDashboardPage = lazy(() => import('@/pages/tutor/InsightsDashboardPage'));
const MyCoursesPage         = lazy(() => import('@/pages/tutor/MyCoursesPage'));
const CourseEditorPage      = lazy(() => import('@/pages/tutor/CourseEditorPage'));

// Parent portal pages
const ParentDashboardPage = lazy(() => import('@/pages/parent/ParentDashboardPage'));

// Admin portal pages
const AdminDashboardPage      = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const TutorApplicationsPage   = lazy(() => import('@/pages/admin/TutorApplicationsPage'));
const AdminUsersPage          = lazy(() => import('@/pages/admin/AdminUsersPage'));
const CourseReviewPage       = lazy(() => import('@/pages/admin/CourseReviewPage'));

// ─── Suspense wrapper ─────────────────────────────────────────────────────────
function Page({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<FullScreenLoader />}>{children}</Suspense>;
}

/**
 * `/subjects` was retired in favour of the course catalogue, which already
 * filters by subject. These redirects keep old links, bookmarks and any
 * external references working instead of dropping them on a 404.
 */
function SubjectRedirect() {
  const { slug } = useParams();
  return <Navigate to={slug ? `/courses?subject=${slug}` : '/courses'} replace />;
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([

  // ── PUBLIC LAYOUT — Navbar + Footer, no auth required ─────────────────────
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Page><HomePage /></Page> },
      { path: '/exam', element: <Page><ExamPage /></Page> },
      { path: '/pricing', element: <Page><PricingPage /></Page> },
      { path: '/contact', element: <Page><ContactPage /></Page> },
      { path: '/study/dashboard', element: <Page><StudyDashboard /></Page> },

      // ── Company ────────────────────────────────────────────────────────
      { path: '/about',    element: <Page><AboutPage /></Page> },
      { path: '/blog',     element: <Page><BlogPage /></Page> },
      { path: '/careers',  element: <Page><CareersPage /></Page> },
      { path: '/press',    element: <Page><PressPage /></Page> },
      { path: '/help',     element: <Page><HelpCentrePage /></Page> },

      // ── Audience landing pages ─────────────────────────────────────────
      { path: '/for-schools',    element: <Page><ForSchoolsPage /></Page> },
      { path: '/for-parents',    element: <Page><ForParentsPage /></Page> },
      { path: '/become-a-tutor', element: <Page><BecomeTutorPage /></Page> },
      { path: '/referrals',      element: <Page><ReferralsPage /></Page> },
      { path: '/coding-ai',      element: <Page><CodingAiPage /></Page> },

      // Legacy / alternate paths kept alive so old links never 404
      { path: '/school',       element: <Navigate to="/for-schools" replace /> },
      { path: '/parent',       element: <Navigate to="/for-parents" replace /> },
      { path: '/tutors',       element: <Navigate to="/become-a-tutor" replace /> },
      { path: '/tutors/apply', element: <Navigate to="/become-a-tutor" replace /> },

      // StudyDashboard navigates to these; the dedicated pages were never built,
      // so point each at the equivalent page that does exist.
      { path: '/study/plans',       element: <Navigate to="/study-plans" replace /> },
      { path: '/study/flashcards',  element: <Navigate to="/flashcards" replace /> },
      { path: '/study/quiz',        element: <Navigate to="/exam/simulate" replace /> },
      { path: '/study/exams',       element: <Navigate to="/exam/simulate" replace /> },
      { path: '/progress/analytics', element: <Navigate to="/progress" replace /> },

      // ── Feature pages not yet shipped ──────────────────────────────────
      { path: '/questions',     element: <Page><FeaturePreviewPage feature="questions" /></Page> },
      { path: '/study-plans',   element: <Page><FeaturePreviewPage feature="study-plans" /></Page> },
      { path: '/live-classes',  element: <Page><FeaturePreviewPage feature="live-classes" /></Page> },
      { path: '/certificates',  element: <Page><FeaturePreviewPage feature="certificates" /></Page> },

      // /courses is now a real student page inside the authenticated layout.
      { path: '/quizzes', element: <Navigate to="/exam/simulate" replace /> },

      // ── Legal ──────────────────────────────────────────────────────────
      { path: '/privacy', element: <Page><LegalPage doc="privacy" /></Page> },
      { path: '/terms',   element: <Page><LegalPage doc="terms" /></Page> },
      { path: '/cookies', element: <Page><LegalPage doc="cookies" /></Page> },
    ],
  },

  // ── AUTH LAYOUT — no Navbar / Footer (focused auth flows) ─────────────────
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <PublicOnlyRoute><Page><LoginPage /></Page></PublicOnlyRoute>,
      },
      {
        path: '/register',
        element: <PublicOnlyRoute><Page><RegisterPage /></Page></PublicOnlyRoute>,
      },
      {
        path: '/forgot-password',
        element: <PublicOnlyRoute><Page><ForgotPassword /></Page></PublicOnlyRoute>,
      },
      {
        path: '/reset-password',
        element: <PublicOnlyRoute><Page><ResetPassword /></Page></PublicOnlyRoute>,
      },
      { path: '/auth/callback', element: <Page><AuthCallback /></Page> },
      { path: '/auth/verify/:token', element: <Page><VerifyEmail /></Page> },
    ],
  },

  // ── MAIN LAYOUT — auth required ───────────────────────────────────────────
  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/onboarding',     element: <Page><OnboardingPage /></Page> },
      { path: '/dashboard',      element: <Page><DashboardPage /></Page> },
      // Retired — the catalogue covers browsing by subject.
      { path: '/subjects',       element: <SubjectRedirect /> },
      { path: '/subjects/:slug', element: <SubjectRedirect /> },

      // ── Course catalogue & player ──────────────────────────────────────
      { path: '/courses',                          element: <Page><CoursesPage /></Page> },
      { path: '/courses/:id',                      element: <Page><CourseDetailPage /></Page> },
      { path: '/courses/:courseId/lessons/:lessonId', element: <Page><LessonPlayerPage /></Page> },
      { path: '/progress',       element: <Page><ProgressPage /></Page> },
      { path: '/flashcards',     element: <Page><FlashcardsPage /></Page> },
      { path: '/notifications',  element: <Page><NotificationsPage /></Page> },
      { path: '/leaderboard',    element: <Page><LeaderboardPage /></Page> },
      { path: '/subscription',   element: <Page><SubscriptionPage /></Page> },
      { path: '/profile',        element: <Page><ProfilePage /></Page> },
      { path: '/settings',       element: <Page><SettingsPage /></Page> },

      // ── Student pipeline ───────────────────────────────────────────────────
      {
        path: '/exam/simulate',
        element: (
          <RoleGuard roles={['STUDENT', 'ADMIN', 'SUPER_ADMIN']}>
            <Page><ExamSimulationPage /></Page>
          </RoleGuard>
        ),
      },
      {
        path: '/gaps',
        element: (
          <RoleGuard roles={['STUDENT', 'ADMIN', 'SUPER_ADMIN']}>
            <Page><GapDashboardPage /></Page>
          </RoleGuard>
        ),
      },
      {
        path: '/ai-tutor',
        element: (
          <RoleGuard roles={['STUDENT', 'TUTOR', 'ADMIN', 'SUPER_ADMIN']}>
            <Page><AiTutorPage /></Page>
          </RoleGuard>
        ),
      },

      // ── Tutor portal ───────────────────────────────────────────────────────
      {
        path: '/tutor/onboarding',
        element: (
          <RoleGuard roles={['TUTOR']}>
            <Page><TutorOnboardingPage /></Page>
          </RoleGuard>
        ),
      },
      {
        path: '/tutor/dashboard',
        element: (
          <RoleGuard roles={['TUTOR', 'ADMIN', 'SUPER_ADMIN']}>
            <Page><TutorDashboardPage /></Page>
          </RoleGuard>
        ),
      },
      {
        path: '/tutor/insights',
        element: (
          <RoleGuard roles={['TUTOR', 'ADMIN', 'SUPER_ADMIN']}>
            <Page><InsightsDashboardPage /></Page>
          </RoleGuard>
        ),
      },
      {
        path: '/tutor/courses',
        element: (
          <RoleGuard roles={['TUTOR']}>
            <Page><MyCoursesPage /></Page>
          </RoleGuard>
        ),
      },
      {
        path: '/tutor/courses/:id',
        element: (
          <RoleGuard roles={['TUTOR']}>
            <Page><CourseEditorPage /></Page>
          </RoleGuard>
        ),
      },

      // ── Parent portal ──────────────────────────────────────────────────────
      {
        path: '/parent/dashboard',
        element: (
          <RoleGuard roles={['PARENT', 'ADMIN', 'SUPER_ADMIN']}>
            <Page><ParentDashboardPage /></Page>
          </RoleGuard>
        ),
      },

      // ── Admin portal ───────────────────────────────────────────────────────
      {
        path: '/admin',
        element: (
          <RoleGuard roles={['ADMIN', 'SUPER_ADMIN']}>
            <Page><Navigate to="/admin/dashboard" replace /></Page>
          </RoleGuard>
        ),
      },
      {
        path: '/admin/dashboard',
        element: (
          <RoleGuard roles={['ADMIN', 'SUPER_ADMIN']}>
            <Page><AdminDashboardPage /></Page>
          </RoleGuard>
        ),
      },
      {
        path: '/admin/applications',
        element: (
          <RoleGuard roles={['ADMIN', 'SUPER_ADMIN']}>
            <Page><TutorApplicationsPage /></Page>
          </RoleGuard>
        ),
      },
      {
        path: '/admin/users',
        element: (
          <RoleGuard roles={['ADMIN', 'SUPER_ADMIN']}>
            <Page><AdminUsersPage /></Page>
          </RoleGuard>
        ),
      },
      {
        path: '/admin/courses',
        element: (
          <RoleGuard roles={['ADMIN', 'SUPER_ADMIN']}>
            <Page><CourseReviewPage /></Page>
          </RoleGuard>
        ),
      },
    ],
  },

  // ── 404 ───────────────────────────────────────────────────────────────────
  {
    path: '*',
    element: (
      <div className="min-h-dvh bg-base flex flex-col items-center justify-center gap-4 text-center p-8">
        <p className="font-display text-8xl font-bold text-accent/10 select-none">404</p>
        <h1 className="font-display text-2xl font-bold text-text-primary">Page not found</h1>
        <p className="text-text-muted text-sm max-w-xs">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <a
          href="/"
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-base-elevated text-sm font-semibold hover:bg-accent/90 transition-colors"
        >
          Back to home
        </a>
      </div>
    ),
  },
]);
