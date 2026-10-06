import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import teamReducer from '../features/team/teamSlice';
import customersReducer from '../features/customers/customersSlice';
import paymentsReducer from '../features/payments/paymentsSlice';
import maidsReducer from '../features/maids/maidsSlice';
import jobsReducer from '../features/jobs/jobsSlice';
import blogReducer from '../features/blog/blogSlice';
import contactReducer from '../features/contact/contactSlice';
import analyticsReducer from '../features/analytics/analyticsSlice';
import uiReducer from '../features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    team: teamReducer,
    customers: customersReducer,
    payments: paymentsReducer,
    maids: maidsReducer,
    jobs: jobsReducer,
    blog: blogReducer,
    contact: contactReducer,
    analytics: analyticsReducer,
    ui: uiReducer,
  },
});
