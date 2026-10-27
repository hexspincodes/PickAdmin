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

// The API has no read/unread flag, so "new" means received after this admin last opened
// Contact Messages. That time is kept per admin in this browser.
const lastSeenKey = (userId) => `pmm.contactLastSeen.${userId}`;
const FIRST_RUN_WINDOW = 7 * 24 * 60 * 60 * 1000;

export function readContactsLastSeen(userId) {
  try {
    const stored = Number(localStorage.getItem(lastSeenKey(userId)));
    if (stored) return stored;
  } catch {
    // storage unavailable — fall through
  }
  // Never opened on this browser: treat the last week as new rather than alerting on everything.
  return Date.now() - FIRST_RUN_WINDOW;
}

export function writeContactsLastSeen(userId, time) {
  try {
    localStorage.setItem(lastSeenKey(userId), String(time));
  } catch {
    // storage unavailable — the badge just won't survive a reload
  }
}

export const isNewContact = (contact, lastSeen) => new Date(contact.createdAt).getTime() > lastSeen;

const contactSlice = createSlice({
  name: 'contact',
  initialState: { items: [], status: 'idle', error: null, lastSeen: null },
  reducers: {
    setContactsLastSeen: (state, action) => {
      state.lastSeen = action.payload;
    },
  },
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

export const { setContactsLastSeen } = contactSlice.actions;
export default contactSlice.reducer;
