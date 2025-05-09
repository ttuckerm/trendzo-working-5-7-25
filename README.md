# Trendzo - AI-Powered Social Media Template Management

Trendzo is a comprehensive platform for managing, customizing, and tracking social media templates. It leverages AI to provide performance predictions, content optimization, and analytics for your social media content.

![Trendzo Logo](/public/images/logos/trendzo-full-logo.svg)

## Performance Optimization Framework

Trendzo includes a robust performance optimization framework designed to create a highly responsive "unicorn" user experience. This framework consists of utilities, hooks, and documentation for optimizing all aspects of the application.

### Core Optimization Utilities

- **Performance Tracking**: Tools for measuring and analyzing component and function performance
- **Animation Optimization**: Hooks for GPU-accelerated animations with reduced motion support
- **Data Fetching Optimization**: Smart fetching with caching, prefetching, and progressive loading
- **Render Optimization**: Utilities for preventing unnecessary renders and optimizing component trees
- **Focus Management**: Accessibility-focused utilities for managing focus in interactive components

### Optimization Components

- **PerformanceVisualizer**: Visualize before/after optimization metrics for components
- **MetricsMonitor**: Real-time performance monitoring during development
- **OptimizedSkeletonLoader**: Progressive and performance-optimized loading states
- **LazyRendered Components**: Components that intelligently delay rendering until needed

### Documentation

A comprehensive documentation suite guides developers in applying optimization techniques:

- **Component Optimization Guide**: Practical strategies for optimizing React components
- **UX/UI Style Guide**: Standards for animations, interactions, and visual feedback
- **Performance Checklist**: Pre-deployment verification for optimal performance
- **Optimization Demo**: Interactive examples of optimization techniques

### Key Performance Principles

1. **Measure First**: All optimizations start with measurement and analysis
2. **Progressive Enhancement**: Critical content loads first, with enhancements progressively added
3. **GPU Acceleration**: Animations and transitions utilize GPU for smooth performance
4. **Intelligent Loading**: Content is loaded and rendered based on visibility and priority
5. **Accessibility Integration**: Performance optimizations work with accessibility features

Visit the documentation at `/documentation/optimization-demo` to see these principles in action.

## UI/UX Enhancements

The application has undergone significant UI/UX improvements to create a more intuitive, engaging, and responsive user experience. These enhancements focus on improving user interaction without changing core functionality.

### Template Components

#### Template Card
- Added smooth hover and tap animations for micro-interactions
- Implemented progressive content reveal on hover
- Enhanced visual hierarchy with better typography and spacing
- Added visual feedback for interactive elements
- Improved badge design and placement

#### Template Browser
- Created a sticky header with improved search and filter controls
- Added keyboard shortcuts for common actions
- Implemented progressive loading of templates
- Enhanced empty and loading states
- Improved responsive design for various screen sizes

#### Template Sidebar
- Added expandable settings for each section
- Implemented drag-and-drop for section reordering
- Enhanced visibility controls with toggle switches
- Added smooth transitions and context menus
- Improved visual hierarchy and information display

### Analytics Components

#### Template Metrics Card
- Implemented progressive disclosure of detailed metrics
- Added interactive elements with hover states
- Enhanced data visualization with better color coding
- Implemented tooltips for metric explanations
- Added smooth animations for expanding/collapsing sections

#### Performance Chart
- Added time range controls for better data analysis
- Implemented interactive tooltips for data points
- Enhanced visual feedback for data trends
- Added fullscreen mode for detailed analysis
- Improved benchmark visualization

### Editor Components

#### Template Editor
- Streamlined controls with progressive disclosure
- Added keyboard shortcuts for common actions
- Improved preview mode with device toggle
- Enhanced fullscreen mode for focused editing
- Added subtle animations for user feedback

#### Editor Header
- Reorganized controls for better workflow
- Added visual feedback for save states
- Improved AI generation controls
- Enhanced sharing and export options
- Added tooltips for feature discovery

### Key UX Principles Applied

1. **Intuitive Interaction**: Controls are placed where users expect them with clear affordances.
2. **Progressive Disclosure**: Complex options are revealed progressively to reduce cognitive load.
3. **Visual Feedback**: All interactions provide immediate visual feedback.
4. **Consistency**: Design patterns are consistent across components.
5. **Reduced Friction**: Common tasks require fewer clicks and provide clear paths.

These enhancements maintain all existing functionality while significantly improving the user experience through thoughtful design and interaction improvements.

## Features

- **Template Library**: Access a vast collection of trending templates across various categories
- **AI-Powered Remixing**: Customize templates with AI-assisted suggestions
- **Performance Prediction**: Get AI predictions for how your content will perform
- **Analytics Dashboard**: Track performance of templates with detailed metrics
- **Newsletter Integration**: Generate shareable links with performance tracking
- **Expert vs. AI Comparison**: Compare AI-generated content with expert-created content
- **Video Analysis**: Extract templates from popular videos with automatic structure detection
- **Sound Integration**: Browse, preview and add trending sounds to your templates

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Firebase (Firestore, Storage, Authentication)
- **AI**: OpenAI, Anthropic Claude, and custom AI pipelines
- **Authentication**: Firebase Auth with multiple providers
- **Analytics**: Custom analytics pipeline with Firebase
- **Performance**: Custom performance monitoring and optimization framework

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project (for database and authentication)
- OpenAI API key (for AI features)
- Anthropic API key (for Claude integration)

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/trendzo.git
cd trendzo
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables - create a `.env.local` file with:
```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# AI API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Base URL for the application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. Start the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Testing

Trendzo includes a comprehensive testing suite built with Jest and React Testing Library.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only component tests
npm run test:components
```

### Test Structure

Tests are organized in the `src/__tests__` directory:

- `components/`: Tests for UI components
- `hooks/`: Tests for custom React hooks
- `lib/`: Tests for utility functions and services

### Writing Tests

When adding new features, create corresponding tests following these patterns:

```typescript
// Example component test
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent prop="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Development Workflow

### Project Structure

- `src/app`: Next.js App Router pages and layouts
  - `(dashboard)`: Dashboard-related pages (grouped route)
  - `api`: API routes
  - `documentation`: Performance and optimization documentation
- `src/components`: Reusable React components
  - `ui`: UI primitives (buttons, cards, etc.)
  - `layout`: Layout components (header, sidebar, etc.)
  - `common`: Shared components including optimization utilities
  - `development`: Development tools like performance monitors
  - `sounds`: Sound-related components (player, browser, controls)
  - `templates`: Template editor and related components
- `src/lib`: Utility functions, services, and hooks
  - `contexts`: React context providers
  - `firebase`: Firebase configuration and utilities
  - `hooks`: Custom React hooks including optimization hooks
  - `services`: Application services
  - `utils`: Utility functions including performance optimization

### Performance Optimization Workflow

When optimizing components, follow this workflow:

1. **Measure**: Use MetricsMonitor and withPerformanceTracking to identify bottlenecks
2. **Analyze**: Review render patterns, animation performance, and data loading
3. **Apply**: Implement appropriate optimization strategies from the Component Optimization Guide
4. **Validate**: Verify improvements with PerformanceVisualizer
5. **Document**: Document optimization techniques used in the component

For detailed guidance, refer to the `/documentation/PerformanceChecklist.mdx` document.

### Sound Integration Feature

Trendzo includes a comprehensive sound integration system for templates:

#### Sound Component Features

- **Sound Player**: A full-featured audio player with waveform visualization
- **Sound Browser**: Browse and search trending sounds with filtering
- **Sound Details**: View detailed analytics for sounds including usage trends
- **Sound Controls**: Simple audio controls for playing/pausing sounds

#### Template Integration

Templates can be linked with trending sounds for better engagement:

1. **Sound Selection**: Browse and select from trending sounds based on template category
2. **Sound Preview**: Preview sounds before adding them to templates 
3. **Sound Analytics**: View performance data on sounds to make informed decisions
4. **API Integration**: Backend APIs for linking sounds to templates

#### Demo Pages

- Sound Player: `/sounds/player`
- Sound Browser: `/sounds/browser`
- Template Sound Integration: `/templates/sounds`
- Performance Optimization Demo: `/documentation/optimization-demo`

#### API Endpoints

- `GET /api/sounds/trending`: Get trending sounds with analytics
- `GET /api/sounds/:id`: Get detailed information for a specific sound
- `POST /api/templates/link-sound`: Link a sound to a template
- `POST /api/templates/unlink-sound`: Remove a sound from a template

### Code Style & Linting

- TypeScript for static type checking
- ESLint for code linting
- Prettier for code formatting

### Deployment

The application is configured for deployment on Vercel:

```bash
# Build for production
npm run build

# Preview production build locally
npm run start
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'feat(component): add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Create a Pull Request

## Sample Audio Files

The project includes sample audio files for testing the SoundPlayer component. These files are located in the `public/audio` directory and are used in the sound player demo.

To update or add new sample audio files:

1. Place MP3 files in the `public/audio` directory, or
2. Run the audio update script to download the latest test audio samples:
```bash
npm run update-audio
```

The sample audio URLs are defined as:
- `/audio/guitar-acoustic.mp3`
- `/audio/electronic-beat.mp3`
- `/audio/piano-melody.mp3`

Sample audio files are sourced from GitHub's audio sample repository under open licenses.