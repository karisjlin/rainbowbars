# Rainbow Bars

Rainbow Bars is a React and TypeScript app with a small Express backend. It renders animated horizontal bars, supports account sign-in in the UI, and lets each user save a custom seven-color palette for the bar animation.

## Features

- Animated horizontal bar display on the home route
- Account page with per-bar color pickers and hex inputs
- Saved color preview on the account page
- About page with a custom styled project summary
- Express API for saving and loading account bar colors
- Client-side persistence with local storage fallback

## Project Structure

```text
gemini-test-app/
  src/              React frontend
  server/           Express + TypeScript backend
  build/            Production frontend build output
```

## Frontend Routes

- `/karis`: home page with the animated bars
- `/account`: account details and bar color settings
- `/about`: about page

## Requirements

- Node.js
- npm

## Install

Install dependencies for the frontend:

```bash
npm install
```

Install dependencies for the backend:

```bash
cd server
npm install
```

## Run in Development

Start the React app from the project root:

```bash
npm start
```

Start the Express server from the `server` directory:

```bash
npm start
```

By default:

- Frontend runs on `http://localhost:3000`
- Server runs on `http://localhost:3002`

## Build

Build the frontend from the project root:

```bash
npm run build
```

Build the backend from the `server` directory:

```bash
npm run build
```

## How Saved Colors Work

- The account page lets the user set seven bar colors
- Colors are validated as `#RRGGBB` hex values
- Saved colors are posted to the backend API
- The frontend also stores saved colors in local storage per user email
- If the server has no saved in-memory colors available, the UI can still fall back to local storage

## API Endpoints

- `GET /api/account/colors/:email`: load saved colors for an account
- `POST /api/account/colors`: save a full seven-color palette for an account

## Notes

- The backend currently stores saved colors in memory, so restarting the server clears the server-side map
- The frontend may still show previously saved colors from local storage for the same browser session history

## Scripts

Frontend scripts:

- `npm start`
- `npm run build`
- `npm test`

Backend scripts:

- `npm start`
- `npm run build`

