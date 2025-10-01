import { Component, Input, Output, EventEmitter, OnInit, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { User } from '../../types/chat-types';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageCropperComponent],
  templateUrl: './profile-modal.html',
  styleUrls: ['./profile-modal.css']
})
export class ProfileModal implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  user: User | null = null;
  token: string | null = null;
  bio = '';
  profilePicture = '';
  isLoading = false;
  previewUrl: string | null = null;
  
  // Image cropper state - EXACT React pattern
  showCropModal = false;
  imageChangedEvent: any = null;
  croppedImage: string = '';

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.user = user;
      if (this.isOpen) {
        // Reset form when modal is open and user changes
        this.bio = user?.bio || '';
        this.profilePicture = user?.profilePicture || '';
        this.previewUrl = null; // Reset preview
      }
    });

    this.authService.token$.subscribe(token => {
      this.token = token;
    });
  }

  ngOnChanges(): void {
    // Reset form data when modal opens
    if (this.isOpen) {
      this.bio = this.user?.bio || '';
      this.profilePicture = this.user?.profilePicture || '';
      this.previewUrl = null;
    }
  }

  onFileSelected(event: Event): void {
    console.log('File selected:', event);
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      console.log('File:', input.files[0]);
      // Show crop modal
      this.imageChangedEvent = event;
      this.showCropModal = true;
    }
  }

  imageCropped(event: ImageCroppedEvent): void {
    console.log('Image cropped:', event);
    console.log('Event keys:', Object.keys(event));
    
    // ngx-image-cropper uses blob, convert to base64
    if (event.blob) {
      const reader = new FileReader();
      reader.onload = () => {
        this.croppedImage = reader.result as string;
        console.log('Cropped image base64 length:', this.croppedImage.length);
      };
      reader.readAsDataURL(event.blob);
    }
  }

  handleCropComplete(): void {
    console.log('Crop complete, croppedImage:', this.croppedImage?.substring(0, 50));
    if (this.croppedImage) {
      this.profilePicture = this.croppedImage;
      this.previewUrl = this.croppedImage;
    }
    this.handleCropCancel();
  }

  handleCropCancel(): void {
    this.showCropModal = false;
    this.imageChangedEvent = null;
    this.croppedImage = '';
  }

  async handleSave(): Promise<void> {
    if (!this.token) return;

    this.isLoading = true;
    try {
      // Send empty string to remove profile picture, or the actual image - EXACT React pattern
      const profileData: any = {
        bio: this.bio.trim()
      };
      
      // Always include profilePicture field to ensure removal works
      if (this.profilePicture) {
        profileData.profilePicture = this.profilePicture;
      } else {
        profileData.profilePicture = ''; // Send empty string to explicitly remove
      }
      
      const updatedUser = await this.apiService.updateProfile(this.token, profileData);

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
      // Clear the file input - EXACT React pattern
      if (this.fileInput?.nativeElement) {
        this.fileInput.nativeElement.value = '';
      }
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
