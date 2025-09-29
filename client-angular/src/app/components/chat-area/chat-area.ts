import { Component, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { User, Message, OnlineUser, Conversation, Group } from '../../types/chat-types';

@Component({
  selector: 'app-chat-area',
  imports: [CommonModule],
  templateUrl: './chat-area.html'
})
export class ChatArea {
  // Inputs from parent component
  selectedUser = input<User | null>(null);
  selectedGroup = input<Group | null>(null);
  messages = input<Message[]>([]);
  onlineUsers = input<OnlineUser[]>([]);
  conversations = input<Conversation[]>([]);
  allUsers = input<User[]>([]);
  socket = input<any>(null);

  // Outputs to parent component
  onMessagesChange = output<Message[]>();
  onOnlineUsersChange = output<OnlineUser[]>();
  onConversationsChange = output<Conversation[]>();
  onSocketChange = output<any>();
  onGroupMessageReceived = output<{ message: Message; shouldIncrementUnread: boolean }>();
  onGroupCreated = output<Group>();

  // Local state
  newMessage = signal('');
  showScrollButton = signal(false);
  selectedImage = signal<string | null>(null);
  selectedVideo = signal<string | null>(null);
  isUploading = signal(false);
  viewingImage = signal<string | null>(null);
  viewingVideo = signal<string | null>(null);
  showAddMembersModal = signal(false);
  forceScrollToBottom = signal(false);
  
  // Current user
  user = signal<User | null>(null);

  constructor(
    private authService: AuthService,
    private socketService: SocketService
  ) {
    this.authService.user$.subscribe(user => {
      this.user.set(user);
    });
  }

  // Message handling
  onMessageChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.newMessage.set(target.value);
  }

  onSendMessage(event: Event) {
    event.preventDefault();
    const messageText = this.newMessage().trim();

    if (!messageText || (!this.selectedUser() && !this.selectedGroup()) || !this.socketService.connected) {
      return;
    }

    this.newMessage.set('');

    // Create temporary optimistic message
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      sender: { _id: this.user()?.id || '', username: this.user()?.username || '' },
      receiver: this.selectedUser() ? { _id: this.selectedUser()!.id, username: this.selectedUser()!.username } : undefined,
      group: this.selectedGroup() ? { _id: this.selectedGroup()!._id, name: this.selectedGroup()!.name } : undefined,
      text: messageText,
      messageType: 'text',
      createdAt: new Date().toISOString(),
    };

    // Add to messages
    const currentMessages = this.messages();
    this.onMessagesChange.emit([...currentMessages, tempMessage]);

    // Send via socket
    if (this.selectedUser()) {
      // Direct message
      this.socketService.sendMessage(this.selectedUser()!.id, messageText);
    } else if (this.selectedGroup()) {
      // Group message
      this.socketService.sendGroupMessage(this.selectedGroup()!._id, messageText);
    }
  }

  // Image handling
  onImageSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImage.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onVideoSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert('Video file is too large. Please select a video smaller than 50MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedVideo.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onSendImage() {
    if (!this.selectedImage() || (!this.selectedUser() && !this.selectedGroup()) || !this.socketService.connected || this.isUploading()) {
      return;
    }

    this.isUploading.set(true);

    // Create temporary optimistic message
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      sender: { _id: this.user()?.id || '', username: this.user()?.username || '' },
      receiver: this.selectedUser() ? { _id: this.selectedUser()!.id, username: this.selectedUser()!.username } : undefined,
      group: this.selectedGroup() ? { _id: this.selectedGroup()!._id, name: this.selectedGroup()!.name } : undefined,
      text: '',
      imageUrl: this.selectedImage()!,
      messageType: 'image',
      createdAt: new Date().toISOString(),
    };

    const currentMessages = this.messages();
    this.onMessagesChange.emit([...currentMessages, tempMessage]);

    // Send via socket
    if (this.selectedUser()) {
      this.socketService.sendMessage(this.selectedUser()!.id, '', 'image', this.selectedImage()!);
    } else if (this.selectedGroup()) {
      this.socketService.sendGroupMessage(this.selectedGroup()!._id, '', 'image', this.selectedImage()!);
    }

    this.selectedImage.set(null);
    this.isUploading.set(false);
  }

  onSendVideo() {
    if (!this.selectedVideo() || (!this.selectedUser() && !this.selectedGroup()) || !this.socketService.connected || this.isUploading()) {
      return;
    }

    this.isUploading.set(true);

    // Create temporary optimistic message
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      sender: { _id: this.user()?.id || '', username: this.user()?.username || '' },
      receiver: this.selectedUser() ? { _id: this.selectedUser()!.id, username: this.selectedUser()!.username } : undefined,
      group: this.selectedGroup() ? { _id: this.selectedGroup()!._id, name: this.selectedGroup()!.name } : undefined,
      text: '',
      videoUrl: this.selectedVideo()!,
      messageType: 'video',
      createdAt: new Date().toISOString(),
    };

    const currentMessages = this.messages();
    this.onMessagesChange.emit([...currentMessages, tempMessage]);

    // Send via socket
    if (this.selectedUser()) {
      this.socketService.sendMessage(this.selectedUser()!.id, '', 'video', undefined, this.selectedVideo()!);
    } else if (this.selectedGroup()) {
      this.socketService.sendGroupMessage(this.selectedGroup()!._id, '', 'video', undefined, this.selectedVideo()!);
    }

    this.selectedVideo.set(null);
    this.isUploading.set(false);
  }

  onRemoveSelectedImage() {
    this.selectedImage.set(null);
  }

  onRemoveSelectedVideo() {
    this.selectedVideo.set(null);
  }

  // Image/Video viewer
  onOpenImageViewer(imageUrl: string) {
    this.viewingImage.set(imageUrl);
  }

  onCloseImageViewer() {
    this.viewingImage.set(null);
  }

  onOpenVideoViewer(videoUrl: string) {
    this.viewingVideo.set(videoUrl);
  }

  onCloseVideoViewer() {
    this.viewingVideo.set(null);
  }

  // Group management
  onLeaveGroup() {
    if (this.selectedGroup()) {
      console.log('Leaving group:', this.selectedGroup()?._id);
      // Implementation will be added later
    }
  }

  onAddMembers() {
    this.showAddMembersModal.set(true);
  }

  onCloseAddMembersModal() {
    this.showAddMembersModal.set(false);
  }

  // Helper methods
  getOnlineMemberCount(): number {
    if (!this.selectedGroup()) return 0;
    return this.selectedGroup()!.members.filter(member => 
      this.onlineUsers().some(onlineUser => onlineUser.userId === member.user._id)
    ).length;
  }

  isUserMemberOfGroup(): boolean {
    if (!this.selectedGroup() || !this.user()) return false;
    return this.selectedGroup()!.members.some(member => member.user._id === this.user()?.id);
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers().some((u) => u.userId === userId);
  }

  formatMessageTime(createdAt: string): string {
    return new Date(createdAt).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  }
}
