import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import * as teamAPI from './teamAPI';

export const fetchTeam = createAsyncThunk('team/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await teamAPI.getTeamMembers();
    return res.data?.team || [];
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createTeamMember = createAsyncThunk('team/create', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const res = await teamAPI.createTeamMember(payload);
    toast.success(res.message || 'Team member created');
    dispatch(fetchTeam());
    return res;
  } catch (err) {
    toast.error(err.message);
    return rejectWithValue(err.message);
  }
});

export const removeTeamMember = createAsyncThunk('team/remove', async (id, { dispatch, rejectWithValue }) => {
  try {
    await teamAPI.deleteTeamMember(id);
    toast.success('Team member removed');
    dispatch(fetchTeam());
  } catch (err) {
    toast.error(err.message);
    return rejectWithValue(err.message);
  }
});

// The backend ignores any role payload here and just flips is_super_admin — see teamAPI.js.
export const toggleSuperAdmin = createAsyncThunk('team/toggleSuperAdmin', async (id, { dispatch, rejectWithValue }) => {
  try {
    await teamAPI.changeTeamMemberRole(id);
    toast.success('Super Admin status updated');
    dispatch(fetchTeam());
  } catch (err) {
    toast.error(err.message);
    return rejectWithValue(err.message);
  }
});

const teamSlice = createSlice({
  name: 'team',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeam.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTeam.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTeam.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default teamSlice.reducer;
