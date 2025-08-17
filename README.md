# Task Creator - Mobile Web Application

A **100% client-side** mobile-responsive web application that allows users to upload photos and videos, then uses AI to automatically generate detailed task descriptions for home repairs and maintenance work. No backend server required!

## Features

✅ **Mobile Upload Interface**
- Upload multiple photos and videos (max 15 seconds each)
- Drag & drop or click to select files
- Clean, mobile-responsive design

✅ **AI-Powered Task Generation**
- Direct integration with OpenAI API from browser
- Automatically generates:
  - Task title and summary
  - Detailed work description
  - Location identification
  - Professional recommendations

✅ **Task Details Display**
- Clean, readable format
- Media gallery with uploaded files
- LocalStorage for task persistence

✅ **Mobile Sharing**
- Native mobile share functionality
- Shareable links for any device
- Clipboard fallback for desktop

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed
- OpenAI API key

### 2. Installation
```bash
# Install dependencies
npm install
```

### 3. Configuration

#### Option 1: Use the in-app Settings
1. Click the settings icon (⚙️) in the top-right corner
2. Enter your OpenAI API key
3. Save settings

#### Option 2: Environment Variables
Create a `.env` file in the root directory:
```env
VITE_OPENAI_API_KEY=your_actual_openai_api_key_here
VITE_OPENAI_MODEL=gpt-4o-mini
```

### 4. Running the Application

Simply start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

### 5. Testing on Mobile
1. Ensure your mobile device is on the same network as your development machine
2. Find your local IP address:
   - Mac: `ifconfig | grep inet`
   - Windows: `ipconfig`
3. Access the app on your mobile device at: `http://[YOUR_IP]:3000`

## Usage

1. **Upload Media**: Click the upload area or drag files to upload photos/videos
2. **Review Files**: Check uploaded files in the preview grid
3. **Create Task**: Click "Create Task" to process with AI
4. **View Details**: See the AI-generated task description
5. **Share**: Use the share button to send task details to others

## Technical Stack

- **Frontend**: React 19, TypeScript, TanStack Router, Tailwind CSS v4
- **AI Integration**: OpenAI API (GPT-4o-mini)
- **Storage**: Browser LocalStorage
- **Build Tool**: Vite

## How It Works

1. **Upload Media**: Select photos/videos from your device
2. **AI Analysis**: OpenAI analyzes the media context and generates task details
3. **Local Storage**: Tasks saved to browser's localStorage
4. **Share**: Share task links with others

## Notes

- **100% Client-Side**: No backend server required
- **Privacy**: Media files never leave your browser (converted to base64)
- **Persistence**: Tasks stored in browser localStorage
- **Supported formats**: PNG, JPG, GIF, WebP, MP4, MOV, AVI, WebM

## Troubleshooting

### OpenAI API Issues

**429 Error (Rate Limit)**:
- Add billing to your OpenAI account
- New accounts need payment method at https://platform.openai.com/account/billing
- Minimum $5 credit recommended

**Invalid API Key**:
- Check key starts with `sk-`
- Ensure no extra spaces when pasting
- Generate new key at https://platform.openai.com/api-keys

### Development Issues

If you encounter npm permission errors:
```bash
npm config set cache .npm-cache --location=project
```

## Cost Estimation

- GPT-4o-mini: ~$0.15 per 1M tokens
- Average task: < 500 tokens
- Estimated cost: < $0.01 per task

## Future Enhancements

- Image vision API for better analysis
- Export tasks to PDF
- Task history and search
- Collaborative task sharing
- PWA for offline support
