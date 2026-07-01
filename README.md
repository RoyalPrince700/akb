# Accessible Knowledge Base

Accessible Knowledge Base is a company learning management system and integrated CRM for Accessible Publishers Limited. The platform helps staff learn from approved company materials, understand product knowledge, review the company profile, take assessments where required, and manage customer relationship workflows from the same application.

## Purpose

This project is designed as an internal knowledge base and LMS where:

- Administrators or HR can upload and manage learning materials.
- Materials can be broken into structured sections for easier learning.
- Some materials can include assessments, while others can remain read-only.
- Staff can read assigned materials, take assessments, and view their results.
- HR can view staff details, learning progress, and assessment results.
- CSR teams can log customer calls, manage sales records, send surveys, and review CRM activity.

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

### CSR/CSR Admin

- Log inbound and outbound customer interactions.
- Maintain customer history and sales records.
- Send customer surveys and review survey responses.
- Manage CSR team members and CRM reporting where authorized.

## Main Features

- Secure authentication and role-based authorization.
- Company profile and product knowledge sections.
- Material upload and management with Cloudinary.
- Section-based learning content.
- Optional assessments for materials.
- Staff dashboard for learning and results.
- HR/admin dashboard for staff, content, and assessment management.
- Assessment scoring and result history.
- Integrated CRM for customer interactions, sales records, surveys, and reports.
- CSR settings for phone numbers and customer-facing survey display names.

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
- CRM customer interactions, customer history, sales records, survey dispatches, survey responses, and CRM reports.

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
- CSR dashboard for customer interactions, sales records, surveys, customer history, and CRM reports.

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
