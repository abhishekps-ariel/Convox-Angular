import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';

@Component({
  selector: 'app-input-message',
  standalone: true,
  imports: [CommonModule, FormsModule, PickerComponent],
  templateUrl: './input-message.html',
  styleUrls: ['./input-message.css']
})
export class InputMessage {
  @Input() newMessage = '';
  @Input() disabled = false;
  @Input() selectedImage: string | null = null;
  @Input() selectedVideo: string | null = null;
  @Input() isUploading = false;

  @Output() messageChange = new EventEmitter<string>();
  @Output() sendMessage = new EventEmitter<void>();
  @Output() imageSelect = new EventEmitter<Event>();
  @Output() videoSelect = new EventEmitter<Event>();
  @Output() sendImage = new EventEmitter<void>();
  @Output() sendVideo = new EventEmitter<void>();
  @Output() removeSelectedImage = new EventEmitter<void>();
  @Output() removeSelectedVideo = new EventEmitter<void>();

  showEmojiPicker = false;

  // Close emoji picker when clicking outside - EXACT React pattern
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.showEmojiPicker && !target.closest('.emoji-picker-wrapper')) {
      this.showEmojiPicker = false;
    }
  }

  onMessageChange(value: string): void {
    this.messageChange.emit(value);
  }

  onEmojiSelect(event: any): void {
    // ngx-emoji-mart uses different structure
    console.log('Emoji event:', event);
    const emoji = event?.emoji?.native || event?.native || event;
    if (typeof emoji === 'string') {
      this.messageChange.emit(this.newMessage + emoji);
      this.showEmojiPicker = false;
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.newMessage.trim() && !this.disabled) {
      this.sendMessage.emit();
    }
  }

  onImageSelected(event: Event): void {
    this.imageSelect.emit(event);
  }

  onVideoSelected(event: Event): void {
    this.videoSelect.emit(event);
  }

  onSendImage(): void {
    this.sendImage.emit();
  }

  onSendVideo(): void {
    this.sendVideo.emit();
  }

  onRemoveImage(): void {
    this.removeSelectedImage.emit();
  }

  onRemoveVideo(): void {
    this.removeSelectedVideo.emit();
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }
}
