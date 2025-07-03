# AI Skribenten - Next.js Frontend with FastAPI Backend

This is a Next.js application that serves as the frontend for AI Skribenten, connecting to a FastAPI backend for authentication and data management.

## Features

- User authentication with FastAPI backend
- Protected routes and admin-only sections
- Site management and user-site linking
- Article management with different views (scheduled, review, archive)
- Responsive design with shadcn/ui components

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up environment variables:
Create a `.env.local` file with:
\`\`\`
NEXT_PUBLIC_API_HOST=your_backend_url
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

- `/app` - Next.js app router pages
- `/components` - Reusable UI components
- `/lib` - Utility functions
- `/hooks` - Custom React hooks

## Authentication

The app uses a custom authentication context that connects to the FastAPI backend. Users must log in to access protected routes.

## Admin Features

Admin users have access to additional features like:
- Adding new users
- Adding new sites
- Linking users to sites
