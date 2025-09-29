import { Component, signal, effect, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { User, Message, OnlineUser, Conversation, Group } from '../../types/chat-types';
import { LeftSidebar } from '../left-sidebar/left-sidebar';
import { ChatArea } from '../chat-area/chat-area';

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [CommonModule, LeftSidebar, ChatArea],
  templateUrl: './chat-interface.html',
  styleUrl: './chat-interface.css'
})
export class ChatInterface implements OnInit, OnDestroy {
  // State management using signals
  conversations = signal<Conversation[]>([]);
  allUsers = signal<User[]>([]);
  selectedUser = signal<User | null>(null);
  selectedGroup = signal<Group | null>(null);
  messages = signal<Message[]>([]);
  onlineUsers = signal<OnlineUser[]>([]);
  socket = signal<any>(null);
  groups = signal<Group[]>([]);

  // Current user from auth service
  user = signal<User | null>(null);
  loading = signal<boolean>(true);

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef
  ) {
    // Subscribe to auth service changes
    this.authService.user$.subscribe(user => {
      console.log('ChatInterface: Auth service user changed:', user);
      this.user.set(user);

      // Reset all state when user changes (logout/login)
      if (!user) {
        console.log('ChatInterface: User logged out, resetting state');
        this.conversations.set([]);
        this.allUsers.set([]);
        this.selectedUser.set(null);
        this.selectedGroup.set(null);
        this.messages.set([]);
        this.onlineUsers.set([]);
        this.groups.set([]);
        this.socketService.disconnect();
      } else {
        console.log('ChatInterface: User logged in, initializing data');
        // Initialize data when user logs in
        this.initializeData();
      }
    });
  }

  ngOnInit() {
    // Initialize socket service callbacks
    this.socketService.setCallbacks({
      onMessagesRead: (receiverId: string) => {
        // Handle messages read
        console.log('Messages read for:', receiverId);
      },
      updateConversation: (message: Message, shouldIncrementUnread?: boolean) => {
        // Update conversation list
        this.updateConversationWithMessage(message, shouldIncrementUnread);
      },
      onMessageEdited: (message: Message) => {
        // Handle message edited
        this.updateMessageInList(message);
      },
      onMessageDeleted: (message: Message) => {
        // Handle message deleted
        this.updateMessageInList(message);
      },
      onGroupMessageReceived: (message: Message, shouldIncrementUnread?: boolean) => {
        // Handle group message received
        this.updateGroupWithMessage(message, shouldIncrementUnread);
      },
      onGroupMessageEdited: (message: Message) => {
        // Handle group message edited
        this.updateGroupMessageInList(message);
      },
      onGroupMessageDeleted: (message: Message) => {
        // Handle group message deleted
        this.updateGroupMessageInList(message);
      },
      onGroupCreated: (group: Group) => {
        // Handle group created
        this.addGroupToList(group);
      }
    });
  }

  ngOnDestroy() {
    this.socketService.disconnect();
  }

  private async initializeData() {
    if (!this.user()) return;

    this.loading.set(true);
    const token = this.authService.getCurrentToken();
    if (!token) return;

    try {
      // Load initial data
      const [conversations, users, groups] = await Promise.all([
        this.apiService.fetchConversations(token, () => this.authService.logout()),
        this.apiService.fetchUsers(token, () => this.authService.logout()),
        this.apiService.fetchUserGroups(token, () => this.authService.logout())
      ]);

      this.conversations.set(conversations);
      this.allUsers.set(users);
      this.groups.set(groups);

      // Connect socket
      this.socketService.connect(token, this.user()!, () => this.authService.logout());
      this.socket.set(this.socketService);

    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  // Event handlers
  async onUserSelect(user: User | null) {
    console.log('ChatInterface: onUserSelect called with:', user);
    
    try {
      // Validate user object if not null
      if (user && (!user.id || !user.username)) {
        console.error('ChatInterface: Invalid user object received:', user);
        return;
      }
      
      this.selectedUser.set(user);
      this.selectedGroup.set(null); // Close any selected group
      
      console.log('ChatInterface: selectedUser signal set to:', this.selectedUser());
      
      // Force change detection
      this.cdr.detectChanges();
      
      if (user) {
        console.log('ChatInterface: About to call loadMessages for user:', user.id);
        await this.loadMessages();
        // Check if selectedUser is still set after loadMessages
        console.log('ChatInterface: selectedUser after loadMessages:', this.selectedUser());
        console.log('ChatInterface: selectedUser should still be:', user);
        
        // If selectedUser was reset during loadMessages, restore it
        if (!this.selectedUser() && user) {
          console.log('ChatInterface: selectedUser was reset during loadMessages, restoring it');
          this.selectedUser.set(user);
        }
      } else {
        this.messages.set([]);
      }
    } catch (error) {
      console.error('ChatInterface: Error in onUserSelect:', error);
      // Reset to safe state
      this.selectedUser.set(null);
      this.selectedGroup.set(null);
      this.messages.set([]);
    }
  }

  async onGroupSelect(group: Group | null) {
    this.selectedGroup.set(group);
    this.selectedUser.set(null); // Close any selected user
    
    if (group) {
      await this.loadMessages();
    } else {
      this.messages.set([]);
    }
  }

  onConversationsChange(conversations: Conversation[]) {
    this.conversations.set(conversations);
  }

  onAllUsersChange(users: User[]) {
    this.allUsers.set(users);
  }

  onSocketChange(socket: any) {
    this.socket.set(socket);
  }

  onMessagesChange(messages: Message[]) {
    this.messages.set(messages);
  }

  onOnlineUsersChange(onlineUsers: OnlineUser[]) {
    this.onlineUsers.set(onlineUsers);
  }

  onGroupsChange(groups: any[]) {
    // Groups will be managed by LeftSidebar component
    // This is a placeholder for future implementation
  }

  onGroupMessageReceived(event: { message: Message; shouldIncrementUnread: boolean }) {
    // Handle group message received
    console.log('Group message received:', event);
  }

  onGroupCreated(group: Group) {
    // Handle group created
    console.log('Group created:', group);
  }

  // Helper methods for message and group management
  private updateConversationWithMessage(message: Message, shouldIncrementUnread?: boolean) {
    const conversations = this.conversations();
    const updatedConversations = conversations.map(conv => {
      if (message.receiver && conv.username === message.sender.username) {
        return {
          ...conv,
          lastMessage: message,
          unreadCount: shouldIncrementUnread ? conv.unreadCount + 1 : conv.unreadCount
        };
      }
      return conv;
    });
    this.conversations.set(updatedConversations);
  }

  private updateMessageInList(message: Message) {
    const messages = this.messages();
    const updatedMessages = messages.map(msg => {
      if (msg._id === message._id) {
        return message;
      }
      return msg;
    });
    this.messages.set(updatedMessages);
  }

  private updateGroupWithMessage(message: Message, shouldIncrementUnread?: boolean) {
    const groups = this.groups();
    const updatedGroups = groups.map(group => {
      if (message.group && group._id === message.group._id) {
        return {
          ...group,
          latestMessage: {
            messageId: message._id,
            text: message.text,
            messageType: message.messageType,
            sender: message.sender._id,
            senderUsername: message.sender.username,
            createdAt: message.createdAt
          }
        };
      }
      return group;
    });
    this.groups.set(updatedGroups);
  }

  private updateGroupMessageInList(message: Message) {
    // Update group message in the list
    this.updateGroupWithMessage(message, false);
  }

  private addGroupToList(group: Group) {
    const groups = this.groups();
    this.groups.set([...groups, group]);
  }

  // Load messages when user/group is selected
  async loadMessages() {
    const selectedUser = this.selectedUser();
    const selectedGroup = this.selectedGroup();
    const token = this.authService.getCurrentToken();
    
    console.log('ChatInterface: loadMessages called', { selectedUser, selectedGroup, hasToken: !!token });
    
    if (!token) {
      console.log('ChatInterface: No token available');
      return;
    }

    // Validate that we have either a user or group selected
    if (!selectedUser && !selectedGroup) {
      console.log('ChatInterface: No user or group selected');
      this.messages.set([]);
      return;
    }

    console.log('ChatInterface: About to fetch messages, selectedUser is:', selectedUser);

    try {
      let messages: Message[] = [];
      
      if (selectedUser) {
        // Validate user object
        if (!selectedUser.id) {
          console.error('ChatInterface: Selected user has no id:', selectedUser);
          return;
        }
        
        console.log('ChatInterface: Fetching direct messages for user:', selectedUser.id);
        // Load direct messages
        messages = await this.apiService.fetchMessages(token, selectedUser.id, () => this.authService.logout());
      } else if (selectedGroup) {
        // Validate group object
        if (!selectedGroup._id) {
          console.error('ChatInterface: Selected group has no _id:', selectedGroup);
          return;
        }
        
        console.log('ChatInterface: Fetching group messages for group:', selectedGroup._id);
        // Load group messages
        messages = await this.apiService.fetchGroupMessages(token, selectedGroup._id);
      }
      
      console.log('ChatInterface: Loaded messages:', messages.length);
      this.messages.set(messages);
      
      // Mark messages as read
      if (selectedUser) {
        this.socketService.markMessagesAsRead(selectedUser.id);
      } else if (selectedGroup) {
        this.socketService.markGroupMessagesAsRead(selectedGroup._id);
      }
      
      console.log('ChatInterface: loadMessages completed, selectedUser is now:', this.selectedUser());
      
    } catch (error) {
      console.error('Error loading messages:', error);
      // Set empty messages array on error
      this.messages.set([]);
    }
  }
}
