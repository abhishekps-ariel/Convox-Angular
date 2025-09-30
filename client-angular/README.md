# ConvoX - Angular Chat Application

A straightforward React-to-Angular conversion of the ConvoX chat application.

## 🎯 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm
- A running backend server (Node.js/Express with Socket.IO)

### Installation

```bash
cd client-angular
npm install
```

### Configuration

Update `src/environments/environment.ts` with your backend URLs:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',      // Your API server
  socketUrl: 'http://localhost:5000'    // Your Socket.IO server
};
```

### Run Development Server

```bash
npm start
```

The application will be available at `http://localhost:4200`

### Build for Production

```bash
npm run build
```

## ✅ Features Implemented

### Authentication
- ✅ User registration with validation
- ✅ User login with JWT tokens
- ✅ Auto-login from localStorage
- ✅ Secure logout

### Profile Management
- ✅ View user profile
- ✅ Edit bio (up to 150 characters)
- ✅ Upload profile picture
- ✅ Display user information

### Chat Features
- ✅ Real-time messaging with Socket.IO
- ✅ Send text messages
- ✅ Image upload and preview
- ✅ Video upload and preview
- ✅ Online/offline status indicators
- ✅ Read receipts (blue/gray ticks)
- ✅ Message timestamps
- ✅ Date separators
- ✅ Group chat support (basic)
- ✅ Sender names in group chats

### UI Components
- ✅ Responsive layout
- ✅ Modern Tailwind CSS styling
- ✅ Loading states
- ✅ Error handling
- ✅ File upload previews

## 📁 Project Structure

```
src/app/
├── components/
│   ├── app-content/          # Main app layout
│   ├── navbar/               # Top navigation
│   ├── profile-modal/        # Profile editor
│   ├── chat-header/          # Chat user header
│   ├── message-area/         # Message display
│   └── input-message/        # Message input
├── pages/
│   ├── login/               # Login page
│   ├── register/            # Register page
│   └── chat-interface/      # Main chat UI
├── services/
│   ├── auth.service.ts      # Authentication
│   ├── api.service.ts       # HTTP API calls
│   └── socket.service.ts    # Socket.IO client
├── types/
│   └── chat-types.ts        # TypeScript interfaces
├── constants/
│   └── api-endpoints.ts     # API URLs
└── utils/
    └── date-utils.ts        # Date formatting
```

## 🔑 Key Technologies

- **Angular 20** - Latest standalone components
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first styling
- **Socket.IO Client** - Real-time communication
- **RxJS** - Reactive programming (minimal use)

## 🎨 Design Principles

This conversion follows these principles:

1. **Simplicity** - No advanced Angular patterns
2. **Direct Translation** - React patterns → Angular equivalents
3. **Promises over Observables** - Easier async handling
4. **Standalone Components** - No NgModules
5. **Service-based State** - Simple BehaviorSubjects

## 📝 React → Angular Patterns

### State Management
**React:** `const [user, setUser] = useState(null)`  
**Angular:** `user: User | null = null`

### Props
**React:** `interface Props { data: string }`  
**Angular:** `@Input() data!: string`

### Events
**React:** `onToggle: () => void`  
**Angular:** `@Output() toggle = new EventEmitter()`

### Context
**React:** `const { user } = useAuth()`  
**Angular:** `constructor(private authService: AuthService)`

## 🚀 Usage Examples

### Send a Message
```typescript
async onSendMessage(): Promise<void> {
  const tempMessage: Message = {
    _id: `temp-${Date.now()}`,
    sender: { _id: this.user?.id || '', username: this.user?.username || '' },
    receiver: { _id: this.selectedUser.id, username: this.selectedUser.username },
    text: this.newMessage,
    messageType: 'text',
    createdAt: new Date().toISOString(),
  };

  this.messages = [...this.messages, tempMessage];
  this.socketService.sendMessage(this.selectedUser.id, this.newMessage, 'text');
  this.newMessage = '';
}
```

### Upload an Image
```typescript
onImageSelect(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedImage = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}
```

## 📚 Additional Documentation

- **GETTING-STARTED.md** - Detailed setup guide
- **CONVERSION-README.md** - Conversion approach and patterns
- **FINAL-STATUS.md** - Complete feature status

## 🐛 Troubleshooting

### CORS Issues
Make sure your backend allows requests from `http://localhost:4200`

### Socket Connection Fails
- Verify `environment.socketUrl` is correct
- Check backend Socket.IO server is running
- Look for errors in browser console

### Messages Not Sending
- Ensure you're logged in
- Check Socket.IO connection status
- Verify backend is running

## 🔧 Development

### Add a New Component
```bash
# Create component files manually following the pattern:
# my-component.ts (logic)
# my-component.html (template)
# my-component.css (styles)
```

### Extend a Service
```typescript
@Injectable({ providedIn: 'root' })
export class MyService {
  constructor(private http: HttpClient) {}
  
  async myMethod(): Promise<Data> {
    return await firstValueFrom(
      this.http.get<Data>('/api/endpoint')
    );
  }
}
```

## 📄 License

This project is part of a training exercise.

## 👥 Support

For issues or questions, refer to the documentation files or check the React source code for reference implementation.

---

**Built with Angular | Styled with Tailwind | Powered by Socket.IO**