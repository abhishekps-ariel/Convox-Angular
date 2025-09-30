import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { User, OnlineUser, Conversation, Group } from '../../types/chat-types';
import { ConversationList } from '../conversation-list/conversation-list';

@Component({
  selector: 'app-left-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, ConversationList],
  templateUrl: './left-sidebar.html',
  styleUrls: ['./left-sidebar.css']
})
export class LeftSidebar implements OnInit, OnChanges {
  @Input() selectedUser: User | null = null;
  @Input() conversations: Conversation[] = [];
  @Input() allUsers: User[] = [];
  @Input() onlineUsers: OnlineUser[] = [];

  @Output() userSelect = new EventEmitter<User>();
  @Output() conversationsChange = new EventEmitter<Conversation[]>();
  @Output() allUsersChange = new EventEmitter<User[]>();

  user: User | null = null;
  token: string | null = null;
  searchQuery = '';
  showSearchResults = false;
  blockedUsers = new Set<string>();

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

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.showSearchResults = value.length > 0;
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
}
