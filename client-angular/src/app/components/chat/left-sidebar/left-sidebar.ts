import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../../../services/authService';
import { ApiService } from '../../../services/apiService';
import { SocketService } from '../../../services/socketService';
import { ConversationList } from '../conversation-list/conversation-list';
import { GroupList } from '../group-list/group-list';
import { CreateGroupModal } from '../create-group-modal/create-group-modal';
import type { User, OnlineUser, Conversation, Group, Message, GroupWithUnread } from '../../../types/chatTypes';

@Component({
  selector: 'app-left-sidebar',
  imports: [CommonModule, FormsModule, ConversationList, GroupList, CreateGroupModal],
  templateUrl: './left-sidebar.html'
})
export class LeftSidebar implements OnInit, OnDestroy {
  @Input() selectedUser: User | null = null;
  @Input() selectedGroup: Group | null = null;
  @Input() conversations: Conversation[] = [];
  @Input() allUsers: User[] = [];
  @Input() onlineUsers: OnlineUser[] = [];
  @Input() messages: Message[] = [];
  @Output() userSelect = new EventEmitter<User | null>();
  @Output() groupSelect = new EventEmitter<Group | null>();
  @Output() conversationsChange = new EventEmitter<Conversation[]>();
  @Output() allUsersChange = new EventEmitter<User[]>();
  @Output() groupsChange = new EventEmitter<GroupWithUnread[]>();

  // Local state
  searchQuery = '';
  showSearchResults = false;
  blockedUsers = new Set<string>();
  blockedByUsers = new Set<string>();
  groups: GroupWithUnread[] = [];
  showCreateGroupModal = false;
  activeTab: 'chats' | 'groups' = 'chats';

  // Filtered data (memoized)
  filteredConversations: Conversation[] = [];
  filteredGroups: GroupWithUnread[] = [];
  filteredUsers: User[] = [];

  // Subscriptions
  private subscriptions: Subscription[] = [];
  private user$: Observable<User | null>;
  private token$: Observable<string | null>;

  constructor(
    public auth: AuthService,
    private api: ApiService,
    private socket: SocketService
  ) {
    this.user$ = this.auth.user$;
    this.token$ = this.auth.token$;
  }

  ngOnInit() {
    this.setupSubscriptions();
    this.loadInitialData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupSubscriptions() {
    // Listen to token changes to load data
    this.subscriptions.push(
      this.token$.subscribe(token => {
        console.log('Token subscription received:', token ? 'present' : 'missing');
        if (token) {
          console.log('Loading data with token...');
          this.loadConversations();
          this.loadUsers();
          this.loadGroups();
        }
      })
    );

    // Listen to socket updates
    this.subscriptions.push(
      this.socket.conversationUpdate$.subscribe(({ message, incrementUnread }) => {
        this.updateConversationsWithMessage(message, incrementUnread);
      })
    );

    this.subscriptions.push(
      this.socket.groupUpdate$.subscribe(({ message, incrementUnread }) => {
        this.updateGroupsWithMessage(message, incrementUnread);
      })
    );

    this.subscriptions.push(
      this.socket.groupCreated$.subscribe(group => {
        this.addNewGroup(group);
      })
    );
  }

  private loadInitialData() {
    // Data will be loaded when token is available
  }

  private loadConversations() {
    this.auth.token$.subscribe(token => {
      console.log('Loading conversations with token:', token ? 'present' : 'missing');
      if (token) {
        this.api.fetchConversations(token).subscribe({
          next: (conversations) => {
            console.log('Fetched conversations:', conversations);
            this.conversationsChange.emit(conversations);
            this.updateFilteredConversations();
          },
          error: (error) => {
            console.error('Error fetching conversations:', error);
            this.auth.logout();
          }
        });
      }
    });
  }

  private loadUsers() {
    this.auth.token$.subscribe(token => {
      console.log('Loading users with token:', token ? 'present' : 'missing');
      if (token) {
        this.api.fetchUsers(token).subscribe({
          next: (users) => {
            console.log('Fetched users:', users);
            this.allUsersChange.emit(users);
            this.updateFilteredUsers();
            this.checkBlockStatusForUsers();
          },
          error: (error) => {
            console.error('Error fetching users:', error);
            this.auth.logout();
          }
        });
      }
    });
  }

  private loadGroups() {
    this.auth.token$.subscribe(token => {
      console.log('Loading groups with token:', token ? 'present' : 'missing');
      if (token) {
        this.api.fetchUserGroups(token).subscribe({
          next: (userGroups) => {
            console.log('Fetched groups:', userGroups);
            const groupsWithExtras = userGroups.map(g => ({
              ...g,
              unreadCount: (g as any).unreadCount ?? 0,
              lastMessage: (g as any).lastMessage ?? null
            }));
            this.groups = groupsWithExtras;
            this.groupsChange.emit(groupsWithExtras);
            this.updateFilteredGroups();
            this.joinGroupRooms(userGroups);
          },
          error: (error) => {
            console.error('Error fetching groups:', error);
            this.auth.logout();
          }
        });
      }
    });
  }

  private joinGroupRooms(groups: Group[]) {
    groups.forEach(group => {
      this.socket.joinGroupChat(group._id);
    });
  }

  private checkBlockStatusForUsers() {
    this.auth.token$.subscribe(token => {
      if (!token) return;
      
      const allUserIds = [...this.allUsers.map(u => u.id), ...this.conversations.map(c => c._id)];
      const uniqueUserIds = [...new Set(allUserIds)];
      
      uniqueUserIds.forEach(userId => {
        if (userId !== this.auth.currentUserId) {
          this.api.checkBlockStatus(token, userId).subscribe({
            next: (result) => {
              if (result?.isBlockedByMe) {
                this.blockedUsers.add(userId);
              } else {
                this.blockedUsers.delete(userId);
              }
              
              if (result?.isBlockedByThem) {
                this.blockedByUsers.add(userId);
              } else {
                this.blockedByUsers.delete(userId);
              }
            },
            error: (error) => {
              console.error('Error checking block status for user:', userId, error);
            }
          });
        }
      });
    });
  }

  // Search functionality
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.showSearchResults = this.searchQuery.length > 0;
    this.updateFilteredConversations();
    this.updateFilteredGroups();
    this.updateFilteredUsers();
  }

  private updateFilteredConversations() {
    if (!this.searchQuery) {
      this.filteredConversations = this.conversations;
    } else {
      this.filteredConversations = this.conversations.filter(conv => 
        conv.username.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        conv.email.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  }

  private updateFilteredGroups() {
    if (!this.searchQuery) {
      this.filteredGroups = this.groups;
    } else {
      this.filteredGroups = this.groups.filter(group => 
        group.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  }

  private updateFilteredUsers() {
    this.filteredUsers = this.allUsers.filter(
      (u) =>
        u.id !== this.auth.currentUserId &&
        (u.username.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(this.searchQuery.toLowerCase()))
    );
  }

  // User selection
  onUserSelect(user: User) {
    // If clicking on the same user, close the chat
    if (this.selectedUser?.id === user.id) {
      this.userSelect.emit(null);
      this.groupSelect.emit(null);
      this.showSearchResults = false;
      this.searchQuery = '';
      return;
    }

    // Otherwise, open the chat with the selected user
    this.userSelect.emit(user);
    this.groupSelect.emit(null);
    this.showSearchResults = false;
    this.searchQuery = '';

    // Mark messages as read
    this.auth.token$.subscribe(token => {
      if (token && user.id) {
        this.api.markMessagesAsRead(token, user.id).subscribe({
          next: (result) => {
            if (result) {
              const updatedConversations = this.conversations.map((conv) =>
                conv._id === user.id ? { ...conv, unreadCount: 0 } : conv
              );
              this.conversationsChange.emit(updatedConversations);
            }
          },
          error: (error) => {
            console.error('Error marking messages as read:', error);
          }
        });
      }
    });
  }

  // Group selection
  onGroupSelect(group: Group) {
    // If clicking on the same group, close the chat
    if (this.selectedGroup?._id === group._id) {
      this.groupSelect.emit(null);
      this.userSelect.emit(null);
      return;
    }

    // Mark messages as read on server
    this.socket.markGroupMessagesAsRead(group._id);

    // Update the UI
    this.groupSelect.emit(group);
    this.userSelect.emit(null);
    
    // Reset unread count for this group
    this.groups = this.groups.map(g => {
      if (g._id === group._id) {
        return { ...g, unreadCount: 0 };
      }
      return g;
    });
    this.groupsChange.emit(this.groups);
    this.updateFilteredGroups();
  }

  // Tab switching
  onTabChange(tab: 'chats' | 'groups') {
    this.activeTab = tab;
  }

  // Group creation
  onCreateGroup() {
    this.showCreateGroupModal = true;
  }

  onGroupCreated() {
    this.showCreateGroupModal = false;
    this.loadGroups(); // Refresh groups list
  }

  // Utility methods
  isUserOnline(userId: string): boolean {
    if (this.isUserBlockedByThem(userId)) return false;
    return this.onlineUsers.some((u) => u.userId === userId);
  }

  isUserBlockedByMe(userId: string): boolean {
    return this.blockedUsers.has(userId);
  }

  isUserBlockedByThem(userId: string): boolean {
    return this.blockedByUsers.has(userId);
  }

  // Message update handlers
  private updateConversationsWithMessage(message: Message, shouldIncrementUnread: boolean = true) {
    // Only handle direct messages (not group messages)
    if (message.group) return;
    
    const updatedConversations = this.conversations.map(conv => {
      if (conv._id === message.sender._id) {
        const isCurrentUser = message.sender._id === this.auth.currentUserId;
        const isCurrentlyOpen = this.selectedUser?.id === message.sender._id;
        
        let newUnreadCount = conv.unreadCount;
        if (shouldIncrementUnread && !isCurrentUser && !isCurrentlyOpen) {
          newUnreadCount = (conv.unreadCount || 0) + 1;
        } else if (isCurrentlyOpen) {
          newUnreadCount = 0;
        }
        
        return {
          ...conv,
          lastMessage: message,
          unreadCount: newUnreadCount
        };
      }
      return conv;
    });
    
    this.conversationsChange.emit(updatedConversations);
    this.updateFilteredConversations();
  }

  private updateGroupsWithMessage(message: Message, shouldIncrementUnread: boolean = true) {
    // Only handle group messages
    if (!message.group) return;
    
    const messageGroupId = typeof message.group === 'string' ? message.group : message.group?._id;
    
    const existingGroupIndex = this.groups.findIndex(
      (group) => group._id === messageGroupId
    );

    if (existingGroupIndex >= 0) {
      const existingGroup = this.groups[existingGroupIndex];
      
      // Don't update unread counts for removed or left members
      if (existingGroup.hasBeenRemoved || existingGroup.hasLeft) {
        return;
      }
      
      const isCurrentGroupOpen = this.selectedGroup?._id === messageGroupId;
      const isCurrentUser = message.sender._id === this.auth.currentUserId;
      
      let newUnreadCount = existingGroup.unreadCount || 0;
      if (isCurrentGroupOpen) {
        newUnreadCount = 0;
      } else if (!isCurrentUser && shouldIncrementUnread) {
        newUnreadCount = (existingGroup.unreadCount || 0) + 1;
      }
      
      const updatedGroups = [...this.groups];
      updatedGroups[existingGroupIndex] = {
        ...existingGroup,
        lastMessage: message,
        unreadCount: newUnreadCount,
      };

      // Move to top
      const [updatedGroup] = updatedGroups.splice(existingGroupIndex, 1);
      const newGroupsState = [updatedGroup, ...updatedGroups];
      
      this.groups = newGroupsState;
      this.groupsChange.emit(newGroupsState);
      this.updateFilteredGroups();
    } else {
      // Create new group conversation
      const newGroup: GroupWithUnread = {
        _id: messageGroupId,
        name: typeof message.group === 'string' ? 'Group' : message.group?.name || 'Group',
        lastMessage: message,
        unreadCount: shouldIncrementUnread && message.sender._id !== this.auth.currentUserId ? 1 : 0,
      } as GroupWithUnread;
      
      const newGroupsState = [newGroup, ...this.groups];
      this.groups = newGroupsState;
      this.groupsChange.emit(newGroupsState);
      this.updateFilteredGroups();
    }
  }

  private addNewGroup(group: Group) {
    const groupWithUnread: GroupWithUnread = {
      ...group,
      unreadCount: group.createdBy._id === this.auth.currentUserId ? 0 : 1,
      lastMessage: group.latestMessage ? {
        _id: group.latestMessage.messageId,
        text: group.latestMessage.text || '',
        messageType: group.latestMessage.messageType,
        sender: {
          _id: group.latestMessage.sender,
          username: group.latestMessage.senderUsername || 'System'
        },
        createdAt: group.latestMessage.createdAt,
        isRead: false
      } : null
    };
    
    // Check if group already exists to avoid duplicates
    const exists = this.groups.some(g => g._id === group._id);
    if (!exists) {
      const newGroups = [groupWithUnread, ...this.groups];
      this.groups = newGroups;
      this.groupsChange.emit(newGroups);
      this.updateFilteredGroups();
    }

    // Join the group chat room for real-time updates
    this.socket.joinGroupChat(group._id);
  }

  // Helper method for template
  getFilteredUsersForModal(): User[] {
    return this.allUsers.filter(u => u.id !== this.auth.currentUserId);
  }
}