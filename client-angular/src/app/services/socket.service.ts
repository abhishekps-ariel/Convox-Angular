import { Injectable, signal, effect } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, Message, OnlineUser, Group } from '../types/chat-types';

const SOCKET_URL = 'http://localhost:5000'; // Replace with your socket URL

// Socket types - will be properly imported when socket.io-client is working
interface Socket {
  connected: boolean;
  emit(event: string, data?: any): void;
  on(event: string, callback: (data?: any) => void): void;
  close(): void;
}

// Socket.io client function - will be properly imported when working
declare const io: (url: string, options?: any) => Socket;

// Performance optimization: Debounce utility
const debounce = <T extends (...args: any[]) => void>(func: T, delay: number): T => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

// Helper function to check if a message is deleted for a specific user
const isMessageDeletedForUser = (message: Message, userId?: string): boolean => {
  if (!userId) return false;
  
  // For group messages, check if the current user deleted it for themselves
  if (message.group) {
    // If the current user is the sender, check deletedForSender
    if (message.sender._id === userId) {
      return message.deletedForSender || false;
    } else {
      // If the current user is not the sender, check if they're in deletedForUsers array
      return message.deletedForUsers && message.deletedForUsers.includes(userId) || false;
    }
  }
  
  // For direct messages, use the original logic
  if (message.sender._id === userId) {
    return message.deletedForSender || false;
  } else {
    return message.deletedForReceiver || false;
  }
};

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private isConnected = signal(false);
  private onlineUsers = signal<OnlineUser[]>([]);
  
  // Connection state tracking
  private connectionAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  // Current state
  private currentUser: User | null = null;
  private selectedUser: User | null = null;
  private selectedGroup: Group | null = null;
  private currentUserId: string | null = null;
  
  // Callbacks
  private onMessagesReadCallback?: (receiverId: string) => void;
  private updateConversationCallback?: (message: Message, shouldIncrementUnread?: boolean) => void;
  private onMessageEditedCallback?: (message: Message) => void;
  private onMessageDeletedCallback?: (message: Message) => void;
  private onGroupMessageReceivedCallback?: (message: Message, shouldIncrementUnread?: boolean) => void;
  private onGroupMessageEditedCallback?: (message: Message) => void;
  private onGroupMessageDeletedCallback?: (message: Message) => void;
  private onGroupCreatedCallback?: (group: Group) => void;
  private logoutCallback?: () => void;

  // Performance optimization: Debounced online users updates
  private debouncedSetOnlineUsers = debounce((users: OnlineUser[]) => {
    this.onlineUsers.set(users);
  }, 100);

  constructor() {
    // Effect to handle connection state changes
    effect(() => {
      if (this.isConnected()) {
        console.log('Socket connected');
      } else {
        console.log('Socket disconnected');
      }
    });
  }

  // Public getters
  get connected(): boolean {
    return this.isConnected();
  }

  get onlineUsers$(): Observable<OnlineUser[]> {
    return new BehaviorSubject(this.onlineUsers()).asObservable();
  }

  // Initialize socket connection
  connect(token: string, user: User, logout: () => void): void {
    if (this.socket?.connected) {
      return;
    }

    this.currentUser = user;
    this.currentUserId = user.id;
    this.logoutCallback = logout;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      forceNew: true
    });

    this.setupEventHandlers();
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected.set(false);
      this.onlineUsers.set([]);
      this.connectionAttempts = 0;
    }
  }

  // Update current state
  updateState(selectedUser: User | null, selectedGroup: Group | null): void {
    this.selectedUser = selectedUser;
    this.selectedGroup = selectedGroup;
  }

  // Set callbacks
  setCallbacks(callbacks: {
    onMessagesRead?: (receiverId: string) => void;
    updateConversation?: (message: Message, shouldIncrementUnread?: boolean) => void;
    onMessageEdited?: (message: Message) => void;
    onMessageDeleted?: (message: Message) => void;
    onGroupMessageReceived?: (message: Message, shouldIncrementUnread?: boolean) => void;
    onGroupMessageEdited?: (message: Message) => void;
    onGroupMessageDeleted?: (message: Message) => void;
    onGroupCreated?: (group: Group) => void;
  }): void {
    this.onMessagesReadCallback = callbacks.onMessagesRead;
    this.updateConversationCallback = callbacks.updateConversation;
    this.onMessageEditedCallback = callbacks.onMessageEdited;
    this.onMessageDeletedCallback = callbacks.onMessageDeleted;
    this.onGroupMessageReceivedCallback = callbacks.onGroupMessageReceived;
    this.onGroupMessageEditedCallback = callbacks.onGroupMessageEdited;
    this.onGroupMessageDeletedCallback = callbacks.onGroupMessageDeleted;
    this.onGroupCreatedCallback = callbacks.onGroupCreated;
  }

  // Send direct message
  sendMessage(receiverId: string, text: string, messageType: 'text' | 'image' | 'video' = 'text', imageData?: string, videoData?: string): void {
    if (this.socket?.connected) {
      const messageData: any = {
        receiverId,
        messageType
      };

      if (messageType === 'text') {
        messageData.text = text;
      } else if (messageType === 'image' && imageData) {
        messageData.imageData = imageData;
      } else if (messageType === 'video' && videoData) {
        messageData.videoData = videoData;
      }

      this.socket.emit('sendMessage', messageData);
    }
  }

  // Send group message
  sendGroupMessage(groupId: string, text: string, messageType: 'text' | 'image' | 'video' = 'text', imageData?: string, videoData?: string): void {
    if (this.socket?.connected) {
      const messageData: any = {
        groupId,
        messageType
      };

      if (messageType === 'text') {
        messageData.text = text;
      } else if (messageType === 'image' && imageData) {
        messageData.imageData = imageData;
      } else if (messageType === 'video' && videoData) {
        messageData.videoData = videoData;
      }

      this.socket.emit('sendGroupMessage', messageData);
    }
  }

  // Group management
  joinGroupChat(groupId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('joinGroupChat', groupId);
    }
  }

  leaveGroupChat(groupId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leaveGroupChat', groupId);
    }
  }

  markGroupMessagesAsRead(groupId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('markGroupMessagesAsRead', { groupId });
    }
  }

  // Message management
  markMessagesAsRead(senderId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('markMessagesAsRead', { senderId });
    }
  }

  editMessage(messageId: string, text: string): void {
    if (this.socket?.connected) {
      this.socket.emit('editMessage', { messageId, text });
    }
  }

  deleteMessageForMe(messageId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('deleteMessageForMe', { messageId });
    }
  }

  deleteMessageForEveryone(messageId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('deleteMessageForEveryone', { messageId });
    }
  }

  // Group creation
  createGroup(name: string, description: string, memberIds: string[], icon?: string): void {
    if (this.socket?.connected) {
      this.socket.emit('createGroup', { name, description, memberIds, icon });
    }
  }

  // Setup event handlers
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error);
      this.isConnected.set(false);
      this.connectionAttempts++;
      
      // Exponential backoff for reconnection
      if (this.connectionAttempts < this.maxReconnectAttempts) {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 5000);
      }
      
      if (error.message === 'Authentication error') {
        this.logoutCallback?.();
      }
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      if (error.message && error.message.includes('Failed to send message')) {
        console.error('Message sending failed:', error.message);
      }
      if (error.message && error.message.includes('Failed to delete message')) {
        console.error('Message deletion failed:', error.message);
      }
    });

    this.socket.on('connect', () => {
      this.isConnected.set(true);
      this.connectionAttempts = 0;
      this.reconnectDelay = 1000; // Reset delay on successful connection
    });

    this.socket.on('disconnect', () => {
      this.isConnected.set(false);
      this.onlineUsers.set([]);
    });

    // Performance optimization: Use debounced online users updates
    this.socket.on('onlineUsers', this.debouncedSetOnlineUsers);
    
    this.socket.on('userOnline', (user: OnlineUser) => {
      this.onlineUsers.update(prev => {
        // Avoid duplicate users
        if (prev.some(u => u.userId === user.userId)) return prev;
        return [...prev, user];
      });
    });
    
    this.socket.on('userOffline', (user: OnlineUser) => {
      this.onlineUsers.update(prev => prev.filter((u) => u.userId !== user.userId));
    });

    // Message events
    this.socket.on('receiveMessage', (message: Message) => {
      this.handleReceiveMessage(message);
    });

    this.socket.on('messageSent', (message: Message) => {
      this.handleMessageSent(message);
    });

    this.socket.on('messagesRead', (data: { senderId: string }) => {
      this.onMessagesReadCallback?.(data.senderId);
    });

    this.socket.on('messageEdited', (message: Message) => {
      this.handleMessageEdited(message);
    });

    this.socket.on('messageDeletedForMe', (message: Message) => {
      this.handleMessageDeletedForMe(message);
    });

    this.socket.on('messageDeletedForEveryone', (message: Message) => {
      this.handleMessageDeletedForEveryone(message);
    });

    // Group events
    this.socket.on('newMessage', (message: Message) => {
      this.handleGroupMessage(message);
    });

    this.socket.on('groupCreated', (group: Group) => {
      this.onGroupCreatedCallback?.(group);
    });

    this.socket.on('memberRemovedFromGroup', (data: { groupId: string; message: Message; updatedGroup?: Group }) => {
      this.handleMemberRemovedFromGroup(data);
    });

    this.socket.on('groupMemberRemoved', (data: { 
      groupId: string; 
      removedMemberId: string; 
      removedMemberUsername: string; 
      message: Message; 
      updatedGroup: Group 
    }) => {
      this.handleGroupMemberRemoved(data);
    });

    this.socket.on('groupMemberLeft', (data: { 
      groupId: string; 
      leftMemberId: string; 
      leftMemberUsername: string; 
      message: Message 
    }) => {
      this.handleGroupMemberLeft(data);
    });
  }

  // Message event handlers
  private handleReceiveMessage(message: Message): void {
    // Handle direct messages
    if (message.receiver) {
      // Only process messages where current user is either sender or receiver
      const isCurrentUserSender = message.sender._id === this.currentUserId;
      const isCurrentUserReceiver = message.receiver._id === this.currentUserId;
      
      if (isCurrentUserSender || isCurrentUserReceiver) {
        // Only add to messages if we're viewing the chat with the other user
        if (
          this.selectedUser &&
          (message.sender._id === this.selectedUser.id || message.receiver._id === this.selectedUser.id)
        ) {
          // This would need to be handled by the component that manages messages
          // For now, we'll emit an event that components can listen to
        }
      }
      
      // Update conversation list with new message
      if (this.updateConversationCallback) {
        // Check if the current user (receiver) is viewing the chat with the sender
        const isReceiverViewingThisSpecificChat = this.selectedUser && 
          this.selectedUser.id === message.sender._id;
        const shouldIncrementUnread = !isReceiverViewingThisSpecificChat && message.receiver._id === this.currentUserId;
        
        this.updateConversationCallback(message, shouldIncrementUnread);
      }
    }
  }

  private handleMessageSent(message: Message): void {
    // This would need to be handled by the component that manages messages
    // For now, we'll emit an event that components can listen to
    
    // Update conversation list with sent message (never increment unread for sent messages)
    if (this.updateConversationCallback && message.receiver && !message.group) {
      this.updateConversationCallback(message, false);
    }
  }

  private handleMessageEdited(message: Message): void {
    // This would need to be handled by the component that manages messages
    
    // Update conversation list if this is the last message (for direct messages)
    if (message.receiver && this.onMessageEditedCallback) {
      this.onMessageEditedCallback(message);
    }
    
    // Update group list if this is the last message (for group messages)
    if (message.group && this.onGroupMessageEditedCallback) {
      this.onGroupMessageEditedCallback(message);
    }
  }

  private handleMessageDeletedForMe(message: Message): void {
    // This would need to be handled by the component that manages messages
    
    // Update conversation list for normal messages
    if (message.receiver && this.onMessageDeletedCallback) {
      this.onMessageDeletedCallback(message);
    }
  }

  private handleMessageDeletedForEveryone(message: Message): void {
    // This would need to be handled by the component that manages messages
    
    // Update conversation list for normal messages
    if (message.receiver && this.onMessageDeletedCallback) {
      this.onMessageDeletedCallback(message);
    }
    
    // For group messages, update group list with the "deleted" message
    if (message.group && this.onGroupMessageReceivedCallback) {
      this.onGroupMessageReceivedCallback(message, false);
    }
  }

  private handleGroupMessage(message: Message): void {
    // Handle group messages
    if (message.group) {
      const messageGroupId = typeof message.group === 'string' ? message.group : message.group?._id;
      const isViewingThisGroupChat = this.selectedGroup && messageGroupId === this.selectedGroup._id;
      const isCurrentUserSender = message.sender._id === this.currentUserId;
      
      // Update groups in real-time for latest messages
      if (this.onGroupMessageReceivedCallback) {
        const isCurrentUserViewingThisSpecificGroup = this.selectedGroup && 
          this.selectedGroup._id === messageGroupId;
        const shouldIncrementUnread = !isCurrentUserViewingThisSpecificGroup && !isCurrentUserSender;
        
        this.onGroupMessageReceivedCallback(message, shouldIncrementUnread);
      }
    }
  }

  private handleMemberRemovedFromGroup(data: { groupId: string; message: Message; updatedGroup?: Group }): void {
    // Update group list with the system message
    if (this.onGroupMessageReceivedCallback) {
      this.onGroupMessageReceivedCallback(data.message, false);
    }
    
    // If updated group data is provided, update the group list
    if (data.updatedGroup && this.onGroupCreatedCallback) {
      this.onGroupCreatedCallback(data.updatedGroup);
    }
  }

  private handleGroupMemberRemoved(data: { 
    groupId: string; 
    removedMemberId: string; 
    removedMemberUsername: string; 
    message: Message; 
    updatedGroup: Group 
  }): void {
    // Update group list with the system message
    if (this.onGroupMessageReceivedCallback) {
      this.onGroupMessageReceivedCallback(data.message, false);
    }
  }

  private handleGroupMemberLeft(data: { 
    groupId: string; 
    leftMemberId: string; 
    leftMemberUsername: string; 
    message: Message 
  }): void {
    // Update group list with the system message
    if (this.onGroupMessageReceivedCallback) {
      this.onGroupMessageReceivedCallback(data.message, false);
    }
  }
}
