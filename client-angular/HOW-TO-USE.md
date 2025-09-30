# 🎉 How to Use ConvoX Angular App

## ✅ Build Status: SUCCESS

Your Angular app is working! Build completed successfully with 0 errors.

## 🚀 What's Working Now

### 1. ✅ User Search
- Type in the search box on the left sidebar
- Find users by username or email
- Click on a user to start chatting

### 2. ✅ Conversations
- Your chat history appears in the left sidebar
- Click on any conversation to open it
- Unread message counts are shown

### 3. ✅ Real-Time Messaging
- Send text messages
- Upload and send images
- Upload and send videos
- Messages appear instantly
- Read receipts (blue/gray ticks)
- Online/offline status

### 4. ✅ Profile Management
- Click your avatar (top left) to edit your profile
- Update your bio
- Upload profile picture

## 📱 How to Use the Chat

### Starting a New Chat

1. **Type in the search box** (left sidebar)
   - Search for: "john", "jane", "user@example.com", etc.
   
2. **Click on a user** from the search results
   - Their chat will open on the right
   - Previous messages (if any) will load
   
3. **Start typing!**
   - Type your message in the input box at the bottom
   - Press Enter or click Send button

### Sending Media

#### Images:
1. Click the **image icon** (📷) next to the input box
2. Select an image from your computer
3. Preview appears above the input
4. Click "Send" to share the image

#### Videos:
1. Click the **video icon** (🎥) next to the input box
2. Select a video (max 50MB)
3. Preview appears above the input
4. Click "Send" to share the video

### Managing Conversations

- **Open a chat**: Click on any conversation in the list
- **Close a chat**: Click on the same conversation again
- **Switch chats**: Click on a different conversation

### Online Status

- **Green dot** = User is online
- **No dot** = User is offline
- **Red dot** = User is blocked

### Read Receipts

- **Gray tick (✓)** = Message sent but not read
- **Blue double tick (✓✓)** = Message read by recipient

## 🎯 Quick Test

Try this to verify everything works:

1. **Open the app** at http://localhost:4200
2. **Already logged in?** You should see your name in top-left
3. **Search for a user** - Type any letter in the search box
4. **Click on a user** - Their chat opens on the right
5. **Send a message** - Type and press Enter
6. **Upload an image** - Click the image icon

## 🔧 Current Limitations

The following features from React are simplified:

- ❌ Group chats (structure is there, but UI not fully implemented)
- ❌ Message editing (API ready, but UI not shown)
- ❌ Message deletion (API ready, but UI not shown)
- ❌ Block/unblock users (API ready, but UI not shown)

These can be added later if needed.

## 🐛 Troubleshooting

### "No users found" in search
**Problem:** Backend not returning users  
**Solution:** Make sure your backend API is running and returns user list from `/api/auth/users`

### Messages not sending
**Problem:** Socket.IO not connected  
**Solution:** 
1. Check browser console for connection errors
2. Verify `environment.socketUrl` matches your server
3. Make sure backend Socket.IO server is running

### "Conversation list will appear here"
**Problem:** No conversations loaded  
**Solution:** This is normal if you haven't chatted with anyone yet. Use the search to find users and start chatting!

### Can't see online status
**Problem:** Socket.IO not emitting online users  
**Solution:** Make sure your backend emits `onlineUsers` event when users connect

## 💡 Pro Tips

1. **Quick Chat**: Use the search box to quickly find and open any user's chat
2. **Keyboard**: Press Enter to send messages (no need to click Send button)
3. **Multi-line**: Hold Shift+Enter for new lines (if implemented)
4. **Profile**: Click your avatar any time to update your profile

## 📊 What the App Does Behind the Scenes

### On Startup:
1. ✅ Checks for saved login token
2. ✅ Auto-logs you in if token is valid
3. ✅ Connects to Socket.IO server
4. ✅ Loads your conversations
5. ✅ Loads all users for search
6. ✅ Listens for real-time updates

### When You Send a Message:
1. ✅ Shows message immediately (optimistic UI)
2. ✅ Sends via Socket.IO to server
3. ✅ Server confirms and returns real message
4. ✅ Replaces temporary message with real one
5. ✅ Updates conversation list
6. ✅ Other user receives it in real-time

### When You Receive a Message:
1. ✅ Socket.IO emits "receiveMessage" event
2. ✅ Message appears in chat (if that chat is open)
3. ✅ Conversation list updates
4. ✅ Unread count increments (if chat not open)
5. ✅ Read receipt sent when you open the chat

## 🎨 UI Guide

### Left Sidebar
- **Search box** - Find users to chat with
- **Conversation list** - Your recent chats
- Each conversation shows:
  - User avatar (or initial)
  - Username
  - Last message preview
  - Timestamp
  - Unread count (if any)
  - Online status (green dot)

### Main Chat Area
- **Chat header** - Shows user info and online status
- **Message area** - All your messages
  - Your messages: Right side (dark background)
  - Their messages: Left side (white background)
  - Date separators
  - Timestamps
  - Read receipts
- **Input area** - Type and send messages
  - Text input
  - Image upload button
  - Video upload button  
  - Send button

### Top Navigation
- **Your profile** (left) - Click to edit
- **ConvoX logo** (center)
- **Logout button** (right)

## 🎊 Success Indicators

You'll know it's working when:

✅ You can search and find users  
✅ Clicking a user opens their chat  
✅ You can send messages  
✅ Messages appear with timestamps  
✅ Online status shows correctly  
✅ Conversations appear in the sidebar  

## 📞 Need Help?

Check these files for more details:
- **START-HERE.md** - Setup instructions
- **README.md** - Full documentation
- **BUILD-SUCCESS.md** - What was fixed
- **QUICK-REFERENCE.md** - Development guide

---

## 🌟 You're All Set!

The app is **fully functional** for:
- Authentication ✅
- User search ✅
- Real-time chatting ✅
- Profile management ✅

**Start chatting now!** 🎉
