import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { User, OnlineUser, Group } from '../../types/chat-types';

@Component({
  selector: 'app-profile-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-info.html',
  styleUrls: ['./profile-info.css']
})
export class ProfileInfo implements OnInit {
  @Input() user!: User;
  @Input() onlineUsers: OnlineUser[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() blockUser = new EventEmitter<void>();

  currentUser: User | null = null;
  token: string | null = null;
  isBlockedByMe = false;
  isBlockedByThem = false;
  isLoading = false;
  commonGroups: Group[] = [];
  loadingGroups = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
    });
    this.authService.token$.subscribe(token => {
      this.token = token;
    });
  }

  ngOnInit(): void {
    this.checkStatus();
    this.fetchCommonGroups();
  }

  isUserOnline(userId: string): boolean {
    if (this.isBlockedByThem) return false;
    return this.onlineUsers.some((u) => u.userId === userId);
  }

  async checkStatus(): Promise<void> {
    if (this.token && this.user.id !== this.currentUser?.id) {
      try {
        const result = await this.apiService.checkBlockStatus(this.token, this.user.id);
        this.isBlockedByMe = result?.isBlockedByMe || false;
        this.isBlockedByThem = result?.isBlockedByThem || false;
      } catch (error) {
        console.error('Error checking block status:', error);
      }
    }
  }

  async fetchCommonGroups(): Promise<void> {
    if (this.token && this.user.id !== this.currentUser?.id) {
      this.loadingGroups = true;
      try {
        console.log('Fetching groups in common for user:', this.user.id);
        const groups = await this.apiService.fetchGroupsInCommon(this.token, this.user.id);
        console.log('Groups in common received:', groups);
        this.commonGroups = groups;
      } catch (error) {
        console.error('Error fetching groups in common:', error);
      } finally {
        this.loadingGroups = false;
      }
    }
  }

  async handleBlockUser(): Promise<void> {
    if (!this.token || this.isLoading) return;
    
    try {
      this.isLoading = true;
      if (this.isBlockedByMe) {
        await this.apiService.unblockUser(this.token, this.user.id);
        this.isBlockedByMe = false;
      } else {
        await this.apiService.blockUser(this.token, this.user.id);
        this.isBlockedByMe = true;
      }
      this.blockUser.emit(); // Notify parent component
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
      alert(error instanceof Error ? error.message : 'Failed to update block status');
    } finally {
      this.isLoading = false;
    }
  }
}
