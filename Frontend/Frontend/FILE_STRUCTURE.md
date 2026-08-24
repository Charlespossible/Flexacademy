# 📁 Study Dashboard - File Structure

```
Frontend/Frontend/src/
│
├── types/
│   └── index.ts
│       ├── ProgressOverview (interface)
│       ├── WeakArea (interface)
│       ├── SubjectProgress (interface)
│       ├── DueFlashcard (interface)
│       ├── DeckStats (interface)
│       └── DashboardStats (interface)
│
├── features/
│   ├── progress/
│   │   └── progressService.ts ⭐ NEW
│   │       ├── getUserProgress()
│   │       ├── getWeakAreas()
│   │       ├── getSubjectProgress()
│   │       ├── getTopicProgress()
│   │       └── getUserLeaderboardRank()
│   │
│   ├── flashcards/
│   │   └── flashcardService.ts ⭐ NEW
│   │       ├── getDueFlashcards()
│   │       ├── getUserDecks()
│   │       ├── createDeck()
│   │       ├── reviewFlashcard()
│   │       └── ... (more methods)
│   │
│   └── studyPlan/
│       └── studyPlanService.ts ⭐ NEW
│           ├── getUserStudyPlans()
│           ├── getStudyPlan()
│           ├── createStudyPlan()
│           ├── generateAiStudyPlan()
│           ├── updateStudyPlan()
│           └── ... (more methods)
│
├── stores/
│   ├── authStore.ts (existing)
│   ├── progressStore.ts ⭐ NEW
│   │   ├── State: overview, weakAreas, subjectProgress, isLoading
│   │   ├── Actions: setOverview, setWeakAreas, setLoading
│   │   └── Helpers: getTopWeakArea(), getTotalMastery(), getStreakStatus()
│   │
│   └── ... (other stores)
│
├── lib/
│   ├── queryClient.ts ⭐ UPDATED
│   │   └── queryKeys.progress (expanded with more granular keys)
│   │
│   └── axios.ts (existing)
│
├── components/
│   ├── shared/
│   │   ├── RouteGuards.tsx (existing)
│   │   └── Loader.tsx ⭐ NEW
│   │       ├── Spinner (component)
│   │       ├── FullScreenLoader (component)
│   │       └── SkeletonCard (component)
│   │
│   ├── layout/ (existing)
│   └── ui/ (existing)
│
├── pages/
│   ├── study/ ⭐ NEW DIRECTORY
│   │   ├── StudyDashboard.tsx ⭐ MAIN DASHBOARD PAGE
│   │   │   ├── Main component: StudyDashboard()
│   │   │   ├── Sub-components:
│   │   │   │   ├── WelcomeCard()
│   │   │   │   ├── StatCard()
│   │   │   │   ├── StatsGrid()
│   │   │   │   ├── WeakAreaCard()
│   │   │   │   ├── WeakAreasSection()
│   │   │   │   ├── QuickActionsSection()
│   │   │   │   └── RecentActivitySection()
│   │   │   └── Animations: FadeInUp()
│   │   │
│   │   ├── README.md ⭐ COMPREHENSIVE GUIDE
│   │   │   ├── Architecture overview
│   │   │   ├── Service layer docs
│   │   │   ├── Component structure
│   │   │   ├── Data loading patterns
│   │   │   ├── Features breakdown
│   │   │   ├── Animations explanation
│   │   │   ├── Responsive design
│   │   │   ├── Error handling
│   │   │   ├── Performance notes
│   │   │   ├── Security considerations
│   │   │   ├── Backend integration
│   │   │   ├── Usage instructions
│   │   │   ├── Testing checklist
│   │   │   └── Next phase planning
│   │   │
│   │   └── IMPLEMENTATION_GUIDE.md ⭐ QUICK START
│   │       ├── How to access
│   │       ├── Data flow diagram
│   │       ├── Upcoming pages
│   │       ├── API endpoints used
│   │       ├── Component structure
│   │       ├── Testing checklist
│   │       ├── Performance notes
│   │       ├── Auth flow
│   │       ├── Dependencies
│   │       └── Next steps
│   │
│   ├── DashboardPage.tsx (existing - can redirect to /study/dashboard)
│   └── ... (other pages)
│
├── app/
│   ├── router.tsx ⭐ UPDATED
│   │   └── Added route: /study/dashboard → StudyDashboard
│   │
│   └── providers.tsx (existing)
│
└── hooks/
    └── useAuth.ts (existing)

```

---

## 🎯 File Dependencies

```
StudyDashboard.tsx
    ├── imports from progressService.ts
    ├── imports from flashcardService.ts
    ├── imports from progressStore (Zustand)
    ├── imports from queryClient (queryKeys)
    ├── imports from Loader.tsx (Spinner)
    └── uses useAuthStore from authStore.ts

progressService.ts
    └── imports from @/lib/axios (api instance)

flashcardService.ts
    └── imports from @/lib/axios (api instance)

studyPlanService.ts
    └── imports from @/lib/axios (api instance)

progressStore.ts
    └── imports from zustand (create)

router.tsx
    └── imports StudyDashboard from @/pages/study/StudyDashboard
```

---

## 📊 Component Hierarchy

```
StudyDashboard (main page)
│
├─ WelcomeCard
│  ├─ Heading
│  └─ Two stat boxes (Streak, XP)
│
├─ StatsGrid
│  ├─ StatCard (Mastery)
│  ├─ StatCard (Topics)
│  ├─ StatCard (Time)
│  └─ StatCard (Badges)
│
├─ WeakAreasSection
│  ├─ Section header
│  ├─ WeakAreaCard (x6 visible)
│  │  ├─ Topic info
│  │  ├─ Mastery bar
│  │  ├─ Stats
│  │  └─ Study button
│  └─ View all button
│
├─ QuickActionsSection
│  ├─ Section header
│  └─ Action button (x4)
│     ├─ Icon
│     ├─ Label
│     ├─ Description
│     └─ Navigate handler
│
└─ RecentActivitySection
   ├─ Due flashcards card
   │  ├─ Count
   │  └─ CTA button
   └─ Active plans card
      ├─ Count
      └─ CTA button
```

---

## 🔗 Data Flow

```
User navigates to /study/dashboard
    ↓
StudyDashboard component mounts
    ↓
Three React Query hooks fire (parallel):
├─ overviewQuery (getUserProgress)
├─ weakAreasQuery (getWeakAreas)
└─ dueFlashcardsQuery (getDueFlashcards)
    ↓
Axios adds Bearer token to each request
    ↓
Backend returns:
├─ ProgressOverview
├─ WeakArea[]
└─ Paginated DueFlashcard[]
    ↓
useEffect() syncs data to Zustand store
    ↓
Components re-render with data
    ↓
Framer Motion animations trigger
    ↓
User sees fully rendered dashboard
```

---

## 🔧 Services: Quick Reference

### progressService
```typescript
import { progressService } from '@/features/progress/progressService';

await progressService.getUserProgress()
await progressService.getWeakAreas(limit)
await progressService.getSubjectProgress()
await progressService.getTopicProgress(subjectId)
await progressService.getUserLeaderboardRank()
```

### flashcardService
```typescript
import { flashcardService } from '@/features/flashcards/flashcardService';

await flashcardService.getDueFlashcards({ page, limit, deckId })
await flashcardService.getUserDecks(page, limit)
await flashcardService.createDeck(title, topicId, description)
await flashcardService.reviewFlashcard(cardId, result)
await flashcardService.getFlashcard(cardId)
```

### studyPlanService
```typescript
import { studyPlanService } from '@/features/studyPlan/studyPlanService';

await studyPlanService.getUserStudyPlans(status, page, limit)
await studyPlanService.getStudyPlan(planId)
await studyPlanService.createStudyPlan(title, targetDate, items)
await studyPlanService.generateAiStudyPlan(examCategory, targetDate)
await studyPlanService.updateStudyPlan(planId, updates)
await studyPlanService.completeStudyPlanItem(planId, itemId)
```

---

## 📚 Imports Cheat Sheet

```typescript
// Services
import { progressService } from '@/features/progress/progressService';
import { flashcardService } from '@/features/flashcards/flashcardService';
import { studyPlanService } from '@/features/studyPlan/studyPlanService';

// Store
import { useProgressStore } from '@/stores/progressStore';

// Query keys
import { queryKeys } from '@/lib/queryClient';

// Components
import { Spinner, FullScreenLoader, SkeletonCard } from '@/components/shared/Loader';

// Types
import type {
  ProgressOverview,
  WeakArea,
  SubjectProgress,
  DueFlashcard,
  DeckStats,
  StudyPlan,
} from '@/types';

// Router
import { useNavigate } from 'react-router-dom';
```

---

## ✅ Verification Checklist

- [x] Types defined in `src/types/index.ts`
- [x] Services created in `src/features/*/[name]Service.ts`
- [x] Store created in `src/stores/progressStore.ts`
- [x] Query keys enhanced in `src/lib/queryClient.ts`
- [x] Loader components in `src/components/shared/Loader.tsx`
- [x] StudyDashboard page in `src/pages/study/StudyDashboard.tsx`
- [x] Route added in `src/app/router.tsx`
- [x] README.md documentation
- [x] IMPLEMENTATION_GUIDE.md guide
- [x] All imports properly typed
- [x] Error handling included
- [x] Loading states included
- [x] Responsive design
- [x] Animations implemented

---

## 🚀 Ready to Use!

1. **Test the dashboard**: Navigate to `/study/dashboard`
2. **Check React Query Devtools**: See cached queries
3. **Inspect network**: Verify API calls
4. **Test responsive**: Resize browser window
5. **Test errors**: Disconnect internet to see error UI

Estimated implementation time: **~8 hours**
Estimated testing time: **~2 hours**

