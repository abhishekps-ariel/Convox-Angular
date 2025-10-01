import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { User, OnlineUser, Conversation, Group, GroupWithUnread } from '../../types/chat-types';
import { ConversationList } from '../conversation-list/conversation-list';
import { GroupList } from '../group-list/group-list';
import { CreateGroupModal } from '../create-group-modal/create-group-modal';

@Component({
  selector: 'app-left-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, ConversationList, GroupList, CreateGroupModal],
  templateUrl: './left-sidebar.html',
  styleUrls: ['./left-sidebar.css']
})
export class LeftSidebar implements OnInit, OnChanges {
  @Input() selectedUser: User | null = null;
  @Input() selectedGroup: Group | null = null;
  @Input() conversations: Conversation[] = [];
  @Input() allUsers: User[] = [];
  @Input() onlineUsers: OnlineUser[] = [];

  @Output() userSelect = new EventEmitter<User>();
  @Output() groupSelect = new EventEmitter<Group>();
  @Output() conversationsChange = new EventEmitter<Conversation[]>();
  @Output() allUsersChange = new EventEmitter<User[]>();
  @Output() groupsChange = new EventEmitter<GroupWithUnread[]>();

  user: User | null = null;
  token: string | null = null;
  searchQuery = '';
  showSearchResults = false;
  blockedUsers = new Set<string>();
  groups: GroupWithUnread[] = [];
  showCreateGroupModal = false;
  activeTab: 'chats' | 'groups' = 'chats';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.user = user;
    });

    this.authService.token$.subscribe(token => {
      this.token = token;
      if (token) {
        this.loadData();
        this.loadGroups();
      }
    });
  }

  ngOnChanges(): void {
    // React to input changes if needed
  }

  async loadData(): Promise<void> {
    if (!this.token) return;

    try {
      const [conversations, users] = await Promise.all([
        this.apiService.fetchConversations(this.token),
        this.apiService.fetchUsers(this.token)
      ]);

      this.conversationsChange.emit(conversations);
      this.allUsersChange.emit(users);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async loadGroups(): Promise<void> {
    if (!this.token) return;

    try {
      const userGroups = await this.apiService.fetchUserGroups(this.token);
      const groupsWithExtras: GroupWithUnread[] = userGroups.map(g => ({
        ...g,
        unreadCount: (g as any).unreadCount ?? 0,
        lastMessage: (g as any).lastMessage ?? null
      }));
      
      this.groups = groupsWithExtras;
      this.groupsChange.emit(groupsWithExtras);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  }

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.showSearchResults = value.length > 0;
  }

  setActiveTab(tab: 'chats' | 'groups'): void {
    this.activeTab = tab;
  }

  get filteredUsers(): User[] {
    if (!this.searchQuery) return [];
    
    const query = this.searchQuery.toLowerCase();
    return this.allUsers.filter(u =>
      u.id !== this.user?.id &&
      (u.username.toLowerCase().includes(query) ||
       u.email.toLowerCase().includes(query))
    );
  }

  get filteredConversations(): Conversation[] {
    if (!this.searchQuery) return this.conversations;
    const query = this.searchQuery.toLowerCase();
    return this.conversations.filter(conv => 
      conv.username.toLowerCase().includes(query) ||
      conv.email.toLowerCase().includes(query)
    );
  }

  get filteredGroups(): GroupWithUnread[] {
    if (!this.searchQuery) return this.groups;
    const query = this.searchQuery.toLowerCase();
    return this.groups.filter(group => 
      group.name.toLowerCase().includes(query)
    );
  }

  // Filter out current user from group creation - EXACT React pattern
  get availableUsersForGroup(): User[] {
    return this.allUsers.filter(u => u.id !== this.user?.id);
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.some(u => u.userId === userId);
  }

  isUserBlockedByMe(userId: string): boolean {
    return this.blockedUsers.has(userId);
  }

  handleUserSelect(user: User): void {
    this.userSelect.emit(user);
    this.showSearchResults = false;
    this.searchQuery = '';
  }

  handleGroupSelect(group: Group): void {
    this.groupSelect.emit(group);
  }

  onCreateGroup(): void {
    this.showCreateGroupModal = true;
  }

  onCloseCreateGroupModal(): void {
    this.showCreateGroupModal = false;
  }

  onGroupCreated(): void {
    this.showCreateGroupModal = false;
    this.loadGroups(); // Refresh groups list
  }

  // Update conversation with new message (called from socket)
  updateConversationWithNewMessage(message: any, shouldIncrementUnread: boolean = true): void {
    const otherUserId = message.sender._id === this.user?.id 
      ? message.receiver._id 
      : message.sender._id;
    
    const existingConvIndex = this.conversations.findIndex(conv => conv._id === otherUserId);

    if (existingConvIndex >= 0) {
      const updatedConversations = [...this.conversations];
      const existingConv = updatedConversations[existingConvIndex];

      const newUnreadCount = shouldIncrementUnread && message.receiver._id === this.user?.id
        ? existingConv.unreadCount + 1
        : existingConv.unreadCount;

      updatedConversations[existingConvIndex] = {
        ...existingConv,
        lastMessage: message,
        unreadCount: newUnreadCount,
      };

      // Move to top
      const [updatedConv] = updatedConversations.splice(existingConvIndex, 1);
      const newConversations = [updatedConv, ...updatedConversations];
      this.conversationsChange.emit(newConversations);
    } else {
      // Create new conversation
      const otherUser = message.sender._id === this.user?.id ? message.receiver : message.sender;
      const newUnreadCount = shouldIncrementUnread && message.receiver._id === this.user?.id ? 1 : 0;

      const newConversation: Conversation = {
        _id: otherUserId,
        username: otherUser.username,
        email: otherUser.email || '',
        lastMessage: message,
        unreadCount: newUnreadCount,
      };

      const newConversations = [newConversation, ...this.conversations];
      this.conversationsChange.emit(newConversations);
    }
  }

  // Update group with new message (called from socket) - EXACT React pattern
  updateGroupWithNewMessage(message: any, shouldIncrementUnread: boolean = true): void {
    const groupId = typeof message.group === 'string' ? message.group : message.group?._id;
    if (!groupId) return;

    const existingGroupIndex = this.groups.findIndex(g => g._id === groupId);

    if (existingGroupIndex >= 0) {
      const updatedGroups = [...this.groups];
      const existingGroup = updatedGroups[existingGroupIndex];

      // Check if this is the currently open group - EXACT React logic
      const isCurrentGroupOpen = this.selectedGroup?._id === groupId;

      // Handle different message update scenarios
      let updatedLastMessage: any = message;
      let newUnreadCount = existingGroup.unreadCount || 0;

      // Check if this is a delete operation
      const isDeleteOperation = message.deletedForSender || message.deletedForReceiver || message.deletedForEveryone;

      if (isDeleteOperation) {
        // Handle delete logic
        if (message.deletedForEveryone) {
          // For "delete for everyone", show the deleted message
          updatedLastMessage = {
            ...message,
            deletedForSender: message.deletedForSender,
            deletedForReceiver: message.deletedForReceiver,
            deletedForEveryone: message.deletedForEveryone,
            deletedAt: message.deletedAt
          };
        } else {
          // For "delete for me", don't update here
          return;
        }
      } else {
        // Handle edit or new message
        // If this is the currently open group, mark as read on server
        if (isCurrentGroupOpen && message.sender._id !== this.user?.id) {
          this.socketService.markGroupMessagesAsRead(groupId);
        }

        // Calculate unread count - EXACT React logic
        if (isCurrentGroupOpen) {
          // If viewing the group, unread count should be 0
          newUnreadCount = 0;
        } else if (message.sender._id === this.user?.id) {
          // If current user sent the message, don't increment
          newUnreadCount = existingGroup.unreadCount || 0;
        } else {
          // If someone else sent and we're not viewing, use shouldIncrementUnread flag
          newUnreadCount = shouldIncrementUnread ? (existingGroup.unreadCount || 0) + 1 : (existingGroup.unreadCount || 0);
        }
      }

      updatedGroups[existingGroupIndex] = {
        ...existingGroup,
        lastMessage: updatedLastMessage,
        unreadCount: newUnreadCount,
      };

      // Move to top
      const [updatedGroup] = updatedGroups.splice(existingGroupIndex, 1);
      this.groups = [updatedGroup, ...updatedGroups];
      this.groupsChange.emit(this.groups);
    }
  }

  // Mark conversation as read
  markConversationAsRead(userId: string): void {
    const updatedConversations = this.conversations.map(conv =>
      conv._id === userId ? { ...conv, unreadCount: 0 } : conv
    );
    this.conversationsChange.emit(updatedConversations);
  }

  // Mark group as read
  markGroupAsRead(groupId: string): void {
    this.groups = this.groups.map(group =>
      group._id === groupId ? { ...group, unreadCount: 0 } : group
    );
    this.groupsChange.emit(this.groups);
  }
}
