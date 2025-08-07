import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/client';
import { jwtDecode } from 'jwt-decode';

interface UserState {
  user: { id: number; email: string; role?: string } | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'user/login',
  async (data: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('username', data.email);
      params.append('password', data.password);
      const res = await api.post('/auth/login', params);
      // Decode user info from access_token
      const payload = jwtDecode(res.data.access_token);
      // You may need to adjust these field names based on your JWT payload
      return { ...payload, access_token: res.data.access_token };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'user/register',
  async (data: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/register', data);
      // Decode user info from access_token
      const payload = jwtDecode(res.data.access_token);
      return { ...payload, access_token: res.data.access_token };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Register failed');
    }
  }
);

export const fetchMe = createAsyncThunk(
  'user/fetchMe',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { user: UserState };
      const token = state.user.token;
      try {
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(res);
        return res.data;
      }
      catch(err:any) {
        console.log(err);
        if (err.response.status === 401) {
          return rejectWithValue('Unauthorized');
        }
      }
    } catch (err: any) {
      return rejectWithValue('Failed to fetch user info');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access_token;
        localStorage.setItem('token', action.payload.access_token);
        state.user = { id: action.payload.id, email: action.payload.email, role: action.payload.role };
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access_token;
        localStorage.setItem('token', action.payload.access_token);
        state.user = { id: action.payload.id, email: action.payload.email, role: action.payload.role };
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { id: action.payload.id, email: action.payload.email, role: action.payload.role };
        state.error = null;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.error = action.payload as string;
      });
  },
});

export const { logout } = userSlice.actions;
export default userSlice.reducer; 