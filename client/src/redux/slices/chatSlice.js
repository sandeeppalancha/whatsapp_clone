// client/src/redux/slices/chatSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import chatService from '../../services/chatService';

// Async thunks
export const fetchContacts = createAsyncThunk(
  'chat/fetchContacts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await chatService.getContacts();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch contacts' });
    }
  }
);

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await chatService.getConversations();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch conversations' });
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ conversationId, isGroup }, { rejectWithValue }) => {
    try {
      const response = await chatService.getMessages(conversationId, isGroup);
      return { conversationId, isGroup, messages: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch messages' });
    }
  }
);

export const markMessageAsReadAsync = createAsyncThunk(
  'chat/markMessageAsRead',
  async ({ messageId }, { rejectWithValue }) => {
    try {
      const response = await chatService.markMessageAsRead(messageId);
      return { messageId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to mark message as read' });
    }
  }
);

export const sendTypingIndicatorAsync = createAsyncThunk(
  'chat/sendTypingIndicator',
  async ({ conversationId, isGroup }, { rejectWithValue }) => {
    try {
      await chatService.sendTypingIndicator(conversationId, isGroup);
      return { conversationId, isGroup };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to send typing indicator' });
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    contacts: [],
    conversations: [],
    activeConversation: null,
    messages: {},
    typingUsers: {}, // { conversationId: { userId: timestamp } }
    isLoading: false,
    error: null,
  },
  reducers: {
    // Existing reducers
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },
    addMessage: (state, action) => {
      const { conversationId, isGroup, message } = action.payload;
      const key = `${isGroup ? 'group' : 'user'}_${conversationId}`;
      
      if (!state.messages[key]) {
        state.messages[key] = [];
      }
      
      // Check if message already exists
      const existingMessageIndex = state.messages[key].findIndex(
        msg => msg.id === message.id || msg.clientMessageId === message.clientMessageId
      );
      
      if (existingMessageIndex !== -1) {
        // Update existing message
        state.messages[key][existingMessageIndex] = {
          ...state.messages[key][existingMessageIndex],
          ...message,
          id: message.id || state.messages[key][existingMessageIndex].id
        };
      } else {
        // Add new message
        state.messages[key].push({
          ...message,
          clientMessageId: message.clientMessageId || message.id
        });
      }
      
      // Update last message in conversation list
      const conversationIndex = state.conversations.findIndex(
        conv => conv.id === parseInt(conversationId) && conv.isGroup === isGroup
      );
      
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].lastMessage = {
          content: message.content,
          senderId: message.senderId,
          timestamp: message.timestamp,
          attachments: message.attachments
        };
        
        // Move this conversation to the top
        const conversation = state.conversations[conversationIndex];
        state.conversations.splice(conversationIndex, 1);
        state.conversations.unshift(conversation);
      }
    },
    updateMessageStatus: (state, action) => {
      const { clientMessageId, messageId, status } = action.payload;
      
      // Update message status in appropriate conversation
      for (const key in state.messages) {
        const messageIndex = state.messages[key].findIndex(
          msg => msg.clientMessageId === clientMessageId || msg.id === messageId
        );
        
        if (messageIndex !== -1) {
          state.messages[key][messageIndex].status = status;
          
          // If server returned an ID, update it
          if (messageId) {
            state.messages[key][messageIndex].id = messageId;
          }
          
          break;
        }
      }
    },
    
    // New reducers
    markMessageAsRead: (state, action) => {
      const { messageId, readBy, readAt } = action.payload;
      
      // Find message in all conversations
      for (const key in state.messages) {
        const messageIndex = state.messages[key].findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1) {
          state.messages[key][messageIndex].isRead = true;
          state.messages[key][messageIndex].readAt = readAt;
          state.messages[key][messageIndex].readBy = readBy;
          state.messages[key][messageIndex].status = 'read';
          break;
        }
      }
    },
    
    updateUserStatus: (state, action) => {
      const { userId, isOnline, lastSeen } = action.payload;
      
      // Update user status in contacts
      const contactIndex = state.contacts.findIndex(contact => contact.id === userId);
      if (contactIndex !== -1) {
        state.contacts[contactIndex].isOnline = isOnline;
        if (lastSeen) {
          state.contacts[contactIndex].lastSeen = lastSeen;
        }
      }
      
      // Update user status in conversations
      state.conversations.forEach(conversation => {
        if (!conversation.isGroup && conversation.user && conversation.user.id === userId) {
          conversation.user.isOnline = isOnline;
          if (lastSeen) {
            conversation.user.lastSeen = lastSeen;
          }
        }
      });
    },
    
    updateTypingStatus: (state, action) => {
      const { userId, conversationId, isGroup, isTyping } = action.payload;
      const key = `${isGroup ? 'group' : 'user'}_${conversationId}`;
      
      if (!state.typingUsers[key]) {
        state.typingUsers[key] = {};
      }
      
      if (isTyping) {
        state.typingUsers[key][userId] = Date.now();
      } else {
        delete state.typingUsers[key][userId];
      }
    },
    
    clearTypingStatus: (state, action) => {
      const { conversationId, isGroup } = action.payload;
      const key = `${isGroup ? 'group' : 'user'}_${conversationId}`;
      
      state.typingUsers[key] = {};
    },
    
    addContact: (state, action) => {
      const contact = action.payload;
      const exists = state.contacts.some(c => c.id === contact.id);
      
      if (!exists) {
        state.contacts.push(contact);
      }
    },
    
    removeContact: (state, action) => {
      const contactId = action.payload;
      state.contacts = state.contacts.filter(contact => contact.id !== contactId);
    },
    
    addConversation: (state, action) => {
      const conversation = action.payload;
      const exists = state.conversations.some(c => 
        c.id === conversation.id && c.isGroup === conversation.isGroup
      );
      
      if (!exists) {
        state.conversations.unshift(conversation);
      }
    },
    
    removeConversation: (state, action) => {
      const { id, isGroup } = action.payload;
      state.conversations = state.conversations.filter(
        conversation => !(conversation.id === id && conversation.isGroup === isGroup)
      );
      
      // Also remove messages
      const key = `${isGroup ? 'group' : 'user'}_${id}`;
      delete state.messages[key];
      
      // Clear active conversation if it was this one
      if (state.activeConversation && 
          state.activeConversation.id === id && 
          state.activeConversation.isGroup === isGroup) {
        state.activeConversation = null;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.contacts = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { conversationId, isGroup, messages } = action.payload;
        const key = `${isGroup ? 'group' : 'user'}_${conversationId}`;
        state.messages[key] = messages;
        state.isLoading = false;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })
      .addCase(markMessageAsReadAsync.fulfilled, (state, action) => {
        const { messageId, readAt } = action.payload;
        
        // Find message in all conversations
        for (const key in state.messages) {
          const messageIndex = state.messages[key].findIndex(msg => msg.id === messageId);
          if (messageIndex !== -1) {
            state.messages[key][messageIndex].isRead = true;
            state.messages[key][messageIndex].readAt = readAt;
            break;
          }
        }
      });
  },
});

export const { 
  setActiveConversation, 
  addMessage, 
  updateMessageStatus,
  markMessageAsRead,
  updateUserStatus,
  updateTypingStatus,
  clearTypingStatus,
  addContact,
  removeContact,
  addConversation,
  removeConversation
} = chatSlice.actions;

export default chatSlice.reducer;