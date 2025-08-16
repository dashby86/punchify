# Task Creator - AI-Powered Mobile Task Management

A professional mobile web application that transforms photos and videos into detailed task descriptions using AI. Built for contractors, property managers, and anyone who needs to quickly document and share work requirements.

## 🌟 Features

### 📱 Mobile-First Upload Interface
- **Multi-media support**: Upload photos, videos, and audio recordings
- **Native camera integration**: Capture media directly from your phone
- **Drag & drop**: Easy file uploads with visual feedback
- **Real-time compression**: Automatic media optimization for storage efficiency

### 🤖 AI-Powered Task Generation
- **OpenAI GPT-4 Vision**: Advanced image and video analysis
- **Automatic transcription**: Audio and video transcripts using Whisper AI
- **Smart task creation**: Generates titles, summaries, and detailed descriptions
- **Location detection**: Extracts GPS data from images and identifies locations
- **Trade identification**: Suggests appropriate professionals for each task

### 📋 Professional Task Display
- **Clean, readable format**: Mobile-optimized task viewing
- **Media gallery**: Full-screen media viewer with touch navigation
- **Transcript display**: Shows audio/video transcriptions when available
- **Comprehensive details**: Location, trade requirements, and work descriptions

### 📤 Native Mobile Sharing
- **Web Share API**: Native mobile sharing experience
- **Universal links**: Recipients can view tasks on any device
- **Shareable URLs**: Works across platforms and devices
- **One-tap sharing**: Quick sharing from the home screen

## 🚀 Technology Stack

- **Frontend**: React 19 + TypeScript
- **Routing**: TanStack Router (code-based)
- **Styling**: Tailwind CSS v4 with custom mobile optimizations
- **Build Tool**: Vite with HMR and development optimizations
- **AI Integration**: 
  - OpenAI GPT-4 Vision for image analysis
  - OpenAI Whisper for audio transcription
- **Storage**: LocalStorage with intelligent quota management
- **Compression**: Client-side media optimization
- **PWA**: Progressive Web App with offline support

## 📦 Installation & Setup

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd punchify
npm install
```

2. **Environment Configuration**:
Create a `.env` file in the root directory:
```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

3. **Development server**:
```bash
npm run dev
```

4. **Production build**:
```bash
npm run build
```

## 🔧 Configuration

### OpenAI API Setup
1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your `.env` file as `VITE_OPENAI_API_KEY`
3. Ensure you have credits for GPT-4 Vision and Whisper API usage

### Mobile Optimization
- Touch targets minimum 44px for accessibility
- Viewport optimized for mobile devices
- Native mobile sharing via Web Share API
- Gesture-friendly interface design

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── HomePage.tsx     # Main upload interface
│   ├── TaskListHome.tsx # Task dashboard
│   ├── TaskDetail.tsx   # Individual task view
│   ├── SharedTaskView.tsx # Public task sharing
│   ├── MediaViewer.tsx  # Full-screen media viewer
│   └── Toast.tsx        # Notification system
├── lib/                 # Core utilities
│   ├── openai.ts       # AI integration (GPT-4 Vision + Whisper)
│   ├── storage.ts      # LocalStorage management
│   ├── compress.ts     # Media compression utilities
│   ├── share.ts        # Mobile sharing functionality
│   └── exif.ts         # GPS metadata extraction
├── styles.css          # Global styles (Tailwind + custom)
└── main.tsx           # Router configuration
```

## 🎯 Usage

### Creating a Task
1. **Upload Media**: Use camera, file picker, or drag & drop
2. **AI Processing**: Automatic analysis and transcription
3. **Review**: Check generated task details
4. **Publish**: Make task available for sharing

### Sharing Tasks
1. **One-tap sharing**: Use the share button on any task card
2. **Native experience**: Mobile devices use Web Share API
3. **Universal access**: Recipients view tasks via shareable links

### Task Management
- **Home dashboard**: View all published tasks
- **Task details**: Edit, view media, manage tasks
- **Media viewer**: Full-screen viewing with touch navigation

## 🔒 Privacy & Storage

- **Local storage**: All data stored locally on device
- **No server dependencies**: Fully client-side application
- **Smart compression**: Reduces storage usage by 60-80%
- **Quota management**: Automatic handling of storage limits

## 🛠️ Development

### Available Scripts
- `npm run dev` - Development server with HMR
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run test` - Run test suite

### Mobile Testing
- Test on actual mobile devices for best results
- Use browser dev tools mobile simulation
- Verify camera/file access permissions
- Test Web Share API functionality

## 📱 PWA Features

- **Installable**: Add to home screen on mobile devices
- **Offline capable**: Core functionality works offline
- **App-like experience**: Full-screen mobile interface
- **Performance optimized**: Fast loading and smooth interactions

## 🔄 Compression & Optimization

### Automatic Media Processing
- **Images**: Compressed to JPEG with quality optimization
- **Videos**: Converted to thumbnail representations
- **Audio**: SVG placeholder with metadata
- **Storage efficiency**: Reduces file sizes by 60-80%

### Smart Storage Management
- **Quota monitoring**: Prevents storage overflow
- **Graceful degradation**: Saves tasks without media if needed
- **Cleanup utilities**: Remove old data when necessary

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on mobile devices
5. Submit a pull request

## 📄 License

This project is part of a professional portfolio. See license file for details.

## 📞 Support

For technical support or feature requests, please open an issue in the repository.

---

Built with ❤️ for mobile-first task management and AI-powered productivity.