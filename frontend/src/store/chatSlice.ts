// src/store/chatSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../api/client';

export type MediaType = 'text' | 'image' | 'audio' | 'doc' | 'mixed';

export interface MediaItem {
  type: MediaType;
  url: string;
  filename?: string;
}

export interface ChatMessage {
  id?: string;
  from: 'user' | 'ai';
  text?: string;
  media?: MediaItem[];
  createdAt?: string;
}

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  loading: false,
  error: null,
};

export const fetchChatHistory = createAsyncThunk(
  'chat/fetchChatHistory',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/chat/history');
      // Map backend messages to ChatMessage format
      const messages: ChatMessage[] = [];
      
      res.data.forEach((msg: any) => {
        // Add user message
        if (msg.message) {
          messages.push({
            id: `${msg.id}-user`,
            from: 'user',
            text: msg.message,
            createdAt: msg.created_at,
          });
        }
        
        // Add AI response
        if (msg.response) {
          messages.push({
            id: `${msg.id}-ai`,
            from: 'ai',
            text: msg.response,
            createdAt: msg.created_at,
          });
        }
      });
      
      return messages;
    } catch (err: any) {
      return rejectWithValue('Failed to fetch chat history');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (payload: { text: string; files?: File[] }, { rejectWithValue }) => {
    try {
      const res = await api.post('/chat', { message: payload.text });
      return {
        text: res.data.text,
        media: res.data.media,
      };
    } catch (err: any) {
      return rejectWithValue('Failed to send message');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addUserMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },
    clearChat(state) {
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchChatHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push({ from: 'ai', ...action.payload });
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addUserMessage, clearChat } = chatSlice.actions;
export default chatSlice.reducer;