import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import * as couponsAPI from './couponsAPI';

export const fetchCoupons = createAsyncThunk('coupons/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await couponsAPI.getCoupons();
    return res.data?.coupons || [];
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createCoupon = createAsyncThunk('coupons/create', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const res = await couponsAPI.createCoupon(payload);
    toast.success(res.message || 'Coupon created');
    dispatch(fetchCoupons());
    return res.data?.coupon;
  } catch (err) {
    toast.error(err.message);
    return rejectWithValue(err.message);
  }
});

export const updateCoupon = createAsyncThunk('coupons/update', async ({ id, ...changes }, { dispatch, rejectWithValue }) => {
  try {
    const res = await couponsAPI.updateCoupon(id, changes);
    toast.success(res.message || 'Coupon updated');
    dispatch(fetchCoupons());
    return res.data?.coupon;
  } catch (err) {
    toast.error(err.message);
    return rejectWithValue(err.message);
  }
});

export const removeCoupon = createAsyncThunk('coupons/remove', async (id, { dispatch, rejectWithValue }) => {
  try {
    await couponsAPI.deleteCoupon(id);
    toast.success('Coupon deleted');
    dispatch(fetchCoupons());
  } catch (err) {
    toast.error(err.message);
    return rejectWithValue(err.message);
  }
});

const couponsSlice = createSlice({
  name: 'coupons',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoupons.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default couponsSlice.reducer;
