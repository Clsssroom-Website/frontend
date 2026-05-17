# Classroom Interface Refactoring Plan

The current implementation of the classroom module has a monolithic structure (`Classes.tsx`, `useClasses.ts`) that manages states and API fetching for both Teacher and Student roles using conditional logic. Additionally, the API calling structure violates RESTful standards and SOLID principles (e.g., mixing `fetch` and `axiosClient`, embedding logic inside service fetchers). 

This plan details how we will refactor the code to make it clean, scalable, maintainable, and highly testable. It also incorporates a unified API approach as requested.

## User Review Required

> [!TIP]
> **Unified API Endpoint**: Yes, using a single `/api/v1/classes` endpoint and letting the backend decide what data to return based on the user's role (token) is a widely accepted RESTful best practice. It simplifies the client-side logic significantly. I've reviewed your backend code (`classController.ts`), and it already implements this check inside `getAllClasses`!
>
> We will update the plan to use this unified endpoint for both students and teachers, and we will clean up the redundant student route on the backend.

## Proposed Changes

### Backend Route Cleanup
Removing redundant routes since `classController.ts` already handles the unified logic.

#### [MODIFY] `backend/src/routes/studentRoutes.ts`
- Remove `router.get("/classes", authMiddleware, getEnrolledClasses);` since students will now call `/api/v1/classes` handled by `classRoutes.ts`.
- The frontend will now solely rely on `classRoutes.ts` for fetching classes.

---

### API Layer Restructuring
Moving API calls into a unified, RESTful service without internal business logic.

#### [MODIFY] `frontend/src/services/classroomService.ts`
- Update `getClasses()` to call `GET /api/v1/classes` without needing a `role` parameter.
- Move `createClass` and `joinClass` functions from their respective modals into this service.
- Return raw promise data from `axiosClient` so the caller handles logic (removing `data.success ? data.data : []` from inside the service).

#### [MODIFY] `frontend/src/components/classes/CreateClassModal.tsx` & `JoinClassModal.tsx`
- Refactor to use the newly defined methods in `classroomService`.
- Remove native `fetch` from `JoinClassModal` to consistently use `axiosClient`.

---

### Custom Hooks Separation
Adhering to the Single Responsibility Principle (SRP) for data fetching and state management.

#### [NEW] `frontend/src/hooks/useClassroomsData.ts`
- A generic hook that takes a fetch function (e.g., `getClasses`) and manages `loading`, `error`, and `data` states.

#### [NEW] `frontend/src/hooks/useClassroomFilters.ts`
- Extracts filtering logic (`searchQuery`, `statusFilter`) away from the main hook.

#### [DELETE] `frontend/src/hooks/useClasses.ts`
- Replaced by the separated hooks mentioned above.

---

### UI Components Refactoring
Applying the Open/Closed Principle and creating reusable presentation components.

#### [MODIFY] `frontend/src/components/classes/ClassroomCard.tsx`
- Remove the `role` prop dependency.
- Add an `actions?: React.ReactNode` and `linkTo: string` prop so the parent component can inject specific buttons (e.g., Delete/Copy Link for Teacher, or none for Student) without the card needing conditional role logic.

#### [NEW] `frontend/src/pages/classes/ClassesLayout.tsx`
- A shared presentation layout component containing the UI skeleton: title, description, Action Button (Create/Join), Search, Filter, and the Grid rendering logic.

#### [NEW] `frontend/src/pages/teacher/classes/TeacherClasses.tsx`
- Acts as the Controller for Teacher. Uses `classroomService.getClasses()`.
- Renders `ClassesLayout` and injects Teacher-specific action buttons and Modals.

#### [NEW] `frontend/src/pages/student/classes/StudentClasses.tsx`
- Acts as the Controller for Student. Uses `classroomService.getClasses()`.
- Renders `ClassesLayout` and injects Student-specific action buttons and Modals.

#### [DELETE] `frontend/src/pages/classes/Classes.tsx`
- Replaced by `TeacherClasses.tsx` and `StudentClasses.tsx`.

---

### App Routing Updates

#### [MODIFY] `frontend/src/App.tsx`
- Update routes `/teacher/classes` and `/student/classes` to map to the new specialized pages.
- Clean up duplicate unauthenticated route definitions for `/teacher/classes` and `/student/classes` that are currently defined outside of `<AuthGuard>`.

## Verification Plan

### Manual Verification
- Log in as a Teacher and verify the classes list loads correctly, the "Create Class" button works, and "Copy Link" / "Delete" actions work.
- Log in as a Student and verify the classes list loads correctly, the "Join Class" button works using the API service.
- Verify filtering and searching works accurately on both pages.
- Check browser network tabs to ensure API calls are directed to the correct REST endpoints with proper `Authorization` headers via `axiosClient`.
