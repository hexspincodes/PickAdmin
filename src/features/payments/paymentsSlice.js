import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import * as paymentsAPI from './paymentsAPI';

export const fetchPayments = createAsyncThunk(
  'payments/fetch',
  async ({ page = 1, limit = 100, search = '' } = {}, { rejectWithValue }) => {
    try {
      const res = await paymentsAPI.getPayments(page, limit, search);
      return { list: res.data?.payments || [], count: res.data?.count || 0, page, limit, search };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

// Every payment (the list API has no page-size cap) for the period summary cards, which must
// cover all records rather than the page of the table that's loaded.
export const fetchAllPayments = createAsyncThunk('payments/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await paymentsAPI.getPayments(1, 100000, '');
    return res.data?.payments || [];
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const refetchAfterChange = (dispatch, getState) => {
  const { page, limit, search } = getState().payments;
  dispatch(fetchPayments({ page, limit, search }));
  dispatch(fetchAllPayments());
};

export const manualVerifyPayment = createAsyncThunk(
  'payments/manualVerify',
  async (user_id, { dispatch, getState, rejectWithValue }) => {
    try {
      const res = await paymentsAPI.manualVerifyPayment(user_id);
      toast.success(res.message || 'Payment verified');
      refetchAfterChange(dispatch, getState);
    } catch (err) {
      toast.error(err.message);
      return rejectWithValue(err.message);
    }
  },
);

export const updatePayment = createAsyncThunk(
  'payments/update',
  async ({ id, ...changes }, { dispatch, getState, rejectWithValue }) => {
    try {
      const res = await paymentsAPI.updatePayment(id, changes);
      toast.success(res.message || 'Payment updated');
      refetchAfterChange(dispatch, getState);
      return res.data?.payment;
    } catch (err) {
      toast.error(err.message);
      return rejectWithValue(err.message);
    }
  },
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: {
    items: [],
    count: 0,
    status: 'idle',
    error: null,
    page: 1,
    limit: 100,
    search: '',
    all: [],
    allStatus: 'idle',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.list;
        state.count = action.payload.count;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.search = action.payload.search;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchAllPayments.pending, (state) => {
        state.allStatus = 'loading';
      })
      .addCase(fetchAllPayments.fulfilled, (state, action) => {
        state.allStatus = 'succeeded';
        state.all = action.payload;
      })
      .addCase(fetchAllPayments.rejected, (state) => {
        state.allStatus = 'failed';
      });
  },
});

export default paymentsSlice.reducer;
