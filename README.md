# Accessible Knowledge Base

Accessible Knowledge Base is a company learning management system for Accessible Publishers Limited. The platform will help staff learn from approved company materials, understand product knowledge, review the company profile, and take assessments where required.

## Purpose

This project is designed as an internal knowledge base and LMS where:

- Administrators or HR can upload and manage learning materials.
- Materials can be broken into structured sections for easier learning.
- Some materials can include assessments, while others can remain read-only.
- Staff can read assigned materials, take assessments, and view their results.
- HR can view staff details, learning progress, and assessment results.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB
- Storage: Cloudinary
- Authentication: JWT-based authentication
- Architecture: MERN stack with separate `frontend` and `backend` folders

## Project Structure

```text
akb/
  backend/
    # Express API, MongoDB models, authentication, Cloudinary upload handling
  frontend/
    # React app, Tailwind UI, staff dashboard, HR/admin panel
  README.md
  TODO.md
```

## Core User Roles

### Staff

- Register or log in to the platform.
- View learning materials assigned or made available to them.
- Read materials by sections.
- Take assessments attached to specific materials.
- View personal assessment results and learning progress.

### HR/Admin

- Manage staff accounts.
- Upload learning materials and supporting files.
- Break materials into modules or sections.
- Create assessments for selected materials.
- View staff assessment results.
- Track staff learning activity.

## Main Features

- Secure authentication and role-based authorization.
- Company profile and product knowledge sections.
- Material upload and management with Cloudinary.
- Section-based learning content.
- Optional assessments for materials.
- Staff dashboard for learning and results.
- HR/admin dashboard for staff, content, and assessment management.
- Assessment scoring and result history.

## Backend Overview

The backend will provide REST APIs for:

- Authentication and user management.
- Role-based access control.
- Learning material CRUD operations.
- Cloudinary file uploads.
- Material sections.
- Assessments and questions.
- Assessment submissions and results.
- HR reporting and staff progress.

## Frontend Overview

The frontend will provide pages for:

- Login and registration.
- Staff dashboard.
- Learning material list.
- Material detail and section reader.
- Assessment taking.
- Staff result history.
- HR/admin dashboard.
- Staff management.
- Material and assessment management.

## Environment Variables

The backend will need environment variables similar to:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=http://localhost:5173
```

The frontend will need:

```env
VITE_API_URL=http://localhost:5000/api
```

## Development Goal

Build the platform step by step, integrating frontend and backend together from the beginning so every major feature is tested through the user interface and API at the same time.
