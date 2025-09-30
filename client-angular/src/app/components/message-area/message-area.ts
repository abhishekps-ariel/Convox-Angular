import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewChecked, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message, User } from '../../types/chat-types';
import { AuthService } from '../../services/auth.service';
import { formatMessageDate, shouldShowDateSeparator } from '../../utils/date-utils';

@Component({
  selector: 'app-message-area',
  standalone: true,
  imports: [CommonModule],
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

  constructor(private authService: AuthService) {
    this.authService.user$.subscribe(user => {
      this.user = user;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages']) {
      this.shouldScroll = true;
    }
    if (changes['forceScrollToBottom'] && this.forceScrollToBottom) {
      this.shouldScroll = true;
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
    if (this.forceScrollToBottom) {
      this.scrollToBottom();
    }
  }

  scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const container = this.messagesContainer.nativeElement;
        // Use setTimeout to ensure DOM is updated
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

  onEditMessage(messageId: string, newText: string): void {
    this.editMessage.emit({ messageId, newText });
  }

  onDeleteForMe(messageId: string): void {
    this.deleteForMe.emit(messageId);
  }

  onDeleteForEveryone(messageId: string): void {
    this.deleteForEveryone.emit(messageId);
  }

  canEditMessage(message: Message): boolean {
    return message.sender._id === this.user?.id && 
           message.messageType === 'text' && 
           !message.deletedForSender && 
           !message.deletedForEveryone;
  }

  canDeleteMessage(message: Message): boolean {
    return message.sender._id === this.user?.id && 
           !message.deletedForSender && 
           !message.deletedForEveryone;
  }

  toggleDeleteMenu(messageId: string): void {
    this.showDeleteMenu = this.showDeleteMenu === messageId ? null : messageId;
  }
}
