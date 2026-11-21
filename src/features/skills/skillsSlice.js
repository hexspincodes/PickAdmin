import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import * as skillsAPI from './skillsAPI';

export const fetchSkills = createAsyncThunk('skills/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await skillsAPI.getAllSkills();
    return res.data?.skills || [];
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createSkill = createAsyncThunk('skills/create', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const res = await skillsAPI.createSkill(payload);
    toast.success(res.message || 'Skill created');
    dispatch(fetchSkills());
    return res.data?.skill;
  } catch (err) {
    toast.error(err.message);
    return rejectWithValue(err.message);
  }
});

export const updateSkill = createAsyncThunk('skills/update', async ({ id, ...changes }, { dispatch, rejectWithValue }) => {
  try {
    const res = await skillsAPI.updateSkill(id, changes);
    toast.success(res.message || 'Skill updated');
    dispatch(fetchSkills());
    return res.data?.skill;
  } catch (err) {
    toast.error(err.message);
    return rejectWithValue(err.message);
  }
});

export const removeSkill = createAsyncThunk('skills/remove', async (id, { dispatch, rejectWithValue }) => {
  try {
    const res = await skillsAPI.deleteSkill(id);
    const maidsUsing = res.data?.maidsUsing || 0;
    toast.success(
      maidsUsing
        ? `Skill deleted. ${maidsUsing} maid profile${maidsUsing === 1 ? '' : 's'} still list it.`
        : 'Skill deleted',
    );
    dispatch(fetchSkills());
  } catch (err) {
    toast.error(err.message);
    return rejectWithValue(err.message);
  }
});

// ids: every skill's _id in the new order. The list reorders immediately; a failure reloads it.
export const reorderSkills = createAsyncThunk('skills/reorder', async (ids, { dispatch, rejectWithValue }) => {
  try {
    const res = await skillsAPI.reorderSkills(ids);
    return res.data?.skills || [];
  } catch (err) {
    toast.error(err.message);
    dispatch(fetchSkills());
    return rejectWithValue(err.message);
  }
});

export const resetSkillOrder = createAsyncThunk('skills/resetOrder', async (_, { rejectWithValue }) => {
  try {
    const res = await skillsAPI.resetSkillOrder();
    toast.success(res.message || 'Skills sorted A–Z');
    return res.data?.skills || [];
  } catch (err) {
    toast.error(err.message);
    return rejectWithValue(err.message);
  }
});

const skillsSlice = createSlice({
  name: 'skills',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSkills.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSkills.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchSkills.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(reorderSkills.pending, (state, action) => {
        const position = new Map(action.meta.arg.map((id, i) => [id, i]));
        state.items = [...state.items].sort((a, b) => position.get(a._id) - position.get(b._id));
      })
      .addCase(reorderSkills.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(resetSkillOrder.fulfilled, (state, action) => {
        state.items = action.payload;
      });
  },
});

export default skillsSlice.reducer;
