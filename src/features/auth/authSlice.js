import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';
import { loginAdmin, logoutAdmin } from './authAPI';
import { getToken, setToken, clearSession } from '../../utils/tokenStorage';

function decodeUser(token) {
  if (!token) return null;
  try {
    const payload = jwtDecode(token);
    // Payload shape set by Backend2's generateJWT({ user_id, role }) — see
    // Backend2/src/services/auth.service.js adminLoginService.
    return { user_id: payload.user_id, role: payload.role, exp: payload.exp };
  } catch {
    return null;
  }
}

const initialToken = getToken();
const initialUser = decodeUser(initialToken);
const isExpired = initialUser && initialUser.exp * 1000 < Date.now();

const initialState = {
  token: isExpired ? null : initialToken,
  user: isExpired ? null : initialUser,
  status: 'idle',
  error: null,
};

if (isExpired) clearSession();

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await loginAdmin(email, password);
    return res.data.token;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await logoutAdmin();
  } catch {
    // Even if the server call fails, clear the local session below.
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload;
        state.user = decodeUser(action.payload);
        setToken(action.payload);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.status = 'idle';
        clearSession();
      });
  },
});

export default authSlice.reducer;
