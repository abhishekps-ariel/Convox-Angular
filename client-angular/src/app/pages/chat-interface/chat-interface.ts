import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/authService';
import { NavbarComponent } from "../../components/navbar/navbar";
import { LeftSidebar } from "../../components/chat/left-sidebar/left-sidebar";
import { Subscription } from 'rxjs';
import type { User, OnlineUser, Conversation, Group, Message, GroupWithUnread } from '../../types/chatTypes';

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [CommonModule, NavbarComponent, LeftSidebar],
  templateUrl:'./chat-interface.html'
})
export class ChatInterfaceComponent implements OnInit, OnDestroy {
  selectedUser: User | null = null;
  selectedGroup: Group | null = null;
  conversations: Conversation[] = [];
  allUsers: User[] = [];
  onlineUsers: OnlineUser[] = [];
  messages: Message[] = [];
  groups: GroupWithUnread[] = [];

  private subscriptions: Subscription[] = [];

  constructor(private auth: AuthService) {}

  ngOnInit() {
    // Initialize with empty data - will be populated by LeftSidebar
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onUserSelect(user: User | null) {
    this.selectedUser = user;
    this.selectedGroup = null;
  }

  onGroupSelect(group: Group | null) {
    this.selectedGroup = group;
    this.selectedUser = null;
  }

  onConversationsChange(conversations: Conversation[]) {
    this.conversations = conversations;
  }

  onAllUsersChange(users: User[]) {
    this.allUsers = users;
  }

  onGroupsChange(groups: GroupWithUnread[]) {
    this.groups = groups;
  }
}
