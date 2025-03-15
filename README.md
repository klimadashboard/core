# SvelteKit Repository | Klimadashboard

> To make the climate crisis tangible by making climate science accessible.
> – _Our mission_

## Welcome! 🌍

This is the frontend code that powers Klimadashboard.at and Klimadashboard.de, powered by [SvelteKit](https://kit.svelte.dev). Our backend hosted at base.klimadashboard.org takes care of content and data. It is built on [Directus](https://directus.io).

## How to contribute 🗺

We value contributions from the community in the form of

- bug reports, ideas and feature requests: please [file an issue](https://github.com/klimadashboard/klimadashboardAT-core/issues) with the appropiate tags
- help with translations
- contributing bug fixes and code: pick an issue and open a pull request
- creating your own local Klimadashboard: please see below

Before contributing, read our [Code of Conduct](CODE_OF_CONDUCT.md). See below for installation guidelines.

## Create a Klimadashboard for your state/region/... 🗾

We’d love to expand Klimadashboard beyond Austria, but we need data research, coding and translation support to do so. If you’d like to help us build Klimadashboard for your region, get in touch and join the team as a regional ambassador. <team@klimadashboard.org>

## Branches & Deployment 🧭

The [main] branch of this repository is automatically deployed to our server via ploi.io.

## Development & Build

Run the Application in development mode:

```
npm install
npm run dev
```

To make sure the correct content is being loaded from our CMS, add an .env file with a PUBLIC_VERSION variable, which you set to at or de depending on the version you’d like to work on.

```
PUBLIC_VERSION=at
```

Build the Application:

```
npm run build
```

Find details to [get started with Svelte](https://svelte.dev/). We’re using [Tailwind CSS](https://tailwindcss.com/) for our CSS classes.
