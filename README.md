# Lyrics Video Generator POC

A lightweight UI for generating lyrics videos from BandLab track URLs. Built with Vue 3 + Vuetify + TypeScript, deployed to GitHub Pages.

## Features

- Paste a BandLab track URL to trigger lyrics video generation
- Two video outputs per job: **OpenAI Whisper** and **Google Chirp3**
- Real-time status tracking with auto-polling
- Side-by-side video comparison when generation completes
- SRT subtitle content viewer

## Development

```bash
cd lyrics-video-app
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

Automatically deploys to GitHub Pages on push to `main` via GitHub Actions.
