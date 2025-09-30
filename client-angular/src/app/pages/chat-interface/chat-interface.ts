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
import { GroupMenu } from '../../components/group-menu/group-menu';
import { AddMembersModal } from '../../components/add-members-modal/add-members-modal';
import { ProfileInfo } from '../../components/profile-info/profile-info';

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [CommonModule, ChatHeader, MessageArea, InputMessage, LeftSidebar, GroupMenu, AddMembersModal, ProfileInfo],
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
  forceScrollToBottom = false;

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
      
      // Mark messages as read via socket
      if (this.socketService) {
        setTimeout(() => {
          if (this.selectedUser) {
            // Emit mark as read event
            (this.socketService as any).socket?.emit("markMessagesAsRead", { 
              senderId: this.selectedUser.id 
            });
          }
        }, 500);
      }
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
    
    // Force scroll to bottom when opening conversation
    setTimeout(() => {
      this.forceScrollToBottom = true;
    }, 100);
  }

  onGroupSelect(group: Group): void {
    // If clicking same group, deselect
    if (this.selectedGroup?._id === group._id) {
      this.selectedGroup = null;
      this.selectedUser = null;
      this.messages = [];
      this.socketService.setSelectedGroup(null);
      return;
    }

    this.selectedGroup = group;
    this.selectedUser = null;
    this.messages = [];
    this.socketService.setSelectedGroup(group);
    this.loadGroupMessages();
    
    // Force scroll to bottom when opening group
    setTimeout(() => {
      this.forceScrollToBottom = true;
    }, 100);
  }

  async loadGroupMessages(): Promise<void> {
    if (!this.token || !this.selectedGroup) return;

    try {
      const fetchedMessages = await this.apiService.fetchGroupMessages(this.token, this.selectedGroup._id, 1, 50);
      this.messages = fetchedMessages;
      
      // Join group chat and mark as read
      this.socketService.joinGroupChat(this.selectedGroup._id);
      this.socketService.markGroupMessagesAsRead(this.selectedGroup._id);
    } catch (error) {
      console.error('Error loading group messages:', error);
    }
  }

  onConversationsChange(conversations: Conversation[]): void {
    this.conversations = conversations;
  }

  onAllUsersChange(users: User[]): void {
    this.allUsers = users;
  }

  onGroupsChange(groups: GroupWithUnread[]): void {
    this.groups = groups;
  }

  onLeaveGroup(groupId: string): void {
    // Implementation for leaving group
    console.log('Leave group:', groupId);
  }

  onAddMembers(groupId: string): void {
    // Implementation for adding members
    console.log('Add members to group:', groupId);
  }

  onEditMessage(event: { messageId: string; newText: string }): void {
    // Implementation for editing message
    console.log('Edit message:', event);
    // TODO: Implement message editing via socket
  }

  onDeleteForMe(messageId: string): void {
    // Implementation for deleting message for me
    console.log('Delete for me:', messageId);
    // TODO: Implement delete for me via socket
  }

  onDeleteForEveryone(messageId: string): void {
    // Implementation for deleting message for everyone
    console.log('Delete for everyone:', messageId);
    // TODO: Implement delete for everyone via socket
  }

  onBlockUser(): void {
    // Implementation for blocking user
    console.log('Block user');
    // TODO: Implement user blocking
  }

  onMessageChange(message: string): void {
    this.newMessage = message;
  }

  async onSendMessage(): Promise<void> {
    if (!this.newMessage.trim() || (!this.selectedUser && !this.selectedGroup)) return;

    const messageText = this.newMessage.trim();
    this.newMessage = '';

    // Optimistic message
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      sender: { _id: this.user?.id || '', username: this.user?.username || '' },
      receiver: this.selectedUser ? { _id: this.selectedUser.id, username: this.selectedUser.username } : undefined,
      group: this.selectedGroup ? { _id: this.selectedGroup._id, name: this.selectedGroup.name } : undefined,
      text: messageText,
      messageType: 'text',
      createdAt: new Date().toISOString(),
    };

    this.messages = [...this.messages, tempMessage];

    // Force scroll to bottom after sending message
    setTimeout(() => {
      this.forceScrollToBottom = true;
    }, 50);

    // Send via socket
    if (this.selectedUser) {
    this.socketService.sendMessage(this.selectedUser.id, messageText, 'text');
    } else if (this.selectedGroup) {
      this.socketService.sendGroupMessage(this.selectedGroup._id, messageText, 'text');
    }
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
    if (!this.selectedImage || (!this.selectedUser && !this.selectedGroup)) return;

    this.isUploading = true;

    // Optimistic message
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      sender: { _id: this.user?.id || '', username: this.user?.username || '' },
      receiver: this.selectedUser ? { _id: this.selectedUser.id, username: this.selectedUser.username } : undefined,
      group: this.selectedGroup ? { _id: this.selectedGroup._id, name: this.selectedGroup.name } : undefined,
      text: '',
      imageUrl: this.selectedImage,
      messageType: 'image',
      createdAt: new Date().toISOString(),
    };

    this.messages = [...this.messages, tempMessage];

    // Send via socket
    if (this.selectedUser) {
      (this.socketService as any).socket?.emit("sendMessage", {
        receiverId: this.selectedUser.id,
        imageData: this.selectedImage,
        messageType: 'image'
      });
    } else if (this.selectedGroup) {
      this.socketService.sendGroupMessage(this.selectedGroup._id, '', 'image', this.selectedImage);
    }

    this.selectedImage = null;
    this.isUploading = false;
  }

  async onSendVideo(): Promise<void> {
    if (!this.selectedVideo || (!this.selectedUser && !this.selectedGroup)) return;

    this.isUploading = true;

    // Optimistic message
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      sender: { _id: this.user?.id || '', username: this.user?.username || '' },
      receiver: this.selectedUser ? { _id: this.selectedUser.id, username: this.selectedUser.username } : undefined,
      group: this.selectedGroup ? { _id: this.selectedGroup._id, name: this.selectedGroup.name } : undefined,
      text: '',
      videoUrl: this.selectedVideo,
      messageType: 'video',
      createdAt: new Date().toISOString(),
    };

    this.messages = [...this.messages, tempMessage];

    // Send via socket
    if (this.selectedUser) {
      (this.socketService as any).socket?.emit("sendMessage", {
        receiverId: this.selectedUser.id,
        videoData: this.selectedVideo,
        messageType: 'video'
      });
    } else if (this.selectedGroup) {
      this.socketService.sendGroupMessage(this.selectedGroup._id, '', 'video', undefined, this.selectedVideo);
    }

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
