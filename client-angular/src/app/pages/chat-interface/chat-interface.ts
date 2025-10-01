import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
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

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [CommonModule, ChatHeader, MessageArea, InputMessage, LeftSidebar, GroupMenu, AddMembersModal],
  templateUrl: './chat-interface.html',
  styleUrls: ['./chat-interface.css']
})
export class ChatInterface implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(LeftSidebar) leftSidebar!: LeftSidebar;

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

  ngAfterViewInit(): void {
    // Set up socket callbacks after view is initialized
    this.socketService.setCallbacks({
      onMessagesRead: (userId: string) => {
        if (this.leftSidebar) {
          this.leftSidebar.markConversationAsRead(userId);
        }
      },
      updateConversation: (message: any, shouldIncrementUnread?: boolean) => {
        if (this.leftSidebar && message.receiver) {
          this.leftSidebar.updateConversationWithNewMessage(message, shouldIncrementUnread);
        }
      },
      onGroupMessageReceived: (message: any, shouldIncrementUnread?: boolean) => {
        if (this.leftSidebar && message.group) {
          this.leftSidebar.updateGroupWithNewMessage(message, shouldIncrementUnread);
        }
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
    
    // Mark as read
    if (this.leftSidebar) {
      this.leftSidebar.markConversationAsRead(user.id);
    }
    
    // Force scroll to bottom when opening conversation
    this.forceScrollToBottom = true;
    setTimeout(() => {
      this.forceScrollToBottom = false;
    }, 200);
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
    
    // Mark group as read
    if (this.leftSidebar) {
      this.leftSidebar.markGroupAsRead(group._id);
    }
    
    // Force scroll to bottom when opening group
    this.forceScrollToBottom = true;
    setTimeout(() => {
      this.forceScrollToBottom = false;
    }, 200);
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

  showAddMembersModal = false;

  onAddMembers(groupId: string): void {
    this.showAddMembersModal = true;
  }

  onAddMembersModalClose(): void {
    this.showAddMembersModal = false;
  }

  onMembersAdded(): void {
    this.showAddMembersModal = false;
    // Refresh the group data
    if (this.selectedGroup && this.leftSidebar) {
      this.leftSidebar.loadGroups();
    }
    // Reload messages to see new members in group
    if (this.selectedGroup) {
      this.loadGroupMessages();
    }
  }

  onEditMessage(event: { messageId: string; newText: string }): void {
    if (!event.newText.trim()) return;

    // Find the edited message to check if it's the last message
    const editedMessage = this.messages.find(msg => msg._id === event.messageId);
    
    // Optimistically update local message
    this.messages = this.messages.map(msg => 
      msg._id === event.messageId 
        ? { ...msg, text: event.newText, isEdited: true, editedAt: new Date().toISOString() }
        : msg
    );

    // Update conversation/group list if this is the last message
    if (editedMessage && this.leftSidebar) {
      if (this.selectedUser && editedMessage.receiver) {
        // Update conversation list for direct messages
        const updatedConversations = this.conversations.map(conv => {
          if (conv.lastMessage && conv.lastMessage._id === event.messageId) {
            return {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                text: event.newText,
                isEdited: true,
                editedAt: new Date().toISOString()
              }
            };
          }
          return conv;
        });
        this.onConversationsChange(updatedConversations);
      } else if (this.selectedGroup && editedMessage.group) {
        // Update group list for group messages
        const updatedMessage = {
          ...editedMessage,
          text: event.newText,
          isEdited: true,
          editedAt: new Date().toISOString()
        };
        this.leftSidebar.updateGroupWithNewMessage(updatedMessage, false);
      }
    }

    // Emit socket event for real-time editing
    (this.socketService as any).socket?.emit('editMessage', {
      messageId: event.messageId,
      text: event.newText.trim()
    });
  }

  onDeleteForMe(messageId: string): void {
    const deletedMessage = this.messages.find(msg => msg._id === messageId);
    
    // Update local message state
    const updatedMessages = this.messages.map(msg => {
      if (msg._id === messageId) {
        if (msg.sender._id === this.user?.id) {
          return { ...msg, deletedForSender: true, deletedAt: new Date().toISOString() };
        } else {
          if (msg.group) {
            const deletedForUsers = msg.deletedForUsers || [];
            if (!deletedForUsers.includes(this.user?.id || '')) {
              return { 
                ...msg, 
                deletedForUsers: [...deletedForUsers, this.user?.id || ''],
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
    this.messages = updatedMessages;

    // Update conversation/group list if this is the last message
    if (deletedMessage && this.leftSidebar) {
      if (this.selectedUser && deletedMessage.receiver) {
        // For direct messages - find previous non-deleted message
        const updatedConversations = this.conversations.map(conv => {
          if (conv.lastMessage && conv.lastMessage._id === messageId) {
            // Find previous non-deleted message
            const previousMessages = updatedMessages.filter(msg => 
              msg._id !== messageId && 
              !this.isMessageDeletedForUser(msg, this.user?.id || '') &&
              ((msg.sender._id === deletedMessage.sender._id && msg.receiver?._id === deletedMessage.receiver?._id) ||
               (msg.sender._id === deletedMessage.receiver?._id && msg.receiver?._id === deletedMessage.sender._id))
            );
            
            previousMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const newLastMessage = previousMessages.length > 0 ? previousMessages[0] : null;
            
            return {
              ...conv,
              lastMessage: newLastMessage
            };
          }
          return conv;
        });
        this.onConversationsChange(updatedConversations);
      } else if (this.selectedGroup && deletedMessage.group) {
        // For group messages - find previous non-deleted message
        const groupId = typeof deletedMessage.group === 'string' ? deletedMessage.group : deletedMessage.group._id;
        const groupMessages = updatedMessages
          .filter(msg => {
            const msgGroupId = typeof msg.group === 'string' ? msg.group : msg.group?._id;
            return msgGroupId === groupId;
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        const previousMessage = groupMessages.find(msg => 
          msg._id !== messageId && 
          !this.isMessageDeletedForUser(msg, this.user?.id || '')
        );
        
        if (previousMessage) {
          this.leftSidebar.updateGroupWithNewMessage(previousMessage, false);
        }
      }
    }

    // Emit socket event
    (this.socketService as any).socket?.emit('deleteMessageForMe', { messageId });
  }

  onDeleteForEveryone(messageId: string): void {
    const deletedMessage = this.messages.find(msg => msg._id === messageId);
    
    // Update local message state
    this.messages = this.messages.map(msg =>
      msg._id === messageId
        ? { ...msg, deletedForEveryone: true, deletedAt: new Date().toISOString() }
        : msg
    );

    // Update conversation/group list if this is the last message
    if (deletedMessage && this.leftSidebar) {
      if (this.selectedUser && deletedMessage.receiver) {
        // For direct messages - update to show deleted message
        const updatedConversations = this.conversations.map(conv => {
          if (conv.lastMessage && conv.lastMessage._id === messageId) {
            return {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                deletedForEveryone: true,
                deletedAt: new Date().toISOString()
              }
            };
          }
          return conv;
        });
        this.onConversationsChange(updatedConversations);
      } else if (this.selectedGroup && deletedMessage.group) {
        // For group messages - update to show deleted message
        const updatedMessage = {
          ...deletedMessage,
          deletedForEveryone: true,
          deletedAt: new Date().toISOString()
        };
        this.leftSidebar.updateGroupWithNewMessage(updatedMessage, false);
      }
    }

    // Emit socket event
    (this.socketService as any).socket?.emit('deleteMessageForEveryone', { messageId });
  }

  // Helper function to check if message is deleted for user
  private isMessageDeletedForUser(message: Message, userId: string): boolean {
    if (!userId) return false;
    
    if (message.group) {
      if (message.sender._id === userId) {
        return message.deletedForSender || false;
      } else {
        return message.deletedForUsers && message.deletedForUsers.includes(userId) || false;
      }
    }
    
    if (message.sender._id === userId) {
      return message.deletedForSender || false;
    } else {
      return message.deletedForReceiver || false;
    }
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
    this.forceScrollToBottom = true;
    setTimeout(() => {
      this.forceScrollToBottom = false;
    }, 200);

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
