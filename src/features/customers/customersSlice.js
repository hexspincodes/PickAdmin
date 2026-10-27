import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import * as customersAPI from './customersAPI';

// Backend1 nests the page under `customer`: { customer: { data: [...], count } }
export const readCustomersPage = (res) => {
  const payload = res.data?.customer;
  const list = Array.isArray(payload) ? payload : payload?.data || [];
  const count = (Array.isArray(payload) ? res.data?.count : payload?.count) || 0;
  return { list, count };
};

export const fetchCustomers = createAsyncThunk(
  'customers/fetch',
  async ({ page = 1, search = '' } = {}, { rejectWithValue }) => {
    try {
      const { list, count } = readCustomersPage(await customersAPI.getCustomers(page, search));
      return { list, count, page, search };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

// Every customer, for the status cards: the API has a fixed page size and no blocked filter,
// so read page 1 for the total and fetch the remaining pages in parallel.
export const fetchAllCustomers = createAsyncThunk('customers/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const first = readCustomersPage(await customersAPI.getCustomers(1, ''));
    const pages = Math.ceil(first.count / customersAPI.CUSTOMERS_PAGE_SIZE);
    const rest = await Promise.all(
      Array.from({ length: Math.max(0, pages - 1) }, (_, i) => customersAPI.getCustomers(i + 2, '').then(readCustomersPage)),
    );
    return [first, ...rest].flatMap((p) => p.list);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Just the total (page 1 carries it), for the top bar and dashboard — leaves the list state alone.
export const fetchCustomersTotal = createAsyncThunk('customers/fetchTotal', async (_, { rejectWithValue }) => {
  try {
    return readCustomersPage(await customersAPI.getCustomers(1, '')).count;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

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
      dispatch(fetchAllCustomers());
    } catch (err) {
      toast.error(err.message);
      return rejectWithValue(err.message);
    }
  },
);

const customersSlice = createSlice({
  name: 'customers',
  initialState: {
    items: [],
    count: 0,
    status: 'idle',
    error: null,
    page: 1,
    search: '',
    all: [],
    allStatus: 'idle',
    total: null,
    totalStatus: 'idle',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomersTotal.pending, (state) => {
        state.totalStatus = 'loading';
      })
      .addCase(fetchCustomersTotal.fulfilled, (state, action) => {
        state.totalStatus = 'succeeded';
        state.total = action.payload;
      })
      .addCase(fetchCustomersTotal.rejected, (state) => {
        state.totalStatus = 'failed';
      })
      .addCase(fetchCustomers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.list;
        state.count = action.payload.count;
        // An unsearched list's count is the overall total — keep the top bar in step.
        if (!action.payload.search) {
          state.total = action.payload.count;
          state.totalStatus = 'succeeded';
        }
        state.page = action.payload.page;
        state.search = action.payload.search;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchAllCustomers.pending, (state) => {
        state.allStatus = 'loading';
      })
      .addCase(fetchAllCustomers.fulfilled, (state, action) => {
        state.allStatus = 'succeeded';
        state.all = action.payload;
      })
      .addCase(fetchAllCustomers.rejected, (state) => {
        state.allStatus = 'failed';
      });
  },
});

export default customersSlice.reducer;
