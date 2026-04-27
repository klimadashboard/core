# SvelteKit Repository | Klimadashboard

> To make the climate crisis tangible by making climate science accessible.
> – _Our mission_

## Welcome! 🌍

This is the frontend code that powers Klimadashboard.at, Klimadashboard.de and Klimadashboard.org, powered by [SvelteKit](https://kit.svelte.dev). Our backend hosted at base.klimadashboard.org takes care of content and data. It is built on [Directus](https://directus.io).

## How to contribute 🗺

We value contributions from the community in the form of

- bug reports, ideas and feature requests: please [file an issue](https://github.com/klimadashboard/core/issues) with the appropiate tags
- help with translations
- contributing bug fixes and code: pick an issue and open a pull request
- creating your own local Klimadashboard: please see below

Before contributing, read our [Code of Conduct](CODE_OF_CONDUCT.md). See below for installation guidelines.

## Create a Klimadashboard for your state/region/... 🗾

We’d love to expand Klimadashboard to further regions, but we need data research, coding and translation support to do so. If you’d like to help us build Klimadashboard for your region, get in touch and join the team as a regional ambassador. <team@klimadashboard.org>

## Branches & Deployment 🧭

The [main] branch of this repository is automatically deployed into production on our core server. Preview deployments can be created manually.

## Prerequisites

- **Node.js >= 20** (check with `node -v`)
- npm (comes with Node.js)

## Development & Build

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and configure the required variables:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `PUBLIC_VERSION` | Yes | Set to `at` (Austria), `de` (Germany), or `org` (klimadashboard.org) |
| `API_URL` | No | Defaults to `https://base.klimadashboard.org` |
| `DIRECTUS_TOKEN` | No | For authenticated API access (write operations, extended read access) |

**For klimadashboard.org only** (donation features):
| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe API key for payment processing |
| `CAMP_API_KEY` | Campai API key for accounting |
| `CAMP_ORG_ID` | Campai organization ID |
| `CAMP_MANDATE_ID` | Campai mandate ID |

### 3. Run in development mode

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
npm start  # Run the built application
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Check code with Prettier and ESLint |
| `npm run format` | Auto-format code |
| `npm run codegen` | Generate GraphQL types from schema |

## Tech Stack

- [SvelteKit](https://kit.svelte.dev/) - Full-stack framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Directus](https://directus.io/) - Headless CMS (backend)
- [MapLibre GL](https://maplibre.org/) - Map visualizations
