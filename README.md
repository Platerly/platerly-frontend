# Recipzee: frontend

React web app for **Recipzee** (originally Platerly), an allergy-aware recipe platform. The API, architecture and project write-up live in [platerly-backend](https://github.com/ayubmja2/platerly-backend).

> **Status:** Launched and tested with early users. No longer in active development or hosted.

![Recipzee feed](https://raw.githubusercontent.com/ayubmja2/platerly-backend/main/docs/feed.png)

More screenshots and the full write-up are in the [backend README](https://github.com/ayubmja2/platerly-backend).

## Features

- Onboarding that captures allergens and dietary needs, with warnings on unsafe recipes
- Feed, trending, search, and explore pages for recipes, chefs and cookbooks
- Create, edit and remix recipes; save recipes to cookbooks
- Meal planner and shopping lists
- Notifications, follows, profiles and settings
- Email verification, password reset and cookie-based sessions
- Stripe checkout and billing pages for consumer and B2B plans
- Admin dashboard: user management, audit logs, prohibited ingredients, recipe index
- Public pages for the B2B API, plus share previews served by Azure Functions

## Tech

| Area | Tools |
| --- | --- |
| UI | React 18, React Router, Tailwind CSS, Radix UI, Lucide icons |
| Data | Axios, Zod validation, DOMPurify for user content |
| SEO and sharing | react-helmet-async, generated sitemap, Open Graph previews via Azure Functions (`api/`) |
| Monitoring | Sentry, Google Analytics 4 |
| Testing | Vitest, Testing Library |
| Hosting | Azure Static Web Apps |

## Running locally

```bash
git clone https://github.com/ayubmja2/platerly-frontend.git
cd platerly-frontend
npm install
npm run dev        # start the Vite dev server
npm run test       # run tests
```

Point the app at a running copy of the [backend API](https://github.com/ayubmja2/platerly-backend).

## Author

**Ayub Ali** · [GitHub](https://github.com/ayubmja2) · [LinkedIn](https://www.linkedin.com/in/ayubmja/)
