# HeatWatchers

## Project Description
### Overview
The project "Heat Watchers" is an AI-powered platform for tracking climate change through community engagement and temperature reporting.
### Main Goals
Raise awareness about climate change, encourage community participation, and provide rewards for contributions.
### Key Features
- app/layout.tsx: Defines the main layout of the application, including the header and sidebar.
- app/leaderboard/page.tsx: Implements the leaderboard page.
- app/page.tsx: Implements the home page with features like reporting temperature and viewing impact data.
- app/report/page.tsx: Implements the temperature reporting page.
- app/rewards/page.tsx: Implements the rewards page.
- app/verify/page.tsx: Implements the verification tasks page.
- components/Header.tsx: Defines the header component with user authentication and notifications.
- components/Sidebar.tsx: Defines the sidebar component with navigation links.
- utils/db/actions.ts: Contains database actions for managing users, reports, rewards, and notifications.
- utils/db/schema.ts: Defines the database schema for users, reports, rewards, and notifications.




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
