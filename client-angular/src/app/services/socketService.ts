// src/app/services/socket.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { environment } from '../environments/environment';
import type { Message, OnlineUser, Group, User } from '../types/chatTypes';
import { AuthService } from './authService';
import { Router } from '@angular/router';

const SOCKET_URL = environment.SOCKET_URL;

@Injectable({
  providedIn: 'root',
})
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;

  // Connection state
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  public isConnected$ = this.isConnectedSubject.asObservable();

  // Presence
  private onlineUsersSubject = new BehaviorSubject<OnlineUser[]>([]);
  public onlineUsers$ = this.onlineUsersSubject.asObservable();

  // Central message store (keeps messages for currently-open chats aggregated)
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  // Conversations / Groups updates (UI lists)
  private conversationUpdateSubject = new Subject<{ message: Message; incrementUnread?: boolean }>();
  public conversationUpdate$ = this.conversationUpdateSubject.asObservable();

  private groupUpdateSubject = new Subject<{ message: Message; incrementUnread?: boolean }>();
  public groupUpdate$ = this.groupUpdateSubject.asObservable();

  // Single-event subjects for components that want only one-time events
  public messageSent$ = new Subject<Message>();
  public messageEdited$ = new Subject<Message>();
  public messageDeleted$ = new Subject<Message>();
  public messagesRead$ = new Subject<{ senderId: string }>();
  public groupCreated$ = new Subject<Group>();
  public groupMemberRemoved$ = new Subject<{ groupId: string; removedMemberId: string; message: Message }>();

  // Typing indicator (map of chatId -> typing users)
  private typingSubject = new BehaviorSubject<Record<string, string[]>>({});
  public typing$ = this.typingSubject.asObservable();

  // internal
  private tokenSub?: Subscription;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelayMs = 1000;

  constructor(private auth: AuthService, private router: Router) {
    // Listen to token changes and (re)connect accordingly
    this.tokenSub = this.auth.token$
      .pipe()
      .subscribe((token) => {
        if (token) {
          this.connect(token);
        } else {
          this.disconnect();
        }
      });
  }

  // --------------------
  // Connection lifecycle
  // --------------------
  private connect(token: string) {
    // If already connected with same token, do nothing
    if (this.socket && this.socket.connected) return;

    // create socket
    this.socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelayMs,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      forceNew: true,
    });

    this.registerSocketHandlers();
  }

  private disconnect() {
    this.socket?.off();
    this.socket?.close();
    this.socket = null;
    this.isConnectedSubject.next(false);
    this.onlineUsersSubject.next([]);
    this.messagesSubject.next([]);
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.tokenSub?.unsubscribe();
  }

  // --------------------
  // Event registrations
  // --------------------
  private registerSocketHandlers() {
    if (!this.socket) return;

    // connection / reconnection events
    this.socket.on('connect', () => {
      this.isConnectedSubject.next(true);
      this.reconnectAttempts = 0;
      this.reconnectDelayMs = 1000;
      console.debug('[socket] connected', this.socket?.id);
    });

    this.socket.on('disconnect', (reason?: string) => {
      this.isConnectedSubject.next(false);
      this.onlineUsersSubject.next([]);
      console.warn('[socket] disconnected', reason);
    });

    this.socket.on('connect_error', (err: any) => {
      console.error('[socket] connect_error', err);
      this.reconnectAttempts++;
      if (err && err.message === 'Authentication error') {
        // token invalid or expired -> force logout
        this.auth.logout();
        this.router.navigate(['/login']);
      }
    });

    // Presence
    this.socket.on('onlineUsers', (users: OnlineUser[]) => {
      this.onlineUsersSubject.next(users);
    });
    this.socket.on('userOnline', (user: OnlineUser) => {
      const current = this.onlineUsersSubject.value;
      if (!current.some(u => u.userId === user.userId)) {
        this.onlineUsersSubject.next([...current, user]);
      }
    });
    this.socket.on('userOffline', (user: OnlineUser) => {
      const current = this.onlineUsersSubject.value;
      this.onlineUsersSubject.next(current.filter(u => u.userId !== user.userId));
    });

    // Direct Messages
    this.socket.on('receiveMessage', (message: Message) => {
      this.handleIncomingDirectMessage(message);
    });

    this.socket.on('messageSent', (message: Message) => {
      // Replace temp message or add
      this.upsertMessage(message);
      this.messageSent$.next(message);
      // update conversations (no unread increment for sent messages)
      if (message.receiver && !message.group) {
        this.conversationUpdateSubject.next({ message, incrementUnread: false });
      }
    });

    this.socket.on('messagesRead', (data: { senderId: string }) => {
      this.messagesRead$.next(data);
    });

    this.socket.on('messageEdited', (message: Message) => {
      this.upsertMessage(message);
      this.messageEdited$.next(message);

      // notify conversation or group updates
      if (message.receiver && !message.group) {
        this.conversationUpdateSubject.next({ message, incrementUnread: false });
      } else if (message.group) {
        this.groupUpdateSubject.next({ message, incrementUnread: false });
      }
    });

    this.socket.on('messageDeletedForMe', (message: Message) => {
      this.upsertMessage(message);
      this.messageDeleted$.next(message);
      if (message.receiver && !message.group) {
        this.conversationUpdateSubject.next({ message, incrementUnread: false });
      } else if (message.group) {
        this.groupUpdateSubject.next({ message, incrementUnread: false });
      }
    });

    this.socket.on('messageDeletedForEveryone', (message: Message) => {
      // treated as edited (message text "This message was deleted")
      this.upsertMessage(message);
      this.messageDeleted$.next(message);
      if (message.receiver && !message.group) {
        this.conversationUpdateSubject.next({ message, incrementUnread: false });
      } else if (message.group) {
        this.groupUpdateSubject.next({ message, incrementUnread: false });
      }
    });

    // Group messaging
    this.socket.on('newMessage', (message: Message) => {
      if (message.group) {
        this.handleIncomingGroupMessage(message);
      }
    });

    this.socket.on('groupCreated', (group: Group) => {
      this.groupCreated$.next(group);
    });

    this.socket.on('memberRemovedFromGroup', (data: { groupId: string; message: Message; updatedGroup?: Group }) => {
      // add system message to messages store and notify group list
      this.upsertMessage(data.message);
      this.groupUpdateSubject.next({ message: data.message, incrementUnread: false });
      this.groupMemberRemoved$.next({ groupId: data.groupId, removedMemberId: '', message: data.message });
    });

    this.socket.on('groupMemberRemoved', (data: { groupId: string; removedMemberId: string; removedMemberUsername: string; message: Message; updatedGroup: Group }) => {
      this.upsertMessage(data.message);
      this.groupUpdateSubject.next({ message: data.message, incrementUnread: false });
      this.groupMemberRemoved$.next({ groupId: data.groupId, removedMemberId: data.removedMemberId, message: data.message });
    });

    this.socket.on('groupMemberLeft', (data: { groupId: string; leftMemberId: string; leftMemberUsername: string; message: Message }) => {
      this.upsertMessage(data.message);
      this.groupUpdateSubject.next({ message: data.message, incrementUnread: false });
    });

    // Typing indicators
    this.socket.on('userTyping', (payload: { chatId: string; userId: string; username?: string }) => {
      this.addTyping(payload.chatId, payload.userId);
    });

    this.socket.on('userStoppedTyping', (payload: { chatId: string; userId: string }) => {
      this.removeTyping(payload.chatId, payload.userId);
    });

    // Optional: other server-sent events can be added similarly
  }

  // --------------------
  // Helper methods
  // --------------------
  private handleIncomingDirectMessage(message: Message) {
    // Add message if it involves current user
    const currentUser = this.auth.currentUser;
    if (!currentUser) return;
    const isSender = message.sender._id === currentUser.id;
    const isReceiver = !!message.receiver && message.receiver._id === currentUser.id;
    if (!isSender && !isReceiver) return;

    // Append message only if chat is currently open — components may filter or we just append
    this.upsertMessage(message);

    // Update conversation list and unread increment logic
    const shouldIncrementUnread = !this.isChatOpenWith(message.sender._id) && message.receiver && message.receiver._id === currentUser.id;
    this.conversationUpdateSubject.next({ message, incrementUnread: shouldIncrementUnread });
  }

  private handleIncomingGroupMessage(message: Message) {
    // group messages: append if viewing group or still append for history
    this.upsertMessage(message);

    const isSender = message.sender._id === this.auth.currentUserId;
    const viewingThisGroup = this.isViewingGroup(message.group as any);
    const shouldIncrementUnread = !viewingThisGroup && !isSender;
    this.groupUpdateSubject.next({ message, incrementUnread: shouldIncrementUnread });
  }

  private isChatOpenWith(otherUserId: string): boolean {
    // Placeholder: components can set a "current open chat" on the service later.
    // For now we default to false — components can subscribe to messages list and decide.
    return false;
  }

  private isViewingGroup(group: string | Group | undefined): boolean {
    // Placeholder similar to isChatOpenWith
    return false;
  }

  /** Upsert message into store */
  private upsertMessage(message: Message) {
    const current = [...this.messagesSubject.value];
    const idx = current.findIndex(m => m._id === message._id);
    if (idx >= 0) {
      current[idx] = message;
    } else {
      current.push(message);
    }
    // Keep chronological order (old -> new)
    current.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    this.messagesSubject.next(current);
  }

  // --------------------
  // Typing helpers
  // --------------------
  private addTyping(chatId: string, userId: string) {
    const map = { ...this.typingSubject.value };
    map[chatId] = Array.from(new Set([...(map[chatId] || []), userId]));
    this.typingSubject.next(map);
  }

  private removeTyping(chatId: string, userId: string) {
    const map = { ...this.typingSubject.value };
    map[chatId] = (map[chatId] || []).filter(id => id !== userId);
    this.typingSubject.next(map);
  }

  // --------------------
  // Emitters (calls to backend)
  // --------------------
  public sendMessage(receiverId: string, text: string, messageType: 'text'|'image'|'video' = 'text', imageData?: string, videoData?: string) {
    if (!this.socket) return;
    const payload: any = { receiverId, messageType };
    if (messageType === 'text') payload.text = text;
    if (messageType === 'image' && imageData) payload.imageData = imageData;
    if (messageType === 'video' && videoData) payload.videoData = videoData;
    this.socket.emit('sendMessage', payload);
  }

  public sendGroupMessage(groupId: string, text: string, messageType: 'text'|'image'|'video' = 'text', imageData?: string, videoData?: string) {
    if (!this.socket) return;
    const payload: any = { groupId, messageType };
    if (messageType === 'text') payload.text = text;
    if (messageType === 'image' && imageData) payload.imageData = imageData;
    if (messageType === 'video' && videoData) payload.videoData = videoData;
    this.socket.emit('sendGroupMessage', payload);
  }

  public joinGroupChat(groupId: string) {
    this.socket?.emit('joinGroupChat', groupId);
  }

  public leaveGroupChat(groupId: string) {
    this.socket?.emit('leaveGroupChat', groupId);
  }

  public markMessagesAsRead(senderId: string) {
    this.socket?.emit('markMessagesAsRead', { senderId });
  }

  public markGroupMessagesAsRead(groupId: string) {
    this.socket?.emit('markGroupMessagesAsRead', { groupId });
  }

  public editMessage(messageId: string, text: string) {
    this.socket?.emit('editMessage', { messageId, text });
  }

  public deleteMessageForMe(messageId: string) {
    this.socket?.emit('deleteMessageForMe', { messageId });
  }

  public deleteMessageForEveryone(messageId: string) {
    this.socket?.emit('deleteMessageForEveryone', { messageId });
  }

  public createGroup(name: string, description: string, memberIds: string[], icon?: string) {
    this.socket?.emit('createGroup', { name, description, memberIds, icon });
  }

  public addMembersToGroup(groupId: string, memberIds: string[]) {
    this.socket?.emit('addMembersToGroup', { groupId, memberIds });
  }

  public removeMemberFromGroup(groupId: string, memberId: string) {
    this.socket?.emit('removeMemberFromGroup', { groupId, memberId });
  }

  public leaveGroup(groupId: string) {
    this.socket?.emit('leaveGroup', { groupId });
  }

  public updateGroupIcon(groupId: string, icon: string) {
    this.socket?.emit('updateGroupIcon', { groupId, icon });
  }

  // typing
  public startTyping(chatId: string) {
    this.socket?.emit('typing', { chatId });
  }
  public stopTyping(chatId: string) {
    this.socket?.emit('stopTyping', { chatId });
  }

  // --------------------
  // Utilities: expose one-time subscriptions
  // --------------------
  /** Get current messages snapshot (synchronous) */
  public getMessagesSnapshot(): Message[] {
    return this.messagesSubject.value;
  }

  /** Clear message store (e.g., on logout) */
  public clearMessages() {
    this.messagesSubject.next([]);
  }
}
