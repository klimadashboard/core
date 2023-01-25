# SvelteKit Repository for klimadashboard.at

## Welcome! 🌍

This is the code that powers the frontend of Klimadashboard.at, a website visualising the climate crisis in Austria and beyond. Our website is built with [SvelteKit](https://kit.svelte.dev), a JS framework which performs calculations on our datasets and builds interactive visualisations. Our backend, including all of our datasets and data processing code, can be found [here](https://github.com/klimadashboard). This repository also does not include text and layout data, which is handled by our Klimadashboard CMS.

> To make the climate crisis tangible by making climate science accessible.
> – _Our mission_

## How to contribute 🗺

We value contributions from the community in the form of

- bug reports, ideas and feature requests: please [file an issue](https://github.com/klimadashboard/klimadashboardAT-core/issues) with the appropiate tags
- translations: more info coming soon
- contributing bug fixes and code: pick an issue and open a pull request
- creating your own local Klimadashboard: please see below

Before contributing, read our [Code of Conduct](CODE_OF_CONDUCT.md). See below for installation guidelines.

## Create a Klimadashboard for your state/region/... 🗾

We’d love to expand Klimadashboard beyond Austria, but we need data research, coding and translation support to do so. If you’d like to help us build Klimadashboard for your region, get in touch and join the team as a regional ambassador. <team@klimadashboard.at>

## Branches & Deployment 🧭

The [main] branch of this repository is automatically deployed to klimadashboard.at via Vercel.

## Development & Build

Run the Application in development mode:

```
npm install
npm run dev
```

Build the Application:

```
npm run build
```

Find details to [get started with Svelte](https://svelte.dev/blog/the-easiest-way-to-get-started).
We’re using Tailwind CSS for our CSS classes. To use the full set of utility classes in local development, start the Tailwind watcher while developing in a new Terminal:

```
npx tailwindcss -i ./public/tailwind.css -o ./public/styles.css --watch
```

## Further resources

- [Klimadashboard Design System](https://figma.com/@klimadashboard) on Figma
- [Twitter](https://twitter.com/klimadashboard)
- [Instagram](https://instagram.com/klimadashboard)
