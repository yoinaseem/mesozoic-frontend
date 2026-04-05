This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Auth Setup

Set the backend API base URL (including the `/api` prefix):

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

Auth flow implemented in this frontend:

- `POST /auth/register` creates a user and stores returned `token + user` in client auth state.
- `POST /auth/login` stores returned `token + user` in client auth state.
- Token is persisted in `localStorage` and restored on app boot.
- On boot, if a token exists, the app calls `GET /auth/me` to hydrate the user.
- API client automatically sends `Authorization: Bearer <token>` when authenticated.
- Any `401 Unauthenticated` response clears local auth state/token and redirects to `/login`.
- Logout calls `POST /auth/logout`, then clears local auth state/token regardless of API result.
- Protected pages are route-guarded and redirect unauthenticated users to `/login`.
- Login/Register forms render inline field errors from Laravel `422` responses.
