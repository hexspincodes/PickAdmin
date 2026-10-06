import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import * as maidsAPI from './maidsAPI';

export const fetchMaids = createAsyncThunk(
  'maids/fetch',
  async ({ page = 1, limit = 100, search = '', filter = '' } = {}, { rejectWithValue }) => {
    try {
      const res = await maidsAPI.getAllMaids(page, limit, search, filter);
      return { list: res.data?.jobApplication || [], count: res.data?.count || 0, page, limit, search, filter };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchPendingMaids = createAsyncThunk('maids/fetchPending', async (_, { rejectWithValue }) => {
  try {
    const res = await maidsAPI.getPendingMaids();
    return res.data?.jobApplication || [];
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchMaidCounts = createAsyncThunk('maids/fetchCounts', async (_, { rejectWithValue }) => {
  try {
    const res = await maidsAPI.getMaidCounts();
    // A backend bug puts the real payload under `message` instead of `data` here — read either.
    return res.data ?? res.message ?? null;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchMaidDashboard = createAsyncThunk('maids/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await maidsAPI.getMaidDashboard(id);
    return res.data?.jobApplication || null;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchMaidHistory = createAsyncThunk('maids/fetchHistory', async (maidId, { rejectWithValue }) => {
  try {
    const res = await maidsAPI.getMaidHistory(maidId);
    return res.data || [];
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createMaid = createAsyncThunk('maids/create', async (fields, { dispatch, rejectWithValue }) => {
  try {
    const res = await maidsAPI.createMaid(fields);
    toast.success(res.message || 'Maid application created');
    dispatch(fetchMaids());
    return res;
  } catch (err) {
    toast.error(err.message);
    return rejectWithValue(err.message);
  }
});

export const updateMaid = createAsyncThunk('maids/update', async (fields, { rejectWithValue }) => {
  try {
    const res = await maidsAPI.updateMaid(fields);
    toast.success(res.message || 'Maid application updated');
    return res;
  } catch (err) {
    toast.error(err.message);
    return rejectWithValue(err.message);
  }
});

export const deleteMaid = createAsyncThunk('maids/delete', async (id, { dispatch, getState, rejectWithValue }) => {
  try {
    await maidsAPI.deleteMaid(id);
    toast.success('Maid application deleted');
    const { page, limit, search, filter } = getState().maids;
    dispatch(fetchMaids({ page, limit, search, filter }));
  } catch (err) {
    toast.error(err.message);
    return rejectWithValue(err.message);
  }
});

function refetchAfterAction(dispatch, getState) {
  const { page, limit, search, filter } = getState().maids;
  dispatch(fetchMaids({ page, limit, search, filter }));
}

export const setMaidVerified = createAsyncThunk(
  'maids/setVerified',
  async ({ id, verified }, { dispatch, getState, rejectWithValue }) => {
    try {
      await maidsAPI.setMaidVerified(id, verified);
      toast.success(verified ? 'Application verified' : 'Verification removed');
      refetchAfterAction(dispatch, getState);
    } catch (err) {
      toast.error(err.message);
      return rejectWithValue(err.message);
    }
  },
);

export const setMaidDisabled = createAsyncThunk(
  'maids/setDisabled',
  async ({ id, disabled }, { dispatch, getState, rejectWithValue }) => {
    try {
      await maidsAPI.setMaidDisabled(id, disabled);
      toast.success(disabled ? 'Profile disabled' : 'Profile enabled');
      refetchAfterAction(dispatch, getState);
    } catch (err) {
      toast.error(err.message);
      return rejectWithValue(err.message);
    }
  },
);

export const setMaidAvailability = createAsyncThunk(
  'maids/setAvailability',
  async ({ id, available }, { dispatch, getState, rejectWithValue }) => {
    try {
      await maidsAPI.setMaidAvailability(id, available);
      toast.success('Availability updated');
      refetchAfterAction(dispatch, getState);
    } catch (err) {
      toast.error(err.message);
      return rejectWithValue(err.message);
    }
  },
);

export const setMaidAssured = createAsyncThunk(
  'maids/setAssured',
  async ({ id, assured }, { dispatch, getState, rejectWithValue }) => {
    try {
      await maidsAPI.setMaidAssured(id, assured);
      toast.success(assured ? 'Marked as assured' : 'Assured badge removed');
      refetchAfterAction(dispatch, getState);
    } catch (err) {
      toast.error(err.message);
      return rejectWithValue(err.message);
    }
  },
);

const maidsSlice = createSlice({
  name: 'maids',
  initialState: {
    items: [],
    count: 0,
    status: 'idle',
    error: null,
    page: 1,
    limit: 100,
    search: '',
    filter: '',
    pending: [],
    counts: null,
    current: null,
    currentStatus: 'idle',
    history: [],
  },
  reducers: {
    clearCurrentMaid: (state) => {
      state.current = null;
      state.history = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaids.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMaids.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.list;
        state.count = action.payload.count;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.search = action.payload.search;
        state.filter = action.payload.filter;
      })
      .addCase(fetchMaids.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchPendingMaids.fulfilled, (state, action) => {
        state.pending = action.payload;
      })
      .addCase(fetchMaidCounts.fulfilled, (state, action) => {
        state.counts = action.payload;
      })
      .addCase(fetchMaidDashboard.pending, (state) => {
        state.currentStatus = 'loading';
      })
      .addCase(fetchMaidDashboard.fulfilled, (state, action) => {
        state.currentStatus = 'succeeded';
        state.current = action.payload;
      })
      .addCase(fetchMaidDashboard.rejected, (state, action) => {
        state.currentStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchMaidHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      });
  },
});

export const { clearCurrentMaid } = maidsSlice.actions;
export default maidsSlice.reducer;
