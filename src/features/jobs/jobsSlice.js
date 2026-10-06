import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import * as jobsAPI from './jobsAPI';

export const fetchJobListings = createAsyncThunk('jobs/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await jobsAPI.getJobListings();
    return res.data?.jobs || [];
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createJobListing = createAsyncThunk('jobs/create', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const res = await jobsAPI.createJobListing(payload);
    toast.success(res.message || 'Job listing created');
    dispatch(fetchJobListings());
    return res;
  } catch (err) {
    toast.error(err.message);
    return rejectWithValue(err.message);
  }
});

export const deleteJobListing = createAsyncThunk('jobs/delete', async (id, { dispatch, rejectWithValue }) => {
  try {
    await jobsAPI.deleteJobListing(id);
    toast.success('Job listing deleted');
    dispatch(fetchJobListings());
  } catch (err) {
    toast.error(err.message);
    return rejectWithValue(err.message);
  }
});

const jobsSlice = createSlice({
  name: 'jobs',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobListings.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchJobListings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchJobListings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default jobsSlice.reducer;
