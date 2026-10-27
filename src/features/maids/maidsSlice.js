import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import * as maidsAPI from './maidsAPI';

// GET /job/ returns every pending (status 0) maid, unpaginated and unsearched.
const loadPendingMaids = async () => {
  const res = await maidsAPI.getPendingMaids();
  return res.data?.jobApplication || [];
};

const SEARCH_FIELDS = ['name', 'email', 'ref_number', 'mobile', 'uae_no'];
const matchesSearch = (maid, search) => {
  const term = search.trim().toLowerCase();
  return !term || SEARCH_FIELDS.some((k) => maid[k] != null && String(maid[k]).toLowerCase().includes(term));
};

export const fetchMaids = createAsyncThunk(
  'maids/fetch',
  async ({ page = 1, limit = 100, search = '', filter = '' } = {}, { rejectWithValue }) => {
    try {
      // No backend filter for pending/disabled. /job/all caps limit at 100, so the pending list comes
      // from /job/ (searched and paged here).
      if (filter === 'pending') {
        const matching = (await loadPendingMaids()).filter((m) => matchesSearch(m, search));
        const list = matching.slice((page - 1) * limit, page * limit);
        return { list, count: matching.length, page, limit, search, filter };
      }
      // 'unapproved' is disabled (3) maids followed by pending (0) ones, so its pages are the disabled
      // list, with pending rows dropped from the last page and from the count.
      if (filter === 'disabled') {
        const [res, pending] = await Promise.all([maidsAPI.getAllMaids(page, limit, search, 'unapproved'), loadPendingMaids()]);
        const list = (res.data?.jobApplication || []).filter((m) => m.status === 3);
        const pendingCount = pending.filter((m) => matchesSearch(m, search)).length;
        return { list, count: Math.max((res.data?.count || 0) - pendingCount, 0), page, limit, search, filter };
      }
      const res = await maidsAPI.getAllMaids(page, limit, search, filter);
      return { list: res.data?.jobApplication || [], count: res.data?.count || 0, page, limit, search, filter };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

// The counts endpoint has no status breakdown, so derive it from the list endpoint's `count`.
// There is no 'disabled' filter: 'unapproved' holds only pending (0) and disabled (3) maids, so
// disabled is the unapproved count minus the pending list.
export const fetchMaidStatusCounts = createAsyncThunk('maids/fetchStatusCounts', async (_, { rejectWithValue }) => {
  try {
    const [all, approved, hired, unapproved, pendingList] = await Promise.all([
      maidsAPI.getAllMaids(1, 1, '', ''),
      maidsAPI.getAllMaids(1, 1, '', 'approved'),
      maidsAPI.getAllMaids(1, 1, '', 'hired'),
      maidsAPI.getAllMaids(1, 1, '', 'unapproved'),
      loadPendingMaids(),
    ]);
    const total = all.data?.count || 0;
    const hiredCount = hired.data?.count || 0;
    const pending = pendingList.length;
    return {
      total,
      approved: approved.data?.count || 0,
      pending,
      disabled: Math.max((unapproved.data?.count || 0) - pending, 0),
      hired: hiredCount,
      available: total - hiredCount,
    };
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchPendingMaids = createAsyncThunk('maids/fetchPending', async (_, { rejectWithValue }) => {
  try {
    return await loadPendingMaids();
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
    refetchAfterAction(dispatch, getState);
  } catch (err) {
    toast.error(err.message);
    return rejectWithValue(err.message);
  }
});

function refetchAfterAction(dispatch, getState) {
  const { page, limit, search, filter } = getState().maids;
  dispatch(fetchMaids({ page, limit, search, filter }));
  dispatch(fetchMaidStatusCounts());
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
    countsStatus: 'idle',
    statusCounts: null,
    current: null,
    currentStatus: 'idle',
    history: [],
    historyStatus: 'idle',
  },
  reducers: {
    clearCurrentMaid: (state) => {
      state.current = null;
      state.history = [];
    },
    clearMaidHistory: (state) => {
      state.history = [];
      state.historyStatus = 'idle';
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
      .addCase(fetchMaidCounts.pending, (state) => {
        state.countsStatus = 'loading';
      })
      .addCase(fetchMaidCounts.fulfilled, (state, action) => {
        state.countsStatus = 'succeeded';
        state.counts = action.payload;
      })
      .addCase(fetchMaidCounts.rejected, (state) => {
        state.countsStatus = 'failed';
      })
      .addCase(fetchMaidStatusCounts.fulfilled, (state, action) => {
        state.statusCounts = action.payload;
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
      .addCase(fetchMaidHistory.pending, (state) => {
        state.historyStatus = 'loading';
      })
      .addCase(fetchMaidHistory.fulfilled, (state, action) => {
        state.historyStatus = 'succeeded';
        state.history = action.payload;
      })
      .addCase(fetchMaidHistory.rejected, (state) => {
        state.historyStatus = 'failed';
      });
  },
});

export const { clearCurrentMaid, clearMaidHistory } = maidsSlice.actions;
export default maidsSlice.reducer;
