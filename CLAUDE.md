# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

**Development:**
```bash
npm install        # Install dependencies
npm run dev        # Start dev server on port 3000
npm run start      # Alternative to start dev server on port 3000
```

**Build & Production:**
```bash
npm run build      # Build for production (Vite build + TypeScript check)
npm run serve      # Preview production build
```

**Testing:**
```bash
npm run test       # Run tests using Vitest
```

## Architecture Overview

This is a React 19 application built with:
- **Vite** as the build tool and dev server
- **TypeScript** with strict mode enabled
- **TanStack Router** for code-based routing (configured in src/main.tsx)
- **Tailwind CSS v4** for styling (configured via @tailwindcss/vite plugin)
- **Vitest** for testing with jsdom environment

### Project Structure

- `/src/main.tsx` - Application entry point, router configuration
- `/src/App.tsx` - Main application component (home route)
- `/src/styles.css` - Global styles with Tailwind imports
- `@/` alias configured for `/src/` directory imports

### Routing

Currently using code-based routing with TanStack Router. Routes are defined in `src/main.tsx`:
- Root route provides layout with `<Outlet />` and dev tools
- Index route (`/`) renders the App component

To add new routes, create a `createRoute` call in main.tsx and add it to the routeTree.

### TypeScript Configuration

- Target: ES2022
- Strict mode enabled with additional linting rules
- Path alias: `@/*` maps to `./src/*`
- No unused locals/parameters enforced