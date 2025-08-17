# Gantt Web App

React frontend for the Gantt Queue Planner application with drag-and-drop task management, real-time updates, and responsive design.

## Purpose

Interactive web interface for managing Gantt charts with task assignment, staff queues, and timeline visualization. Features include drag-and-drop task reordering, real-time collaboration, CSV import/export, and accessibility-first design.

## Quickstart

```bash
# Install dependencies
npm install

# Start development server (API should be running on port 4000)
npm run dev

# App will be available at http://localhost:5173
```

## Scripts

- `npm run dev` - Start Vite development server with HMR
- `npm run build` - Build for production (TypeScript + Vite)
- `npm run preview` - Preview production build locally
- `npm run test` - Run test suite with Vitest
- `npm run test:ui` - Run tests with interactive UI
- `npm run test:coverage` - Run tests with coverage report

## Environment Variables

The app uses Vite's environment variable system. Create a `.env.local` file:

```env
# API Backend URL (development)
VITE_API_URL="http://localhost:4000"

# Production
VITE_API_URL="https://your-api-domain.com"
```

## Architecture

### Tech Stack
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite with fast HMR
- **Routing**: React Router v6 with lazy loading
- **State Management**: TanStack Query for server state + React hooks for UI state
- **Drag & Drop**: @dnd-kit for accessible drag-and-drop
- **Styling**: CSS custom properties with CSS-in-JS
- **Icons**: Lucide React for consistent iconography
- **Data Handling**: Papa Parse for CSV import/export

### Key Features
- **Drag & Drop**: Accessible task reordering between staff queues
- **Real-time Updates**: TanStack Query for optimistic updates
- **Responsive Design**: Mobile-first with collapsible sidebar
- **Keyboard Navigation**: Full keyboard accessibility support
- **Search & Filter**: Real-time task search across all data
- **CSV Import/Export**: Bidirectional data exchange
- **Share Links**: Public read-only project sharing
- **Multi-Project**: Project selector with user isolation

### Component Architecture
```
src/
├── components/          # Shared UI components
│   ├── Board.tsx       # Main layout with sidebar
│   ├── Gantt.tsx       # Timeline visualization
│   ├── TaskCard.tsx    # Individual task display
│   ├── StaffQueues.tsx # Drag & drop staff columns
│   └── ...
├── hooks.ts            # Custom React hooks
├── api.ts              # API client with TanStack Query
├── types.ts            # TypeScript definitions
└── test/               # Test setup and utilities
```

## Core Components

### Board Component
Main layout container managing:
- Collapsible sidebar with task backlog
- Gantt chart timeline display
- Search and filter controls
- Responsive layout switching

### Gantt Chart
Timeline visualization featuring:
- Automatic date calculation with weekend skipping
- Zoom controls (20-60px per day)
- Task dependency visualization
- Staff queue swim lanes
- Working day axis calculation

### Task Management
- **TaskCard**: Drag-enabled task representation
- **EditTaskModal**: Inline editing with validation
- **TaskDetailDrawer**: Full task details and metadata
- **BacklogPanel**: Unassigned task queue

### Drag & Drop System
Built with @dnd-kit for accessibility:
- Keyboard-navigable drag operations
- Screen reader announcements
- Visual drop zone indicators
- Optimistic UI updates

## State Management

### Server State (TanStack Query)
- Task CRUD operations with optimistic updates
- Staff management and assignment
- Project switching and creation
- Real-time data synchronization
- Error handling and retry logic

### UI State (React Hooks)
- Sidebar collapse state
- Search query filtering
- Modal and drawer visibility
- Timeline zoom and date controls
- Keyboard navigation state

## Accessibility Features

### Keyboard Support
- **Arrow Keys**: Navigate between tasks
- **Enter**: Edit selected task
- **I**: Show task details
- **N**: Create new task
- **Delete**: Remove selected task
- **Tab**: Standard focus navigation

### Screen Reader Support
- Semantic HTML structure
- ARIA labels for interactive elements
- Role definitions for drag-and-drop
- Live region announcements for updates
- Form validation messaging

### Visual Accessibility
- High contrast design tokens
- Focus indicators on all interactive elements
- Responsive text scaling
- Color-blind friendly theme colors
- Reduced motion preferences

## Testing

### Test Setup
- **Vitest**: Fast unit test runner
- **Testing Library**: React component testing
- **jsdom**: Browser environment simulation
- **MSW**: API mocking (future)

### Coverage Thresholds
- Lines: 80%
- Branches: 70%
- Functions: 80%
- Statements: 80%

### Test Categories
- **Unit Tests**: Component behavior and hooks
- **Integration Tests**: Data flow and API interaction
- **Accessibility Tests**: Keyboard navigation and screen readers

## Performance

### Optimization Techniques
- **Code Splitting**: Route-based lazy loading
- **React Query**: Intelligent caching and background updates
- **Memoization**: Selective re-render prevention
- **Virtual Scrolling**: Large dataset handling (planned)

### Bundle Optimization
- Tree shaking for minimal bundle size
- Dynamic imports for large dependencies
- Asset optimization through Vite
- Progressive loading strategies

## Development Guidelines

### Component Patterns
- Pure functional components with TypeScript
- Custom hooks for reusable logic
- Props interface documentation
- Error boundary implementation

### Styling Approach
- CSS custom properties for theming
- Utility-first spacing system
- Component-scoped styles
- Responsive design tokens

### API Integration
- TanStack Query for all server communication
- Optimistic updates for better UX
- Error handling with user feedback
- Request deduplication and caching

## Troubleshooting

### Common Development Issues

1. **API Connection Errors**
   - Verify API server is running on port 4000
   - Check CORS configuration in API
   - Confirm `VITE_API_URL` environment variable

2. **Build Failures**
   - Clear node_modules and reinstall
   - Verify TypeScript configuration
   - Check for type errors: `npm run build`

3. **Hot Reload Not Working**
   - Restart Vite dev server
   - Clear browser cache
   - Check for file system watching issues

4. **Drag & Drop Issues**
   - Verify @dnd-kit version compatibility
   - Check for touch device configuration
   - Ensure proper sensor setup

### Performance Issues
- Use React DevTools Profiler
- Monitor TanStack Query DevTools
- Check for unnecessary re-renders
- Verify query cache optimization

## Production Build

For production deployment:
```bash
# Build optimized bundle
npm run build

# Preview production build locally
npm run preview

# Serve dist/ directory with static file server
```

### Deployment Considerations
- Configure `VITE_API_URL` for production API
- Set up proper CSP headers
- Enable compression and caching
- Configure error monitoring
- Set up analytics if needed

## Future Enhancements

### Planned Features
- Offline support with service worker
- Real-time collaboration via WebSockets
- Advanced filtering and sorting
- Gantt chart dependency lines
- Mobile app using React Native
- Integration with project management tools