import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  // sidebarOpen: mobile drawer. sidebarCollapsed: desktop icon-only rail — always starts expanded.
  initialState: { sidebarOpen: false, sidebarCollapsed: false },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    closeSidebar: (state) => {
      state.sidebarOpen = false;
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

export const { toggleSidebar, closeSidebar, toggleSidebarCollapsed } = uiSlice.actions;
export default uiSlice.reducer;
