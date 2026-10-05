import { configureStore } from "@reduxjs/toolkit";
import authReducer from './reducer/authReducer/index.js';
import postReducer from './reducer/postReducer/index.js';

const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postReducer
  },
});

export default store;
