# Accessible Knowledge Base Build Todo

This todo file breaks the project into step-by-step implementation phases. Each step includes a suggested prompt that can be used to continue building the project in a structured way, with frontend and backend integration happening together.

## Step 1: Initialize Project Structure

Create the base MERN project structure with separate `backend` and `frontend` folders.

Backend tasks:
- Initialize Node.js project.
- Install Express, Mongoose, dotenv, cors, bcryptjs, jsonwebtoken, multer, cloudinary, and other required packages.
- Set up basic Express server.
- Add environment variable support.
- Add MongoDB connection file.

Frontend tasks:
- Create React app with Vite.
- Install Tailwind CSS.
- Set up routing with React Router.
- Create basic layout structure.
- Configure API base URL.

Prompt:
```text
Set up the MERN project structure for Accessible Knowledge Base. Initialize the backend with Express, MongoDB connection, dotenv, CORS, and a health check route. Initialize the frontend with Vite React, Tailwind CSS, React Router, and a basic layout. Make sure frontend can call the backend health check endpoint.
```

## Step 2: Authentication and User Roles

Build authentication for staff and HR/admin users.

Backend tasks:
- Create User model.
- Add fields for name, email, password, role, department, staffId, and position.
- Implement register, login, and profile routes.
- Hash passwords with bcrypt.
- Generate JWT tokens.
- Add authentication middleware.
- Add role authorization middleware.

Frontend tasks:
- Create login page.
- Create protected route handling.
- Store authenticated user state.
- Redirect users based on role.
- Create staff dashboard shell.
- Create HR/admin dashboard shell.

Prompt:
```text
Build authentication for the LMS. Create backend user model, register/login/profile APIs, JWT middleware, and role-based authorization for staff and HR/admin. On the frontend, create login, protected routes, auth state management, and separate dashboard layouts for staff and HR/admin.
```

## Step 3: Staff Management for HR

Allow HR/admin to manage staff records.

Backend tasks:
- Add HR/admin routes to list staff.
- Add route to create staff account.
- Add route to update staff details.
- Add route to activate or deactivate staff.
- Add staff search and filtering.

Frontend tasks:
- Create HR staff management page.
- Add staff table.
- Add create/edit staff form.
- Add search and filter UI.
- Add activate/deactivate actions.

Prompt:
```text
Create staff management for the HR/admin panel. Backend should support listing, creating, updating, searching, and activating/deactivating staff. Frontend should include a staff management table, create/edit form, filters, and actions connected to the backend APIs.
```

## Step 4: Cloudinary File Upload Setup

Set up file upload storage for learning materials.

Backend tasks:
- Configure Cloudinary.
- Configure multer for file uploads.
- Create upload middleware.
- Add protected upload endpoint for HR/admin.
- Return file URL, public ID, original filename, file type, and size.

Frontend tasks:
- Create reusable file upload component.
- Connect upload component to backend.
- Show upload progress or loading state.
- Display uploaded file preview or file link.

Prompt:
```text
Add Cloudinary file upload support. Configure Cloudinary and multer on the backend with a protected HR/admin upload endpoint. On the frontend, create a reusable upload component that sends files to the backend and displays the uploaded file details.
```

## Step 5: Learning Materials Module

Create the core learning system with **frontend-managed course content** (organized folders per course) plus backend support for additional HR-uploaded materials.

### Implemented

Backend:
- [x] Material model (title, description, category, tags, audience, file data, createdBy, status, timestamps, courseSlug).
- [x] CRUD routes — admin create/update/delete; HR list; staff published list and detail.
- [x] `GET /api/materials/published` — staff catalog (DB materials + course metadata).
- [x] Course catalog metadata in `backend/src/data/courses.js` (synced with frontend courses).

Frontend course structure (`frontend/src/courses/`):
- [x] One folder per course with `index.js` and `chapters/` subfolder.
- [x] **AI for staff** — `ai-for-staff/` (5 chapters: introduction, responsible use, tools, writing/research, security).
- [x] **Finance** — `finance/` (4 chapters: literacy, budgeting, invoicing, integrity).
- [x] **Company history** — `company-history/` (4 chapters from [Accessible Publishers About Us](https://accessiblepublishers.com/about-us/): origins, growth, vision/mission/VICAP, industry).
- [x] Central registry in `courses/index.js`.

Staff-facing UI:
- [x] Home page lists all courses (course cards).
- [x] Course outline page (`/courses/:courseId`) — chapter/module list (public).
- [x] Chapter reader (`/courses/:courseId/chapters/:chapterId`) — staff/HR/admin must sign in to read.
- [x] Staff dashboard shows assigned courses.
- [x] `CourseCard`, `ChapterContent`, prev/next chapter navigation.

### Remaining (optional / later steps)

Backend:
- [ ] Cloudinary file upload on materials (Step 4 dependency).

Frontend:
- [ ] HR material management page (add/edit/publish DB materials beyond built-in courses).
- [ ] Connect Cloudinary upload to material creation.
- [ ] Chapter completion / progress tracking (overlaps Step 9).

Prompt:
```text
Build the learning materials module. Course content lives in frontend/src/courses/ with one folder per course (ai-for-staff, finance, company-history) and chapters as separate files. Home page lists courses; staff open a course to see modules and read each chapter when signed in. Backend Material model supports HR/admin CRUD and staff published list for additional uploads. Company history content should align with https://accessiblepublishers.com/about-us/
```

## Step 6: Material Sections

Allow uploaded or inserted materials to be broken into learning sections.

Backend tasks:
- Create Section model or embed sections inside Material model.
- Add section title, content, order, estimated reading time, and optional media.
- Add routes to create, update, delete, and reorder sections.
- Add route to fetch material with ordered sections.

Frontend tasks:
- Create section editor for HR/admin.
- Add reorder controls.
- Create staff section reader.
- Add progress indicator while reading sections.

Prompt:
```text
Add section-based learning. Backend should allow each material to have ordered sections with title, content, reading time, and optional media. Frontend should include an HR section editor and a staff section reader with progress display.
```

## Step 7: Assessments and Questions

Add optional assessments to selected materials.

Backend tasks:
- Create Assessment model.
- Link assessment to material.
- Add question types such as multiple choice and true/false.
- Store questions, options, correct answers, pass mark, duration, and attempt settings.
- Add HR/admin CRUD routes for assessments.
- Add staff route to fetch assessment without correct answers.

Frontend tasks:
- Create HR assessment builder.
- Add question creation form.
- Link assessment to material.
- Show assessment availability on material detail page.
- Create staff assessment start page.

Prompt:
```text
Build optional assessments for materials. Backend should support assessment CRUD, question management, pass mark, duration, and staff-safe assessment fetching without correct answers. Frontend should include an HR assessment builder and staff assessment start flow linked to materials.
```

## Step 8: Assessment Submission and Results

Allow staff to submit assessments and view scores.

Backend tasks:
- Create Result or Submission model.
- Store user, material, assessment, answers, score, percentage, pass/fail status, and submittedAt.
- Add route to submit assessment.
- Auto-grade objective questions.
- Add staff route to view own results.
- Add HR/admin route to view all results.

Frontend tasks:
- Create assessment taking interface.
- Submit answers to backend.
- Show staff result after submission.
- Create staff results page.
- Create HR results dashboard.

Prompt:
```text
Implement assessment submission and results. Backend should grade submitted answers, store results, allow staff to view their own results, and allow HR/admin to view all staff results. Frontend should include the assessment taking UI, result summary page, staff result history, and HR results dashboard.
```

## Step 9: Learning Progress Tracking

Track what each staff member has read or completed.

Backend tasks:
- Create Progress model.
- Track completed sections per material.
- Track startedAt, lastViewedAt, and completedAt.
- Add route to update section progress.
- Add route to get staff learning progress.
- Add HR/admin route to view staff progress.

Frontend tasks:
- Add mark-as-complete behavior in section reader.
- Show material progress on staff dashboard.
- Show learning history.
- Add HR progress reporting view.

Prompt:
```text
Add learning progress tracking. Backend should track completed sections, started materials, last viewed time, and completed materials. Frontend should let staff mark sections complete, show progress on dashboards, and give HR visibility into staff learning progress.
```

## Step 10: Company Profile and Product Knowledge Pages

Create dedicated areas for company information and product learning.

Backend tasks:
- Add categories or content types for company profile and product knowledge.
- Add routes to fetch public internal content by type.
- Allow HR/admin to manage these content groups.

Frontend tasks:
- Create company profile page.
- Create product knowledge page.
- Filter materials by type or category.
- Add navigation links.

Prompt:
```text
Create company profile and product knowledge areas. Backend should support categorizing materials by company profile, product knowledge, and other learning types. Frontend should add dedicated pages and navigation for staff to browse these content areas.
```

## Step 11: Dashboard Reports

Create useful summaries for staff and HR/admin.

Backend tasks:
- Add staff dashboard summary endpoint.
- Add HR dashboard summary endpoint.
- Return counts for materials, completed learning, assessments taken, pass/fail rates, and recent activity.

Frontend tasks:
- Build staff dashboard cards.
- Build HR/admin dashboard cards.
- Add recent activity sections.
- Add simple charts if needed.

Prompt:
```text
Build dashboard summaries. Backend should provide summary endpoints for staff and HR/admin with learning, material, assessment, result, and activity counts. Frontend should display dashboard cards, recent activity, and simple reporting summaries.
```

## Step 12: UI Polish and Responsive Design

Improve the user interface and make the site easy to use.

Backend tasks:
- Standardize API error responses.
- Add pagination where needed.
- Add request validation.

Frontend tasks:
- Improve Tailwind styling.
- Add loading and empty states.
- Add error messages.
- Make all pages responsive.
- Create consistent buttons, forms, cards, and tables.

Prompt:
```text
Polish the LMS UI and API behavior. Standardize backend validation and error responses, add pagination where useful, and improve the frontend with responsive Tailwind layouts, loading states, empty states, error handling, and reusable UI components.
```

## Step 13: Security and Access Control Review

Make sure users only access what they should.

Backend tasks:
- Verify protected routes.
- Verify HR/admin-only routes.
- Prevent staff from seeing correct assessment answers.
- Prevent staff from accessing other staff results.
- Validate uploaded file types and sizes.

Frontend tasks:
- Hide unauthorized navigation links.
- Handle forbidden API responses.
- Redirect users away from unauthorized pages.

Prompt:
```text
Review and harden security for the LMS. Check all backend routes for authentication and role authorization, protect assessment answers and staff results, validate uploads, and update the frontend so unauthorized users cannot access restricted pages.
```

## Step 14: Testing

Add tests for the most important workflows.

Backend tasks:
- Test authentication.
- Test material CRUD.
- Test assessment creation.
- Test assessment submission and grading.
- Test role-based access control.

Frontend tasks:
- Test login flow.
- Test protected routes.
- Test material browsing.
- Test assessment submission.
- Test HR/admin management flows.

Prompt:
```text
Add focused tests for the LMS. Cover backend authentication, role access, material management, assessment grading, and results. Cover frontend login, protected routes, material browsing, assessment submission, and HR/admin workflows.
```

## Step 15: Deployment Preparation

Prepare the application for production deployment.

Backend tasks:
- Configure production environment variables.
- Add production CORS settings.
- Add API error logging.
- Prepare deployment scripts.

Frontend tasks:
- Configure production API URL.
- Build frontend for production.
- Check responsive behavior.
- Update documentation with deployment instructions.

Prompt:
```text
Prepare the MERN LMS for deployment. Configure production environment variables, CORS, build scripts, frontend API URL, and update the README with deployment instructions for the backend, frontend, MongoDB, and Cloudinary.
```

## Suggested Build Order

1. Project setup
2. Authentication
3. Staff management
4. Cloudinary uploads
5. Materials
6. Sections
7. Assessments
8. Results
9. Progress tracking
10. Company profile and product knowledge
11. Dashboards
12. UI polish
13. Security review
14. Testing
15. Deployment
