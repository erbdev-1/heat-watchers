# HeatWatchers

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## Project Description

### Overview
HeatWatchers is an innovative application designed to monitor and report heat-related environmental data. It leverages cutting-edge technologies to provide users with real-time insights, fostering a community dedicated to environmental awareness and action.

### Objectives
- **Environmental Monitoring:** Enable users to report and monitor heat-related data in real-time.
- **Community Engagement:** Foster a community of users who contribute to environmental data collection and analysis.
- **Data-Driven Insights:** Provide actionable insights based on the collected data to inform decision-making and promote sustainability.

### Features
- **Real-Time Reporting:** Users can submit heat-related observations, including temperature readings and material types.
- **Leaderboard:** Display user rankings based on their contributions, encouraging active participation.
- **Rewards System:** Users earn points for their contributions, which can be redeemed for rewards.
- **Verification System:** Ensure the accuracy of reports through verification processes using advanced APIs.
- **Notifications:** Alert users about important events, updates, and achievements within the application.
- **Integration with External APIs:** Enhance functionality with integrations like Google Maps and OpenWeather.

## Table of Contents
1. [Technologies Used](#technologies-used)
2. [Architecture Overview](#architecture-overview)
3. [Component Schema](#component-schema)
4. [Installation Instructions](#installation-instructions)
5. [Usage](#usage)
6. [API Documentation](#api-documentation)
7. [State Management](#state-management)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Contributing](#contributing)
11. [Project Management](#project-management)
12. [License](#license)
13. [Acknowledgments](#acknowledgments)
14. [FAQ](#faq)
15. [Contact Information](#contact-information)

## Technologies Used

### Programming Languages
The programming languages used in this project are:
- **TypeScript**
- **JavaScript**
- **SQL**

These languages are evident from the file extensions and the code content in the repository. For example, files like `app/layout.tsx` and `app/leaderboard/page.tsx` are written in TypeScript, while SQL is used in the database schema and actions.

### Frontend Frameworks/Libraries
The frontend frameworks or libraries utilized in this project are:
- **Next.js**
- **React**
- **Tailwind CSS**
- **React Hot Toast**
- **Lucide React**

These can be observed in various files such as `app/layout.tsx`, `app/leaderboard/page.tsx`, `app/page.tsx`, and `app/report/page.tsx`. Additionally, the configuration files like `.eslintrc.json` and `tailwind.config.ts` also indicate the use of these libraries.

### State Management
The project already uses React's built-in state management with the `useState` and `useEffect` hooks.

### Styling Libraries/Frameworks
The CSS framework used in this project is:
- **Tailwind CSS**

This is evident from the usage of Tailwind directives such as `@tailwind base;`, `@tailwind components;`, and `@tailwind utilities;` in the `app/globals.css` file. Additionally, the project uses custom CSS variables and utility classes defined within the same file.

### Database Technologies
The database technologies used in this project are:
- **PostgreSQL:** The project uses PostgreSQL as the primary database. The schema for the database is defined in `utils/db/schema.ts`, which includes tables for users, reports, rewards, verified reports, notifications, and transactions.
- **Drizzle ORM:** The project uses Drizzle ORM for interacting with the PostgreSQL database. The configuration for Drizzle ORM is defined in `drizzle.config.js` and the database connection is set up in `utils/db/dbConfig.jsx`.
- **Neon:** The project uses Neon for serverless PostgreSQL. The connection to the Neon database is established using the `@neondatabase/serverless` package, as seen in `utils/db/dbConfig.jsx`.

### Third-Party Libraries
The project uses several third-party libraries to enhance its functionality. Here are the libraries along with their descriptions:
- `@google/generative-ai`: A library for integrating Google Generative AI models.
- `@neondatabase/serverless`: A library for serverless database connections with Neon.
- `@prisma/client`: Prisma Client is an auto-generated query builder that enables type-safe database access.
- `@radix-ui/react-dropdown-menu`: A library for building accessible dropdown menus in React.
- `@radix-ui/react-slot`: A library for creating slot-based components in React.
- `@react-google-maps/api`: A library for integrating Google Maps into React applications.
- `@web3auth/base`: A library for Web3 authentication.
- `@web3auth/ethereum-provider`: A library for Ethereum provider integration with Web3Auth.
- `@web3auth/modal`: A library for Web3Auth modal integration.
- `axios`: A promise-based HTTP client for making requests to APIs.
- `class-variance-authority`: A utility for managing class names in a type-safe way.
- `clsx`: A utility for constructing `className` strings conditionally.
- `dotenv`: A module for loading environment variables from a `.env` file.
- `drizzle-orm`: An ORM for TypeScript and JavaScript.
- `lucide-react`: A library for using Lucide icons in React applications.
- `next`: The React framework for production.
- `react`: A JavaScript library for building user interfaces.
- `react-dom`: The entry point to the DOM and server renderers for React.
- `react-hot-toast`: A library for creating toast notifications in React.
- `tailwind-merge`: A utility for merging Tailwind CSS classes.
- `tailwindcss-animate`: A plugin for adding animations to Tailwind CSS.

These libraries are used to build various features and functionalities in the project, such as user interfaces, database interactions, API requests, and more.

### APIs
The project uses several APIs to provide various functionalities. Here is a brief explanation of the APIs used:
- **Google Generative AI:** This API is used for analyzing images and generating content based on the analysis. It is used in files like `app/report/page.tsx` and `app/verify/page.tsx` for verifying the temperature and material type of objects.
- **OpenWeather API:** This API is used to fetch the current weather data for a given location. It is used in `utils/db/actions.ts` to get the weather temperature for a location.
- **Google Maps API:** This API is used for location search and autocomplete functionality. It is used in `app/report/page.tsx` for searching and selecting locations.
- **Oasis Sapphire Testnet:** A blockchain platform used for Web3 interactions.

These APIs are integrated into the project to enhance its functionality and provide a better user experience.

### Tools and Platforms
- **Vercel:** The application is deployed using Vercel, as indicated by the `next.config.mjs` file which includes the configuration for the Next.js application.

## Architecture Overview
The system architecture of the **HeatWatchers** project is composed of several key components and technologies. Here is a description of the system architecture:

- **Frontend:** The frontend is built using React and Next.js. It includes various components such as `Header` (`components/Header.tsx`), `Sidebar` (`components/Sidebar.tsx`), and several pages like `app/page.tsx`, `app/report/page.tsx`, `app/leaderboard/page.tsx`, `app/rewards/page.tsx`, and `app/verify/page.tsx`.
- **Styling:** The project uses Tailwind CSS for styling, as indicated by the presence of `tailwind.config.ts` and `postcss.config.mjs`.
- **Backend:** The backend is built using Node.js and interacts with a PostgreSQL database. The database schema is defined in `utils/db/schema.ts`, and various database actions are implemented in `utils/db/actions.ts`.
- **Database:** The project uses PostgreSQL as the database, with the connection configured in `drizzle.config.js` and `utils/db/dbConfig.jsx`.
- **Authentication:** The project uses Web3Auth for authentication, as seen in the `Header` component (`components/Header.tsx`).
- **API Integration:** The project integrates with external APIs such as OpenWeather for fetching weather data (`utils/db/actions.ts`).
- **State Management:** The project uses React's built-in state management (`useState`, `useEffect`) for managing component states.
- **Notifications:** The project includes a notification system to alert users about various events, as seen in the `Header` component (`components/Header.tsx`) and the database schema for notifications (`utils/db/schema.ts`).
- **Rewards System:** The project includes a rewards system where users can earn and redeem points, as seen in the `app/rewards/page.tsx` and related database actions (`utils/db/actions.ts`).

## Component Schema

### Frontend Components
- **Header (`components/Header.tsx`):** Contains navigation links, branding, and authentication controls.
- **Sidebar (`components/Sidebar.tsx`):** Provides navigation to different sections of the application.
- **Page Components:**
  - **Home (`app/page.tsx`):** The main landing page.
  - **Report (`app/report/page.tsx`):** Allows users to report heat-related observations.
  - **Leaderboard (`app/leaderboard/page.tsx`):** Displays user rankings based on contributions.
  - **Rewards (`app/rewards/page.tsx`):** Enables users to earn and redeem rewards.
  - **Verify (`app/verify/page.tsx`):** Facilitates verification of reported data.

### Backend Services
- **AuthService:** Manages user authentication and authorization using Web3Auth.
- **ReportService:** Handles CRUD operations for heat reports.
- **RewardService:** Manages the rewards system, including earning and redeeming points.
- **NotificationService:** Sends notifications to users about relevant events.

### Database Schema
- **Users Table:**
  - `id`: Primary key
  - `name`: User's full name
  - `email`: User's email address
  - `password`: Hashed password
- **Reports Table:**
  - `id`: Primary key
  - `user_id`: Foreign key referencing the Users table
  - `location`: Location of the report
  - `temperature`: Recorded temperature
  - `material_type`: Type of material observed
  - `timestamp`: Time of the report
- **Rewards Table:**
  - `id`: Primary key
  - `user_id`: Foreign key referencing the Users table
  - `points`: Number of points earned
  - `redeemed`: Boolean indicating if the points have been redeemed
- **Notifications Table:**
  - `id`: Primary key
  - `user_id`: Foreign key referencing the Users table
  - `message`: Notification message
  - `read`: Boolean indicating if the notification has been read
- **Transactions Table:**
  - `id`: Primary key
  - `user_id`: Foreign key referencing the Users table
  - `amount`: Transaction amount
  - `type`: Type of transaction (e.g., credit, debit)
  - `timestamp`: Time of the transaction

## Installation Instructions

### Prerequisites
- **Node.js:** v14.x or higher
- **TypeScript:** v4.x or higher
- **npm:** v6.x or higher
- **PostgreSQL:** v13.x or higher
- **Neon:** Account and setup for serverless PostgreSQL
- **Vercel Account:** For deployment

### Setup Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/HeatWatchers.git
