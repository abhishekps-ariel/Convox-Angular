import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User, OnlineUser } from '../../types/chat-types';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ProfileInfo } from '../profile-info/profile-info';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule, ProfileInfo],
  templateUrl: './chat-header.html',
  styleUrls: ['./chat-header.css']
})
export class ChatHeader implements OnInit, OnChanges {
  @Input() selectedUser!: User;
  @Input() onlineUsers: OnlineUser[] = [];

  @Output() blockUser = new EventEmitter<void>();

  user: User | null = null;
  token: string | null = null;
  showProfileInfo = false;
  isBlockedByMe = false;
  isBlockedByThem = false;

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
    });
  }

  ngOnChanges(): void {
    if (this.selectedUser && this.token) {
      this.checkBlockStatus();
    }
  }

  async checkBlockStatus(): Promise<void> {
    if (!this.token || !this.selectedUser || this.selectedUser.id === this.user?.id) return;

    try {
      const result = await this.apiService.checkBlockStatus(this.token, this.selectedUser.id);
      this.isBlockedByMe = result?.isBlockedByMe || false;
      this.isBlockedByThem = result?.isBlockedByThem || false;
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  }

  isUserOnline(userId: string): boolean {
    if (this.isBlockedByThem) return false;
    return this.onlineUsers.some(u => u.userId === userId);
  }

  toggleProfileInfo(): void {
    this.showProfileInfo = !this.showProfileInfo;
  }

  onBlockUser(): void {
    this.blockUser.emit();
  }
}
