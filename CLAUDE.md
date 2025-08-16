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

This is a mobile-optimized task management application that uses computer vision to automatically generate task descriptions from uploaded media.

### Tech Stack
- **React 19** with TypeScript
- **Vite** as the build tool and dev server
- **TanStack Router** for code-based routing
- **Tailwind CSS v4** for mobile-first styling
- **OpenAI GPT-4 Vision** for image analysis
- **Web Share API** for native mobile sharing
- **react-dropzone** for file uploads
- **exifr** for extracting GPS data from images

### Core Features
1. **Media Upload**: Photo, video, and audio capture/upload
2. **Task Generation**: Automatic task creation from media
3. **Mobile Sharing**: Native share functionality for tasks
4. **Public Task Views**: Shareable links for published tasks
5. **Media Viewer**: Full-screen media viewing with navigation
6. **EXIF Location**: Automatic location extraction from photos

### Project Structure

```
/src
  /components
    - HomePage.tsx         # Media upload and task creation
    - TaskListHome.tsx     # Task list dashboard
    - TaskDetail.tsx       # Task view/edit with sharing
    - SharedTaskView.tsx   # Public shareable task view
    - MediaViewer.tsx      # Full-screen media viewer
    - Toast.tsx           # Toast notifications
    - LoadingSpinner.tsx  # Loading states
  /lib
    - openai.ts   # GPT-4 Vision integration
    - storage.ts  # LocalStorage task management
    - share.ts    # Web Share API utilities
    - exif.ts     # EXIF data extraction
  - main.tsx      # App entry, router config
  - styles.css    # Global styles, animations
```

### Routing

Routes defined in `src/main.tsx`:
- `/` - Task list (TaskListHome)
- `/create` - Create new task (HomePage)
- `/task/:taskId` - View/edit task (TaskDetail)
- `/shared/:taskId` - Public task view (SharedTaskView)

### API Configuration

Set OpenAI API key via:
1. Environment variable: `VITE_OPENAI_API_KEY` in `.env`
2. In-app settings panel
3. LocalStorage: `openai_api_key`

### Key Implementation Details

- **GPT-4 Vision**: Sends actual base64 images for analysis
- **Mobile-First**: Touch gestures, native share, responsive design
- **Error Handling**: Toast notifications, loading overlays
- **Animations**: Smooth transitions using Tailwind + custom CSS
- **Storage**: Tasks persisted in LocalStorage with draft/published states
- **Media Handling**: Files stored in memory only (browser session)

### Known Limitations & Future Improvements

- **Media Persistence**: Currently media files are lost on page refresh. In production, this would be improved with:
  - Backend file storage service (AWS S3, Cloudinary, etc.)
  - CDN for fast media delivery
  - Progressive upload with resume capability
  - File compression and optimization