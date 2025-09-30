import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { User, Message, OnlineUser, Conversation, Group, GroupWithUnread } from '../../types/chat-types';
import { ChatHeader } from '../../components/chat-header/chat-header';
import { MessageArea } from '../../components/message-area/message-area';
import { InputMessage } from '../../components/input-message/input-message';
import { LeftSidebar } from '../../components/left-sidebar/left-sidebar';

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [CommonModule, ChatHeader, MessageArea, InputMessage, LeftSidebar],
  templateUrl: './chat-interface.html',
  styleUrls: ['./chat-interface.css']
})
export class ChatInterface implements OnInit, OnDestroy {
  user: User | null = null;
  token: string | null = null;
  conversations: Conversation[] = [];
  allUsers: User[] = [];
  selectedUser: User | null = null;
  selectedGroup: Group | null = null;
  messages: Message[] = [];
  onlineUsers: OnlineUser[] = [];
  groups: GroupWithUnread[] = [];
  
  // Input state
  newMessage = '';
  selectedImage: string | null = null;
  selectedVideo: string | null = null;
  isUploading = false;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.user = user;
      if (!user) {
        this.clearState();
      }
    });

    this.authService.token$.subscribe(token => {
      this.token = token;
      if (token && this.user) {
        this.initializeSocket();
      }
    });
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }

  private clearState(): void {
    this.conversations = [];
    this.allUsers = [];
    this.selectedUser = null;
    this.selectedGroup = null;
    this.messages = [];
    this.onlineUsers = [];
    this.groups = [];
  }

  private initializeSocket(): void {
    if (!this.token) return;

    this.socketService.connect(
      this.token,
      () => this.authService.logout(),
      (updateFn) => { this.messages = updateFn(this.messages); },
      (users) => { this.onlineUsers = users; }
    );

    this.socketService.setCurrentUserId(this.user?.id);
  }

  async loadMessages(): Promise<void> {
    if (!this.token || !this.selectedUser) return;

    try {
      const fetchedMessages = await this.apiService.fetchMessages(this.token, this.selectedUser.id);
      this.messages = fetchedMessages;
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  onUserSelect(user: User): void {
    // If clicking same user, deselect
    if (this.selectedUser?.id === user.id) {
      this.selectedUser = null;
      this.selectedGroup = null;
      this.messages = [];
      this.socketService.setSelectedUser(null);
      return;
    }

    this.selectedUser = user;
    this.selectedGroup = null;
    this.messages = [];
    this.socketService.setSelectedUser(user);
    this.loadMessages();
  }

  onConversationsChange(conversations: Conversation[]): void {
    this.conversations = conversations;
  }

  onAllUsersChange(users: User[]): void {
    this.allUsers = users;
  }

  onMessageChange(message: string): void {
    this.newMessage = message;
  }

  async onSendMessage(): Promise<void> {
    if (!this.newMessage.trim() || !this.selectedUser) return;

    const messageText = this.newMessage.trim();
    this.newMessage = '';

    // Optimistic message
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      sender: { _id: this.user?.id || '', username: this.user?.username || '' },
      receiver: { _id: this.selectedUser.id, username: this.selectedUser.username },
      text: messageText,
      messageType: 'text',
      createdAt: new Date().toISOString(),
    };

    this.messages = [...this.messages, tempMessage];

    // Send via socket
    this.socketService.sendMessage(this.selectedUser.id, messageText, 'text');
  }

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

  onVideoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('Video file is too large. Please select a video smaller than 50MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedVideo = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async onSendImage(): Promise<void> {
    if (!this.selectedImage || !this.selectedUser) return;

    this.isUploading = true;
    // Implementation for sending image
    // ... (socket emit logic)
    this.selectedImage = null;
    this.isUploading = false;
  }

  async onSendVideo(): Promise<void> {
    if (!this.selectedVideo || !this.selectedUser) return;

    this.isUploading = true;
    // Implementation for sending video
    // ... (socket emit logic)
    this.selectedVideo = null;
    this.isUploading = false;
  }

  onRemoveSelectedImage(): void {
    this.selectedImage = null;
  }

  onRemoveSelectedVideo(): void {
    this.selectedVideo = null;
  }
}
