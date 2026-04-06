# GSB Web

Next.js monorepo application that includes:
- public application (`src/app/(app)`)
- mentor dashboard (`src/app/(mentor)`)
- Payload CMS admin (`src/app/(payload)`)

## Local Setup

1. Use Node.js LTS (recommended: >= 20).
2. Install dependencies:

```bash
npm install
```

3. Prepare local environment variables (never commit production secrets):

```bash
# example
cp .env.example .env.local
```

4. Start the development server:

```bash
npm run dev
```

5. Access URLs:
- Main app: `http://localhost:3000`
- Mentor dashboard: `http://localhost:3000/mentor-dashboard`
- Payload admin: `http://localhost:3000/admin`

## Important Scripts

```bash
npm run dev            # development
npm run build          # production build
npm run start          # run production build
npm run lint           # lint check
npm run generate:types # generate Payload types
```

## Core Structure

- `src/app`: App Router routes (public, mentor, payload, API routes)
- `src/modules`: domain modules (auth, tryouts, mentor-dashboard, shared, etc.)
- `src/collections`: Payload CMS collections
- `src/trpc`: tRPC initialization and routers
- `src/components`: reusable UI components

## Contribution Rules

- Do not change business queries or collection schemas without owner approval.
- For UI cleanup, prefer non-breaking updates.
- Keep pull requests small and scoped.
- Run `npm run lint` before merge.

## Security Notes

- Never commit env files or credentials.
- Rotate keys before granting repository access to new developers.
- Enforce branch protection on `main`.
