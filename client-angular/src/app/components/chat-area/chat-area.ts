import { Component, signal, input, output, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { User, Message, OnlineUser, Conversation, Group } from '../../types/chat-types';

@Component({
  selector: 'app-chat-area',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-area.html'
})
export class ChatArea {
  // Inputs from parent component using signals
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

  // Helper function to check if a message is deleted for a specific user
  private isMessageDeletedForUser(message: Message, userId?: string): boolean {
    if (!userId) return false;
    
    // For group messages, check if the current user deleted it for themselves
    if (message.group) {
      // If the current user is the sender, check deletedForSender
      if (message.sender._id === userId) {
        return message.deletedForSender || false;
      } else {
        // If the current user is not the sender, check if they're in deletedForUsers array
        return !!(message.deletedForUsers && message.deletedForUsers.includes(userId));
      }
    }
    
    // For direct messages, use the original logic
    if (message.sender._id === userId) {
      return message.deletedForSender || false;
    } else {
      return message.deletedForReceiver || false;
    }
  }

  // Filter messages based on delete status for the current user
  private filterMessagesForUser(messages: Message[], userId?: string): Message[] {
    if (!userId) return messages;
    
    return messages.filter(message => {
      // Always show messages that are deleted for everyone (they show "This message was deleted")
      if (message.deletedForEveryone) {
        return true;
      }
      
      // For group messages, check if the user deleted it for themselves
      if (message.group) {
        return !this.isMessageDeletedForUser(message, userId);
      }
      
      // For direct messages, use the original logic
      if (message.sender._id === userId && message.deletedForSender) {
        return false;
      }
      
      if (message.receiver && message.receiver._id === userId && message.deletedForReceiver) {
        return false;
      }
      
      return true;
    });
  }

  // Get visible messages (filtered)
  get visibleMessages(): Message[] {
    return this.filterMessagesForUser(this.messages(), this.user()?.id);
  }

  // Message editing handler
  onMessageEdit(messageId: string, newText: string) {
    // Update the message in the local state
    const updatedMessages = this.messages().map(msg => 
      msg._id === messageId 
        ? { ...msg, text: newText, isEdited: true, editedAt: new Date().toISOString() }
        : msg
    );
    this.onMessagesChange.emit(updatedMessages);
    
    // Update the conversation list with the edited message
    const updatedConversations = this.conversations().map((conv: Conversation) => {
      if (conv.lastMessage && conv.lastMessage._id === messageId) {
        return {
          ...conv,
          lastMessage: {
            ...conv.lastMessage,
            text: newText,
            isEdited: true,
            editedAt: new Date().toISOString()
          }
        };
      }
      return conv;
    });
    this.onConversationsChange.emit(updatedConversations);
  }

  // Message deletion handler
  onMessageDelete(messageId: string) {
    // Update the message in the local state to show as deleted
    const updatedMessages = this.messages().map(msg => {
      if (msg._id === messageId) {
        if (msg.sender._id === this.user()?.id) {
          return { ...msg, deletedForSender: true, deletedAt: new Date().toISOString() };
        } else {
          if (msg.group) {
            const deletedForUsers = msg.deletedForUsers || [];
            if (!deletedForUsers.includes(this.user()?.id || '')) {
              return { 
                ...msg, 
                deletedForUsers: [...deletedForUsers, this.user()?.id || ''],
                deletedAt: new Date().toISOString() 
              };
            }
          } else {
            return { ...msg, deletedForReceiver: true, deletedAt: new Date().toISOString() };
          }
        }
      }
      return msg;
    });

    this.onMessagesChange.emit(updatedMessages);

    // Update the conversation list if this is the last message
    const updatedConversations = this.conversations().map((conv: Conversation) => {
      if (conv.lastMessage && conv.lastMessage._id === messageId) {
        // For "delete for me", find the previous non-deleted message using updated messages
        const previousMessages = updatedMessages.filter(msg => 
          msg._id !== messageId && 
          !this.isMessageDeletedForUser(msg, this.user()?.id)
        );
        
        const newLastMessage = previousMessages.length > 0 
          ? previousMessages[previousMessages.length - 1]
          : null;
        
        return {
          ...conv,
          lastMessage: newLastMessage
        };
      }
      return conv;
    });
    this.onConversationsChange.emit(updatedConversations);
  }

  // Update conversation with new message (for real-time updates)
  updateConversationWithNewMessage(message: Message, shouldIncrementUnread: boolean = true) {
    // Only handle direct messages (not group messages)
    if (!message.receiver || message.group) return;
    
    const otherUserId = message.sender._id === this.user()?.id
      ? message.receiver._id
      : message.sender._id;
    
    const existingConvIndex = this.conversations().findIndex(
      (conv) => conv._id === otherUserId
    );

    if (existingConvIndex >= 0) {
      // Update existing conversation
      const updatedConversations = [...this.conversations()];
      const existingConv = updatedConversations[existingConvIndex];

      const newUnreadCount = shouldIncrementUnread && message.receiver._id === this.user()?.id
        ? existingConv.unreadCount + 1
        : existingConv.unreadCount;

      updatedConversations[existingConvIndex] = {
        ...existingConv,
        lastMessage: message,
        unreadCount: newUnreadCount,
      };

      // Move to top
      const [updatedConv] = updatedConversations.splice(existingConvIndex, 1);
      this.onConversationsChange.emit([updatedConv, ...updatedConversations]);
    } else {
      // Create new conversation if it doesn't exist
      const otherUser = message.sender._id === this.user()?.id ? message.receiver : message.sender;
      const newUnreadCount = shouldIncrementUnread && message.receiver._id === this.user()?.id ? 1 : 0;

      const newConversation: Conversation = {
        _id: otherUserId,
        username: otherUser.username,
        email: (otherUser as any).email || "",
        lastMessage: message,
        unreadCount: newUnreadCount,
      };

      this.onConversationsChange.emit([newConversation, ...this.conversations()]);
    }
  }

  constructor(
    private authService: AuthService,
    private socketService: SocketService
  ) {
    this.authService.user$.subscribe(user => {
      this.user.set(user);
    });

    // Log when inputs change for debugging
    effect(() => {
      console.log('ChatArea: selectedUser changed:', this.selectedUser());
      console.log('ChatArea: selectedGroup changed:', this.selectedGroup());
      console.log('ChatArea: messages changed:', this.messages().length);
      if (this.selectedUser()) {
        console.log('ChatArea: User selected:', this.selectedUser()?.username);
      }
      if (this.selectedGroup()) {
        console.log('ChatArea: Group selected:', this.selectedGroup()?.name);
      }
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
    const currentSelectedUser = this.selectedUser();
    const currentSelectedGroup = this.selectedGroup();

    // Validate inputs and socket connection
    if (!messageText || (!currentSelectedUser && !currentSelectedGroup) || !this.socketService.connected) {
      console.log('ChatArea: Cannot send message - invalid conditions:', {
        hasMessage: !!messageText,
        hasSelectedUser: !!currentSelectedUser,
        hasSelectedGroup: !!currentSelectedGroup,
        socketConnected: this.socketService.connected
      });
      return;
    }

    this.newMessage.set('');

    // Create temporary optimistic message
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      sender: { _id: this.user()?.id || '', username: this.user()?.username || '' },
      receiver: currentSelectedUser ? { _id: currentSelectedUser.id, username: currentSelectedUser.username } : undefined,
      group: currentSelectedGroup ? { _id: currentSelectedGroup._id, name: currentSelectedGroup.name } : undefined,
      text: messageText,
      messageType: 'text',
      createdAt: new Date().toISOString(),
    };

    // Add to messages
    const currentMessages = this.messages();
    this.onMessagesChange.emit([...currentMessages, tempMessage]);

    // Send via socket
    if (currentSelectedUser) {
      // Direct message
      this.socketService.sendMessage(currentSelectedUser.id, messageText);
    } else if (currentSelectedGroup) {
      // Group message
      this.socketService.sendGroupMessage(currentSelectedGroup._id, messageText);
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
    const currentSelectedUser = this.selectedUser();
    const currentSelectedGroup = this.selectedGroup();
    
    // Validate inputs and socket connection
    if (!this.selectedImage() || (!currentSelectedUser && !currentSelectedGroup) || !this.socketService.connected || this.isUploading()) {
      console.log('ChatArea: Cannot send image - invalid conditions:', {
        hasImage: !!this.selectedImage(),
        hasSelectedUser: !!currentSelectedUser,
        hasSelectedGroup: !!currentSelectedGroup,
        socketConnected: this.socketService.connected,
        isUploading: this.isUploading()
      });
      return;
    }

    this.isUploading.set(true);

    // Create temporary optimistic message
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      sender: { _id: this.user()?.id || '', username: this.user()?.username || '' },
      receiver: currentSelectedUser ? { _id: currentSelectedUser.id, username: currentSelectedUser.username } : undefined,
      group: currentSelectedGroup ? { _id: currentSelectedGroup._id, name: currentSelectedGroup.name } : undefined,
      text: '',
      imageUrl: this.selectedImage()!,
      messageType: 'image',
      createdAt: new Date().toISOString(),
    };

    const currentMessages = this.messages();
    this.onMessagesChange.emit([...currentMessages, tempMessage]);

    // Send via socket
    if (currentSelectedUser) {
      this.socketService.sendMessage(currentSelectedUser.id, '', 'image', this.selectedImage()!);
    } else if (currentSelectedGroup) {
      this.socketService.sendGroupMessage(currentSelectedGroup._id, '', 'image', this.selectedImage()!);
    }

    this.selectedImage.set(null);
    this.isUploading.set(false);
  }

  onSendVideo() {
    const currentSelectedUser = this.selectedUser();
    const currentSelectedGroup = this.selectedGroup();
    
    // Validate inputs and socket connection
    if (!this.selectedVideo() || (!currentSelectedUser && !currentSelectedGroup) || !this.socketService.connected || this.isUploading()) {
      console.log('ChatArea: Cannot send video - invalid conditions:', {
        hasVideo: !!this.selectedVideo(),
        hasSelectedUser: !!currentSelectedUser,
        hasSelectedGroup: !!currentSelectedGroup,
        socketConnected: this.socketService.connected,
        isUploading: this.isUploading()
      });
      return;
    }

    this.isUploading.set(true);

    // Create temporary optimistic message
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      sender: { _id: this.user()?.id || '', username: this.user()?.username || '' },
      receiver: currentSelectedUser ? { _id: currentSelectedUser.id, username: currentSelectedUser.username } : undefined,
      group: currentSelectedGroup ? { _id: currentSelectedGroup._id, name: currentSelectedGroup.name } : undefined,
      text: '',
      videoUrl: this.selectedVideo()!,
      messageType: 'video',
      createdAt: new Date().toISOString(),
    };

    const currentMessages = this.messages();
    this.onMessagesChange.emit([...currentMessages, tempMessage]);

    // Send via socket
    if (currentSelectedUser) {
      this.socketService.sendMessage(currentSelectedUser.id, '', 'video', undefined, this.selectedVideo()!);
    } else if (currentSelectedGroup) {
      this.socketService.sendGroupMessage(currentSelectedGroup._id, '', 'video', undefined, this.selectedVideo()!);
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
    const currentSelectedGroup = this.selectedGroup();
    if (currentSelectedGroup) {
      console.log('Leaving group:', currentSelectedGroup._id);
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
    const currentSelectedGroup = this.selectedGroup();
    if (!currentSelectedGroup) return 0;
    return currentSelectedGroup.members.filter(member => 
      this.onlineUsers().some(onlineUser => onlineUser.userId === member.user._id)
    ).length;
  }

  isUserMemberOfGroup(): boolean {
    const currentSelectedGroup = this.selectedGroup();
    if (!currentSelectedGroup || !this.user()) return false;
    return currentSelectedGroup.members.some(member => member.user._id === this.user()?.id);
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


