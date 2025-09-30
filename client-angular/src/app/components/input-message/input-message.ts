import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  onMessageChange(value: string): void {
    this.messageChange.emit(value);
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
