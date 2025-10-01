import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Message, OnlineUser, User, Group } from '../types/chat-types';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  
  public isConnected$ = this.isConnectedSubject.asObservable();
  
  private selectedUser: User | null = null;
  private selectedGroup: Group | null = null;
  private currentUserId?: string;
  
  // Callbacks
  private onMessagesReadCallback?: (receiverId: string) => void;
  private updateConversationCallback?: (message: Message, shouldIncrementUnread?: boolean) => void;
  private onMessageEditedCallback?: (message: Message) => void;
  private onMessageDeletedCallback?: (message: Message) => void;
  private onGroupMessageReceivedCallback?: (message: Message, shouldIncrementUnread?: boolean) => void;
  private onGroupMessageEditedCallback?: (message: Message) => void;
  private onGroupMessageDeletedCallback?: (message: Message) => void;
  private onGroupCreatedCallback?: (group: Group) => void;
  private onMemberRemovedCallback?: (data: any) => void;
  private onMemberLeftCallback?: (data: any) => void;
  
  constructor() {}

  connect(
    token: string,
    onLogout: () => void,
    setMessages: (updateFn: (messages: Message[]) => Message[]) => void,
    setOnlineUsers: (users: OnlineUser[]) => void
  ): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.socketUrl, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      forceNew: true
    });

    this.setupSocketListeners(onLogout, setMessages, setOnlineUsers);
  }

  private setupSocketListeners(
    onLogout: () => void,
    setMessages: (updateFn: (messages: Message[]) => Message[]) => void,
    setOnlineUsers: (users: OnlineUser[]) => void
  ): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnectedSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      this.isConnectedSubject.next(false);
      setOnlineUsers([]);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnectedSubject.next(false);
      if (error.message === 'Authentication error') {
        onLogout();
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Direct messages
    this.socket.on('receiveMessage', (message: Message) => {
      if (message.receiver) {
        const isCurrentUserSender = message.sender._id === this.currentUserId;
        const isCurrentUserReceiver = message.receiver._id === this.currentUserId;
        
        if (isCurrentUserSender || isCurrentUserReceiver) {
          if (
            this.selectedUser &&
            (message.sender._id === this.selectedUser.id || message.receiver._id === this.selectedUser.id)
          ) {
            setMessages((prev) => [...prev, message]);
          }
        }
        
        if (this.updateConversationCallback) {
          const isReceiverViewingThisSpecificChat = this.selectedUser && 
            this.selectedUser.id === message.sender._id;
          const shouldIncrementUnread = !isReceiverViewingThisSpecificChat && message.receiver._id === this.currentUserId;
          
          this.updateConversationCallback(message, shouldIncrementUnread);
        }
      }
    });

    this.socket.on('messageSent', (message: Message) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id.startsWith('temp-')) {
            if (message.messageType === 'text' && msg.text === message.text) {
              return message;
            } else if (message.messageType === 'image' && msg.imageUrl === message.imageUrl) {
              return message;
            } else if (message.messageType === 'video' && msg.videoUrl === message.videoUrl) {
              return message;
            }
          }
          return msg;
        })
      );
      
      if (this.updateConversationCallback && message.receiver && !message.group) {
        this.updateConversationCallback(message, false);
      }
    });

    this.socket.on('messagesRead', (data: { senderId: string }) => {
      if (this.onMessagesReadCallback) {
        this.onMessagesReadCallback(data.senderId);
      }
    });

    this.socket.on('onlineUsers', (users: OnlineUser[]) => {
      setOnlineUsers(users);
    });
    
    this.socket.on('userOnline', (user: OnlineUser) => {
      setOnlineUsers([...[], user]); // Simplified - you'd maintain the list in the component
    });
    
    this.socket.on('userOffline', (user: OnlineUser) => {
      // Handle in component
    });

    this.socket.on('messageEdited', (message: Message) => {
      setMessages((prev) =>
        prev.map((msg) => msg._id === message._id ? message : msg)
      );
      
      // Update conversation list if this is the last message (for direct messages)
      if (message.receiver && this.onMessageEditedCallback) {
        this.onMessageEditedCallback(message);
      }
      
      // Update group list if this is the last message (for group messages)
      if (message.group && this.onGroupMessageEditedCallback) {
        this.onGroupMessageEditedCallback(message);
      }
    });

    this.socket.on('messageDeletedForMe', (message: Message) => {
      setMessages((prev) => {
        const updatedMessages = prev.map((msg) => msg._id === message._id ? message : msg);
        
        if (message.group && this.onGroupMessageReceivedCallback) {
          const groupId = typeof message.group === 'string' ? message.group : message.group._id;
          
          const groupMessages = updatedMessages
            .filter(msg => {
              const msgGroupId = typeof msg.group === 'string' ? msg.group : msg.group?._id;
              return msgGroupId === groupId;
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          const previousMessage = groupMessages.find(msg => !this.isMessageDeletedForUser(msg, this.currentUserId));
          
          if (previousMessage) {
            setTimeout(() => {
              this.onGroupMessageReceivedCallback?.(previousMessage, false);
            }, 0);
          }
        }
        
        return updatedMessages;
      });
      
      if (message.receiver && this.onMessageDeletedCallback) {
        this.onMessageDeletedCallback(message);
      }
    });

    this.socket.on('messageDeletedForEveryone', (message: Message) => {
      setMessages((prev) =>
        prev.map((msg) => msg._id === message._id ? message : msg)
      );
      
      if (message.receiver && this.onMessageDeletedCallback) {
        this.onMessageDeletedCallback(message);
      }
      
      if (message.group && this.onGroupMessageReceivedCallback) {
        this.onGroupMessageReceivedCallback(message, false);
      }
    });

    // Group messages
    this.socket.on('newMessage', (message: Message) => {
      if (message.group) {
        const messageGroupId = typeof message.group === 'string' ? message.group : message.group?._id;
        const isViewingThisGroupChat = this.selectedGroup && messageGroupId === this.selectedGroup._id;
        const isCurrentUserSender = message.sender._id === this.currentUserId;
        
        if (isViewingThisGroupChat && !isCurrentUserSender) {
          setMessages((prev) => {
            const messageExists = prev.some(msg => msg._id === message._id);
            if (messageExists) {
              return prev;
            }
            return [...prev, message];
          });
        }
        
        if (this.onGroupMessageReceivedCallback) {
          const isCurrentUserViewingThisSpecificGroup = this.selectedGroup && 
            this.selectedGroup._id === messageGroupId;
          const shouldIncrementUnread = !isCurrentUserViewingThisSpecificGroup && !isCurrentUserSender;
          
          this.onGroupMessageReceivedCallback(message, shouldIncrementUnread);
        }
      }
    });

    this.socket.on('groupCreated', (group: Group) => {
      if (this.onGroupCreatedCallback) {
        this.onGroupCreatedCallback(group);
      }
    });

    this.socket.on('memberRemovedFromGroup', (data: { groupId: string; message: Message; updatedGroup?: Group }) => {
      setMessages((prev) => [...prev, data.message]);
      
      if (this.onGroupMessageReceivedCallback) {
        this.onGroupMessageReceivedCallback(data.message, false);
      }
      
      if (data.updatedGroup && this.onGroupCreatedCallback) {
        this.onGroupCreatedCallback(data.updatedGroup);
      }
      
      // Call member removed callback for additional handling
      if (this.onMemberRemovedCallback) {
        this.onMemberRemovedCallback(data);
      }
    });

    this.socket.on('groupMemberRemoved', (data: { 
      groupId: string; 
      removedMemberId: string; 
      removedMemberUsername: string; 
      message: Message; 
      updatedGroup: Group 
    }) => {
      setMessages((prev) => [...prev, data.message]);
      
      if (this.onGroupMessageReceivedCallback) {
        this.onGroupMessageReceivedCallback(data.message, false);
      }
      
      // Call member removed callback for additional handling
      if (this.onMemberRemovedCallback) {
        this.onMemberRemovedCallback(data);
      }
    });

    this.socket.on('groupMemberLeft', (data: { 
      groupId: string; 
      leftMemberId: string; 
      leftMemberUsername: string; 
      message: Message 
    }) => {
      setMessages((prev) => [...prev, data.message]);
      
      if (this.onGroupMessageReceivedCallback) {
        this.onGroupMessageReceivedCallback(data.message, false);
      }
      
      // Call member left callback for additional handling
      if (this.onMemberLeftCallback) {
        this.onMemberLeftCallback(data);
      }
    });
  }

  private isMessageDeletedForUser(message: Message, userId?: string): boolean {
    if (!userId) return false;
    
    if (message.group) {
      if (message.sender._id === userId) {
        return message.deletedForSender || false;
      } else {
        return message.deletedForUsers && message.deletedForUsers.includes(userId) || false;
      }
    }
    
    if (message.sender._id === userId) {
      return message.deletedForSender || false;
    } else {
      return message.deletedForReceiver || false;
    }
  }

  setCallbacks(callbacks: {
    onMessagesRead?: (receiverId: string) => void;
    updateConversation?: (message: Message, shouldIncrementUnread?: boolean) => void;
    onMessageEdited?: (message: Message) => void;
    onMessageDeleted?: (message: Message) => void;
    onGroupMessageReceived?: (message: Message, shouldIncrementUnread?: boolean) => void;
    onGroupMessageEdited?: (message: Message) => void;
    onGroupMessageDeleted?: (message: Message) => void;
    onGroupCreated?: (group: Group) => void;
    onMemberRemoved?: (data: any) => void;
    onMemberLeft?: (data: any) => void;
  }): void {
    this.onMessagesReadCallback = callbacks.onMessagesRead;
    this.updateConversationCallback = callbacks.updateConversation;
    this.onMessageEditedCallback = callbacks.onMessageEdited;
    this.onMessageDeletedCallback = callbacks.onMessageDeleted;
    this.onGroupMessageReceivedCallback = callbacks.onGroupMessageReceived;
    this.onGroupMessageEditedCallback = callbacks.onGroupMessageEdited;
    this.onGroupMessageDeletedCallback = callbacks.onGroupMessageDeleted;
    this.onGroupCreatedCallback = callbacks.onGroupCreated;
    this.onMemberRemovedCallback = callbacks.onMemberRemoved;
    this.onMemberLeftCallback = callbacks.onMemberLeft;
  }

  setSelectedUser(user: User | null): void {
    this.selectedUser = user;
  }

  setSelectedGroup(group: Group | null): void {
    this.selectedGroup = group;
  }

  setCurrentUserId(userId: string | undefined): void {
    this.currentUserId = userId;
  }

  sendMessage(receiverId: string, text: string, messageType: 'text' | 'image' | 'video' = 'text'): void {
    if (this.socket) {
      this.socket.emit('sendMessage', { receiverId, text, messageType });
    }
  }

  sendGroupMessage(
    groupId: string,
    text: string,
    messageType: 'text' | 'image' | 'video' = 'text',
    imageData?: string,
    videoData?: string
  ): void {
    if (this.socket) {
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

  joinGroupChat(groupId: string): void {
    if (this.socket) {
      this.socket.emit('joinGroupChat', groupId);
    }
  }

  leaveGroupChat(groupId: string): void {
    if (this.socket) {
      this.socket.emit('leaveGroupChat', groupId);
    }
  }

  markGroupMessagesAsRead(groupId: string): void {
    if (this.socket) {
      this.socket.emit('markGroupMessagesAsRead', { groupId });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnectedSubject.next(false);
    }
  }
}