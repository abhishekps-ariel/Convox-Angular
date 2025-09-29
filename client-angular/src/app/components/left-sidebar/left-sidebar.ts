import { Component, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User, OnlineUser, Conversation, Group } from '../../types/chat-types';

@Component({
  selector: 'app-left-sidebar',
  imports: [CommonModule],
  templateUrl: './left-sidebar.html'
})
export class LeftSidebar {
  // Inputs from parent component
  selectedUser = input<User | null>(null);
  selectedGroup = input<Group | null>(null);
  conversations = input<Conversation[]>([]);
  allUsers = input<User[]>([]);
  onlineUsers = input<OnlineUser[]>([]);
  messages = input<any[]>([]);
  socket = input<any>(null);

  // Outputs to parent component
  onUserSelect = output<User | null>();
  onGroupSelect = output<Group | null>();
  onConversationsChange = output<Conversation[]>();
  onAllUsersChange = output<User[]>();
  onGroupsChange = output<any[]>();

  // Local state
  searchQuery = signal('');
  showSearchResults = signal(false);
  blockedUsers = signal<Set<string>>(new Set());
  blockedByUsers = signal<Set<string>>(new Set());
  groups = signal<any[]>([]);
  showCreateGroupModal = signal(false);
  activeTab = signal<'chats' | 'groups'>('chats');
  
  // Current user
  user = signal<User | null>(null);

  constructor(private authService: AuthService) {
    this.authService.user$.subscribe(user => {
      this.user.set(user);
    });
  }

  // Search functionality
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.showSearchResults.set(target.value.length > 0);
  }

  // Tab switching
  onTabChange(tab: 'chats' | 'groups') {
    this.activeTab.set(tab);
  }

  // User selection
  onUserClick(user: User) {
    // If clicking on the same user, close the chat
    if (this.selectedUser()?.id === user.id) {
      this.onUserSelect.emit(null);
      this.onGroupSelect.emit(null);
      this.showSearchResults.set(false);
      this.searchQuery.set('');
      return;
    }

    // Otherwise, open the chat with the selected user
    this.onUserSelect.emit(user);
    this.onGroupSelect.emit(null);
    this.showSearchResults.set(false);
    this.searchQuery.set('');
  }

  // Group selection
  onGroupClick(group: Group) {
    // If clicking on the same group, close the chat
    if (this.selectedGroup()?._id === group._id) {
      this.onGroupSelect.emit(null);
      this.onUserSelect.emit(null);
      return;
    }

    // Otherwise, open the chat with the selected group
    this.onGroupSelect.emit(group);
    this.onUserSelect.emit(null);
  }

  // Create group modal
  onCreateGroup() {
    this.showCreateGroupModal.set(true);
  }

  onCloseCreateGroupModal() {
    this.showCreateGroupModal.set(false);
  }

  // Helper methods
  isUserOnline(userId: string): boolean {
    return this.onlineUsers().some((u) => u.userId === userId);
  }

  isUserBlockedByMe(userId: string): boolean {
    return this.blockedUsers().has(userId);
  }

  isUserBlockedByThem(userId: string): boolean {
    return this.blockedByUsers().has(userId);
  }

  // Filtered data for display
  get filteredConversations() {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.conversations();
    
    return this.conversations().filter(conv => 
      conv.username.toLowerCase().includes(query) ||
      conv.email.toLowerCase().includes(query)
    );
  }

  get filteredGroups() {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.groups();
    
    return this.groups().filter(group => 
      group.name.toLowerCase().includes(query)
    );
  }

  get filteredUsers() {
    const query = this.searchQuery().toLowerCase();
    return this.allUsers().filter(
      (u) =>
        u.id !== this.user()?.id &&
        (u.username.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query))
    );
  }
}
