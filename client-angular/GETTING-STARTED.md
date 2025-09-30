# Getting Started with Angular ConvoX

## Quick Start

### 1. Install Dependencies
```bash
cd client-angular
npm install
```

### 2. Configure Backend URL

Edit `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',      // Your backend API
  socketUrl: 'http://localhost:5000'    // Your Socket.IO server
};
```

### 3. Run the Application
```bash
npm start
```

Visit `http://localhost:4200` in your browser.

## What's Implemented

### ✅ Fully Functional
1. **Authentication System**
   - Login page with form validation
   - Register page with form validation
   - JWT token management
   - Auto-login on app reload
   - Logout functionality

2. **User Profile**
   - View user profile
   - Edit bio
   - Upload profile picture
   - Read-only username/email fields

3. **Services**
   - `AuthService` - User authentication state
   - `ApiService` - All HTTP API calls  
   - `SocketService` - Socket.IO real-time communication setup

4. **Layout**
   - Top navigation bar with user info
   - Responsive design
   - Loading states

### ⚠️ Basic Structure Only
The **ChatInterface** page has a basic layout but needs the full chat components to be implemented. The foundation is there - you can expand it by:

1. Creating the conversation list component
2. Creating the message area component
3. Creating the input message component
4. Integrating the SocketService for real-time messages

## Conversion Highlights

### React → Angular Mappings

| React Pattern | Angular Equivalent |
|---------------|-------------------|
| `useState` | Component properties |
| `useEffect` | `ngOnInit`, `ngOnDestroy` |
| `useContext` | Service injection |
| Props | `@Input()` |
| Callbacks | `@Output()` + `EventEmitter` |
| Context Provider | Service with BehaviorSubject |

### Example: Login Component

**React:**
```tsx
const Login: React.FC<LoginProps> = ({ onToggleMode }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  // ...
}
```

**Angular:**
```typescript
export class Login {
  @Output() toggleMode = new EventEmitter<void>();
  email = '';
  
  constructor(private authService: AuthService) {}
  
  async onSubmit() {
    await this.authService.login(this.email, this.password);
  }
}
```

## Folder Structure

```
src/app/
├── components/
│   ├── app-content/          # Main app layout (auth routing)
│   ├── navbar/               # Top navigation
│   └── profile-modal/        # Profile editor
├── pages/
│   ├── login/               # Login page
│   ├── register/            # Register page
│   └── chat-interface/      # Chat UI (basic structure)
├── services/
│   ├── auth.service.ts      # Auth state management
│   ├── api.service.ts       # HTTP calls
│   └── socket.service.ts    # Socket.IO client
├── types/
│   └── chat-types.ts        # TypeScript interfaces
├── constants/
│   └── api-endpoints.ts     # API URLs
└── utils/
    └── date-utils.ts        # Utilities
```

## Key Simplifications (As Requested)

1. **No RxJS Complexity** - Services use Promises via `firstValueFrom()`
2. **No NgRx** - Simple service-based state management
3. **No Signals** - Traditional component properties
4. **No Advanced DI** - Straightforward service injection
5. **Standalone Components** - No NgModules needed
6. **Direct Socket.IO** - No Observable wrapper

## Next Steps to Complete the App

### 1. Implement Chat Components

Create these components following the same pattern as Login/Register:

- `conversation-list` - Shows list of chats
- `message-area` - Displays messages
- `input-message` - Message input box
- `group-list` - Shows groups
- `create-group-modal` - Group creation dialog

### 2. Integrate Socket.IO in ChatInterface

```typescript
ngOnInit() {
  this.socketService.connect(
    this.token!,
    () => this.authService.logout(),
    (updateFn) => { this.messages = updateFn(this.messages); },
    (users) => { this.onlineUsers = users; }
  );
}
```

### 3. Add Message Handling

Use the `ApiService` methods:
- `fetchMessages()`
- `sendMessage()`
- `markMessagesAsRead()`
- `editMessage()`
- `deleteMessageForMe()`
- etc.

## Testing the Current Implementation

1. **Start your backend server** (on port 5000)
2. **Run the Angular app**: `npm start`
3. **Test Registration**: Create a new account
4. **Test Login**: Sign in with your account
5. **Test Profile**: Click your profile picture and edit your bio
6. **Test Logout**: Click the logout button

## Troubleshooting

### CORS Issues
If you see CORS errors, make sure your backend allows requests from `http://localhost:4200`

### Socket Connection Fails
- Check that `environment.socketUrl` matches your Socket.IO server
- Verify the backend Socket.IO server is running
- Check browser console for connection errors

### API Calls Fail
- Verify `environment.apiUrl` is correct
- Check that the backend server is running
- Look at Network tab in browser DevTools

## Additional Resources

- Angular docs: https://angular.dev
- Socket.IO client docs: https://socket.io/docs/v4/client-api/
- Tailwind CSS: https://tailwindcss.com/docs

---

**The foundation is complete!** You now have a working Angular app with authentication, profile management, and all the services needed for chat functionality. The chat UI components can be added incrementally following the same simple React → Angular conversion pattern used for the existing components.
