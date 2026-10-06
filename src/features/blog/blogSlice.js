import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import * as blogAPI from './blogAPI';

export const fetchAdminBlogs = createAsyncThunk('blog/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await blogAPI.getAdminBlogs();
    return res.data?.blogs || [];
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createBlog = createAsyncThunk('blog/create', async (fields, { dispatch, rejectWithValue }) => {
  try {
    const res = await blogAPI.createBlog(fields);
    toast.success(res.message || 'Blog post created');
    dispatch(fetchAdminBlogs());
    return res;
  } catch (err) {
    toast.error(err.message);
    return rejectWithValue(err.message);
  }
});

export const editBlog = createAsyncThunk('blog/edit', async ({ id, fields }, { dispatch, rejectWithValue }) => {
  try {
    const res = await blogAPI.editBlog(id, fields);
    toast.success(res.message || 'Blog post updated');
    dispatch(fetchAdminBlogs());
    return res;
  } catch (err) {
    toast.error(err.message);
    return rejectWithValue(err.message);
  }
});

export const deleteBlog = createAsyncThunk('blog/delete', async (id, { dispatch, rejectWithValue }) => {
  try {
    const res = await blogAPI.deleteBlog(id);
    toast.success(res.message || 'Blog post deleted');
    dispatch(fetchAdminBlogs());
  } catch (err) {
    toast.error(err.message);
    return rejectWithValue(err.message);
  }
});

export const deleteBlogComment = createAsyncThunk(
  'blog/deleteComment',
  async ({ slug, comment_id }, { rejectWithValue }) => {
    try {
      const res = await blogAPI.deleteBlogComment(slug, comment_id);
      toast.success(res.message || 'Comment deleted');
      return { slug, comment_id };
    } catch (err) {
      toast.error(err.message);
      return rejectWithValue(err.message);
    }
  },
);

const blogSlice = createSlice({
  name: 'blog',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminBlogs.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAdminBlogs.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchAdminBlogs.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default blogSlice.reducer;
