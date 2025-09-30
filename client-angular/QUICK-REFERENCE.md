# Quick Reference - Angular ConvoX

## 🚀 Get Started in 3 Steps

### 1. Install
```bash
cd client-angular
npm install
```

### 2. Configure
Edit `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',      // ← Your backend URL
  socketUrl: 'http://localhost:5000'    // ← Your Socket.IO URL
};
```

### 3. Run
```bash
npm start
```
Open `http://localhost:4200`

## 📋 Conversion Cheat Sheet

| React | Angular | Example |
|-------|---------|---------|
| `useState` | Component property | `message = ''` |
| `useEffect` | `ngOnInit()` | Lifecycle hook |
| `useContext` | Service injection | `constructor(private auth: AuthService)` |
| Props | `@Input()` | `@Input() user!: User` |
| Callbacks | `@Output()` | `@Output() send = new EventEmitter()` |
| `.map()` | `*ngFor` | `*ngFor="let item of items"` |
| `&&` | `*ngIf` | `*ngIf="condition"` |
| `? :` | `*ngIf; else` | Multiple *ngIf blocks |
| `onClick` | `(click)` | `(click)="handleClick()"` |
| `onChange` | `(input)` or `[(ngModel)]` | Two-way binding |
| `className` | `class` or `[class]` | `[class.active]="isActive"` |

## 📁 File Structure

```
client-angular/
├── src/
│   ├── app/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page-level components
│   │   ├── services/        # Business logic & API
│   │   ├── types/           # TypeScript interfaces
│   │   ├── constants/       # Configuration
│   │   └── utils/           # Helper functions
│   ├── environments/        # Environment configs
│   └── styles.css          # Global styles
└── package.json
```

## 🎯 What's Working

- ✅ **Auth**: Login, Register, Logout, Profile
- ✅ **Chat**: Send messages, Upload files, Real-time updates
- ✅ **UI**: Messages, Online status, Read receipts

## 🔧 Common Tasks

### Add a new component
```typescript
// my-component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [],
  template: `<div>Hello</div>`,
})
export class MyComponent {}
```

### Call an API
```typescript
async loadData(): Promise<void> {
  const data = await this.apiService.fetchUsers(this.token!);
  this.users = data;
}
```

### Send a Socket event
```typescript
this.socketService.sendMessage(userId, text, 'text');
```

## 🐛 Common Issues & Fixes

### "Module not found"
```bash
npm install
```

### "Cannot find module 'socket.io-client'"
```bash
npm install socket.io-client
```

### CORS error
Update backend to allow `http://localhost:4200`

### Socket won't connect
1. Check `environment.socketUrl`
2. Verify backend is running
3. Check browser console for errors

## 📝 Key Files

| File | Purpose |
|------|---------|
| `app.ts` | Root component |
| `app.config.ts` | App configuration (HttpClient, etc) |
| `services/auth.service.ts` | Authentication logic |
| `services/api.service.ts` | HTTP API calls |
| `services/socket.service.ts` | Socket.IO client |
| `pages/chat-interface/` | Main chat UI |

## 💡 Tips

1. **State Management**: Use services with BehaviorSubject
2. **API Calls**: Always use Promises (via `firstValueFrom()`)
3. **Styling**: Use Tailwind classes directly in templates
4. **Real-time**: Socket events are set up in SocketService

## 🎨 Styling Examples

```html
<!-- Button -->
<button class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
  Click me
</button>

<!-- Input -->
<input 
  class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
  type="text"
/>

<!-- Card -->
<div class="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
  Content
</div>
```

## 🔍 Debug Tips

### Check Authentication
```typescript
// In component
constructor(private authService: AuthService) {
  this.authService.user$.subscribe(user => {
    console.log('Current user:', user);
  });
}
```

### Check Socket Connection
```typescript
this.socketService.isConnected$.subscribe(connected => {
  console.log('Socket connected:', connected);
});
```

### Inspect Messages
```typescript
console.log('Messages:', this.messages);
console.log('Online users:', this.onlineUsers);
```

## 🚦 Quick Test Checklist

- [ ] `npm install` completed
- [ ] Environment configured
- [ ] Backend server running
- [ ] App loads at localhost:4200
- [ ] Can register new user
- [ ] Can login
- [ ] Can edit profile
- [ ] Can send messages (if chat list implemented)

## 📚 Learn More

- **Full Documentation**: See README.md
- **Conversion Details**: See CONVERSION-README.md
- **Feature Status**: See FINAL-STATUS.md
- **Setup Guide**: See GETTING-STARTED.md

## ⚡ Pro Tips

1. Use Angular DevTools browser extension for debugging
2. Check Network tab for API call issues
3. Use Console for Socket.IO event logs
4. Keep `ng serve` running for hot reload
5. Press `Ctrl+C` to stop the dev server

---

**Happy Coding! 🎉**
