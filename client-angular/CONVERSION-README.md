# React to Angular Conversion - ConvoX Chat App

This Angular application is a straightforward conversion of the React frontend following these principles:

## Conversion Approach

### ✅ What Was Converted:

1. **Contexts → Services**
   - `AuthContext` → `AuthService` (using BehaviorSubjects for state)
   - API calls → `ApiService` (using HttpClient with Promises via firstValueFrom)
   - Socket logic → `SocketService` (using socket.io-client directly)

2. **Components Structure**
   - React components → Angular standalone components
   - Props → `@Input()` decorators
   - Callbacks → `@Output()` with EventEmitter
   - JSX → Angular templates (.html files)

3. **State Management**
   - React useState → Component properties
   - React useEffect → Angular lifecycle hooks (ngOnInit, ngOnDestroy)
   - Context subscriptions → Service observables with subscribe

4. **Completed Components:**
   - ✅ Login page
   - ✅ Register page  
   - ✅ Navbar
   - ✅ ProfileModal (simplified - no image cropping)
   - ✅ AppContent layout
   - ✅ Basic ChatInterface structure

## Setup Instructions

### 1. Install Dependencies

```bash
cd client-angular
npm install socket.io-client
```

### 2. Configure Environment

Update `src/environments/environment.ts` with your API endpoints:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',  // Your backend API URL
  socketUrl: 'http://localhost:5000' // Your Socket.IO server URL
};
```

### 3. Run the Application

```bash
npm start
# or
ng serve
```

The application will be available at `http://localhost:4200`

## What's Working

- ✅ User authentication (login/register)
- ✅ Profile management (view/edit profile, upload photo)
- ✅ Basic chat interface structure
- ✅ Service layer for API calls
- ✅ Socket service setup

## What Needs Completion

The chat components (LeftSidebar, ChatArea, MessageArea, etc.) are currently placeholder components. To complete the full chat functionality, you would need to:

1. **Convert remaining chat components:**
   - ConversationList
   - GroupList
   - MessageArea
   - InputMessage
   - ChatHeader
   - CreateGroupModal
   - etc.

2. **Implement Socket.IO integration in ChatInterface:**
   - Connect to socket in component
   - Handle message events
   - Update UI on socket events

3. **Add missing features:**
   - Image cropping in ProfileModal (if needed)
   - File upload functionality
   - Message editing/deletion UI
   - Group management UI

## Key Differences from React

### State Management
**React:**
```typescript
const [user, setUser] = useState<User | null>(null);
```

**Angular:**
```typescript
user: User | null = null;
// Updated directly in component or via service subscription
```

### Props and Events
**React:**
```typescript
interface Props {
  onToggle: () => void;
  data: string;
}
```

**Angular:**
```typescript
@Input() data!: string;
@Output() toggle = new EventEmitter<void>();
```

### Context/Services
**React:**
```typescript
const { user } = useAuth();
```

**Angular:**
```typescript
constructor(private authService: AuthService) {}
ngOnInit() {
  this.authService.user$.subscribe(user => this.user = user);
}
```

### Async Operations
Both use Promises as requested (no RxJS complexity):
```typescript
// In service
async login(email: string, password: string): Promise<void> {
  const data = await this.http.post(...).toPromise();
  // ... handle data
}

// In component  
async onSubmit(): Promise<void> {
  await this.authService.login(this.email, this.password);
}
```

## File Structure

```
src/app/
├── components/
│   ├── app-content/           # Main layout component
│   ├── navbar/                # Top navigation bar
│   └── profile-modal/         # User profile editor
├── pages/
│   ├── login/                 # Login page
│   ├── register/              # Registration page
│   └── chat-interface/        # Main chat interface (basic structure)
├── services/
│   ├── auth.service.ts        # Authentication service
│   ├── api.service.ts         # HTTP API calls
│   └── socket.service.ts      # Socket.IO service
├── types/
│   └── chat-types.ts          # TypeScript interfaces
├── constants/
│   └── api-endpoints.ts       # API endpoint definitions
└── utils/
    └── date-utils.ts          # Date formatting utilities
```

## Notes

- All services use Angular's dependency injection
- Components are standalone (no NgModules needed)
- Using Tailwind CSS (same as React version)
- Socket.IO client is imported directly (no wrapper needed)
- Promises are used instead of Observables where possible (as requested)
- No advanced Angular patterns (NgRx, Signals, etc.) - kept simple

## Next Steps

1. Complete the remaining chat components by following the same conversion pattern
2. Integrate Socket.IO in the chat interface
3. Test authentication flow
4. Test real-time messaging
5. Add any additional features as needed

The foundation is ready - all services, auth flow, and basic UI structure are in place!
