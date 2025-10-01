import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message, User } from '../../types/chat-types';
import { AuthService } from '../../services/auth.service';
import { formatMessageDate, shouldShowDateSeparator } from '../../utils/date-utils';

@Component({
  selector: 'app-message-area',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message-area.html',
  styleUrls: ['./message-area.css'],
  host: {}
})
export class MessageArea implements OnChanges {
  @Input() messages: Message[] = [];
  @Input() isGroupChat = false;
  @Input() forceScrollToBottom = false;

  @Output() editMessage = new EventEmitter<{ messageId: string; newText: string }>();
  @Output() deleteForMe = new EventEmitter<string>();
  @Output() deleteForEveryone = new EventEmitter<string>();
  @Output() openImageViewer = new EventEmitter<string>();
  @Output() openVideoViewer = new EventEmitter<string>();

  @ViewChild('messagesEnd') private messagesEnd!: ElementRef;

  user: User | null = null;
  showDeleteMenu: string | null = null;
  
  // Edit message state
  editingMessageId: string | null = null;
  editText = '';
  isEditing = false;
  
  // Expose Math for template
  Math = Math;

  constructor(
    private authService: AuthService,
    private elementRef: ElementRef
  ) {
    this.authService.user$.subscribe(user => {
      this.user = user;
    });
  }

  // Handle click outside to close delete menu
  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.showDeleteMenu && !target.closest('.relative')) {
      this.showDeleteMenu = null;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Basic scroll - only when opening a conversation
    if (changes['forceScrollToBottom'] && this.forceScrollToBottom) {
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    }
  }

  scrollToBottom(): void {
    try {
      const hostElement = this.elementRef.nativeElement as HTMLElement;
      if (hostElement) {
        hostElement.scrollTop = hostElement.scrollHeight;
      }
    } catch (err) {
      // Silently fail
    }
  }

  formatMessageDate(dateString: string): string {
    return formatMessageDate(dateString);
  }

  shouldShowDateSeparator(currentDate: string, previousDate: string | null): boolean {
    return shouldShowDateSeparator(currentDate, previousDate);
  }

  shouldShowSenderName(message: Message, previousMessage: Message | null): boolean {
    if (!this.isGroupChat) return false;
    if (!previousMessage) return true;
    if (message.messageType === 'system') return false;
    if (previousMessage.sender._id !== message.sender._id) return true;
    if (previousMessage.messageType === 'system') return true;
    return false;
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  isMessageDeleted(message: Message): boolean {
    if (message.group) {
      if (message.sender._id === this.user?.id) return message.deletedForSender || false;
      return !!(message.deletedForUsers && message.deletedForUsers.includes(this.user?.id || ''));
    }
    if (message.sender._id === this.user?.id) return message.deletedForSender || false;
    return message.deletedForReceiver || false;
  }

  handleEditMessage(message: Message): void {
    this.editingMessageId = message._id;
    this.editText = message.text || '';
    this.isEditing = false;
    this.showDeleteMenu = null; // Close menu when editing
  }

  handleSaveEdit(): void {
    if (!this.editingMessageId || !this.editText.trim() || this.isEditing) return;

    this.isEditing = true;
    this.editMessage.emit({ 
      messageId: this.editingMessageId, 
      newText: this.editText.trim() 
    });
    
    this.editingMessageId = null;
    this.editText = '';
    this.isEditing = false;
  }

  handleCancelEdit(): void {
    this.editingMessageId = null;
    this.editText = '';
    this.isEditing = false;
  }

  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSaveEdit();
    } else if (event.key === 'Escape') {
      this.handleCancelEdit();
    }
  }

  onDeleteForMe(messageId: string): void {
    this.deleteForMe.emit(messageId);
    this.showDeleteMenu = null;
  }

  onDeleteForEveryone(messageId: string): void {
    this.deleteForEveryone.emit(messageId);
    this.showDeleteMenu = null;
  }

  canEditMessage(message: Message): boolean {
    if (message.sender._id !== this.user?.id || message.messageType !== 'text') {
      return false;
    }
    
    // Check if message is older than 12 hours
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const twelveHoursInMs = 12 * 60 * 60 * 1000;
    
    return messageAge <= twelveHoursInMs;
  }

  canDeleteMessage(message: Message): boolean {
    return message.sender._id === this.user?.id && 
           !message.deletedForSender && 
           !message.deletedForEveryone;
  }

  canDeleteForEveryone(message: Message): boolean {
    if (message.sender._id !== this.user?.id) {
      return false;
    }
    
    // Check if message is older than 12 hours
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const twelveHoursInMs = 12 * 60 * 60 * 1000;
    
    return messageAge <= twelveHoursInMs;
  }

  toggleDeleteMenu(messageId: string): void {
    this.showDeleteMenu = this.showDeleteMenu === messageId ? null : messageId;
  }
}
