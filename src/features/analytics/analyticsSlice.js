import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as analyticsAPI from './analyticsAPI';

export const fetchCategoryAnalytics = createAsyncThunk(
  'analytics/fetch',
  async ({ from, to } = {}, { rejectWithValue }) => {
    try {
      const res = await analyticsAPI.getCategoryAnalytics(from, to);
      return Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategoryAnalytics.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCategoryAnalytics.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCategoryAnalytics.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default analyticsSlice.reducer;
