import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
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
    private apiService: ApiService
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
}
