import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { User } from '../../types/chat-types';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-modal.html',
  styleUrls: ['./profile-modal.css']
})
export class ProfileModal implements OnInit {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  user: User | null = null;
  token: string | null = null;
  bio = '';
  profilePicture = '';
  isLoading = false;
  previewUrl: string | null = null;

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.user = user;
      this.bio = user?.bio || '';
      this.profilePicture = user?.profilePicture || '';
    });

    this.authService.token$.subscribe(token => {
      this.token = token;
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64 = reader.result as string;
        this.profilePicture = base64;
        this.previewUrl = base64;
      };
      
      reader.readAsDataURL(file);
    }
  }

  async handleSave(): Promise<void> {
    if (!this.token) return;

    this.isLoading = true;
    try {
      const updatedUser = await this.apiService.updateProfile(this.token, {
        bio: this.bio.trim(),
        profilePicture: this.profilePicture || undefined
      });

      if (updatedUser) {
        this.authService.updateUser(updatedUser);
      }

      this.onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      this.isLoading = false;
    }
  }

  handleRemoveProfilePicture(): void {
    if (confirm('Are you sure you want to delete this profile image?')) {
      this.profilePicture = '';
      this.previewUrl = null;
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
