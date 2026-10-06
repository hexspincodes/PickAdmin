import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as contactAPI from './contactAPI';

export const fetchContacts = createAsyncThunk('contact/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await contactAPI.getContacts();
    return res.data?.contacts || [];
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const contactSlice = createSlice({
  name: 'contact',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default contactSlice.reducer;
