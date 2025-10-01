import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewChecked, OnChanges, SimpleChanges, HostListener } from '@angular/core';
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
  styleUrls: ['./message-area.css']
})
export class MessageArea implements AfterViewChecked, OnChanges {
  @Input() messages: Message[] = [];
  @Input() isGroupChat = false;
  @Input() forceScrollToBottom = false;

  @Output() editMessage = new EventEmitter<{ messageId: string; newText: string }>();
  @Output() deleteForMe = new EventEmitter<string>();
  @Output() deleteForEveryone = new EventEmitter<string>();

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  user: User | null = null;
  private shouldScroll = true;
  showDeleteMenu: string | null = null;
  
  // Edit message state
  editingMessageId: string | null = null;
  editText = '';
  isEditing = false;
  
  // Expose Math for template
  Math = Math;

  constructor(private authService: AuthService) {
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
    if (changes['messages']) {
      // Always scroll on first load or when messages change significantly
      if (!changes['messages'].previousValue || changes['messages'].previousValue.length === 0) {
        // First load - always scroll to bottom
        this.shouldScroll = true;
      } else if (this.messagesContainer) {
        // Subsequent changes - check if user is near bottom
        const container = this.messagesContainer.nativeElement;
        const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
        this.shouldScroll = isNearBottom;
      } else {
        this.shouldScroll = true;
      }
    }
    if (changes['forceScrollToBottom'] && this.forceScrollToBottom) {
      this.shouldScroll = true;
    }
  }

  ngAfterViewChecked(): void {
    // Force scroll to bottom when explicitly requested (takes priority)
    if (this.forceScrollToBottom) {
      this.scrollToBottom();
      return;
    }
    
    // Otherwise check if we should scroll based on user position
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const container = this.messagesContainer.nativeElement;
        // Scroll instantly to bottom
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 0);
      }
    } catch (err) {
      console.error('Scroll error:', err);
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
