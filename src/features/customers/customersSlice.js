import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import * as customersAPI from './customersAPI';

export const fetchCustomers = createAsyncThunk(
  'customers/fetch',
  async ({ page = 1, search = '' } = {}, { rejectWithValue }) => {
    try {
      const res = await customersAPI.getCustomers(page, search);
      // Backend1 nests the page under `customer`: { customer: { data: [...], count } }
      const payload = res.data?.customer;
      const list = Array.isArray(payload) ? payload : payload?.data || [];
      const count = (Array.isArray(payload) ? res.data?.count : payload?.count) || 0;
      return { list, count, page, search };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const resetCustomerPassword = createAsyncThunk(
  'customers/resetPassword',
  async ({ user_id, password }, { rejectWithValue }) => {
    try {
      const res = await customersAPI.updateCustomerPassword(user_id, password);
      toast.success(res.message || 'Password updated');
      return res.data?.password;
    } catch (err) {
      toast.error(err.message);
      return rejectWithValue(err.message);
    }
  },
);

export const toggleCustomerBlock = createAsyncThunk(
  'customers/toggleBlock',
  async (user_id, { dispatch, getState, rejectWithValue }) => {
    try {
      const res = await customersAPI.toggleUserBlock(user_id);
      toast.success(res.message || 'Status updated');
      const { page, search } = getState().customers;
      dispatch(fetchCustomers({ page, search }));
    } catch (err) {
      toast.error(err.message);
      return rejectWithValue(err.message);
    }
  },
);

export const verifyCustomerPayment = createAsyncThunk(
  'customers/verifyPayment',
  async ({ user_id, transRef }, { rejectWithValue }) => {
    try {
      const res = await customersAPI.verifyCustomerPayment(user_id, transRef);
      toast.success(res.message || 'Payment verified');
      return res;
    } catch (err) {
      toast.error(err.message);
      return rejectWithValue(err.message);
    }
  },
);

const customersSlice = createSlice({
  name: 'customers',
  initialState: { items: [], count: 0, status: 'idle', error: null, page: 1, search: '' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.list;
        state.count = action.payload.count;
        state.page = action.payload.page;
        state.search = action.payload.search;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default customersSlice.reducer;
