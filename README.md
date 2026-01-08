# TowMech Admin Dashboard

A professional, modern admin dashboard for the TowMech backend built with **Next.js App Router**, **TypeScript**, **TailwindCSS**, **shadcn/ui**, **Zustand**, and an **Axios** service layer.

## Features

- ✅ Protected routes with auth guard
- ✅ Responsive sidebar + topbar layout
- ✅ Full module routing (12 admin modules)
- ✅ Placeholder dashboards with summary cards + table sections
- ✅ Centralized API service layer with token headers
- ✅ Modern SaaS UI styling with shadcn/ui and lucide icons

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication Flow

1. Sign in with email + password.
2. Enter OTP (simulated input for now).
3. JWT token is stored in localStorage.
4. Protected routes redirect to `/login` if no token exists.

## Folder Structure Highlights

```
app/
  login/
  dashboard/
components/
  auth/
  dashboard/
  layout/
  ui/
lib/
  api/
  store/
```

## shadcn/ui Setup Guide

This project includes prebuilt shadcn/ui components under `components/ui`.
To add or regenerate components in the future:

```bash
npx shadcn@latest init
npx shadcn@latest add button card input table dropdown-menu badge
```

Ensure your Tailwind setup is enabled and the `components/ui` directory is used as the output path.
