import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./reducer/authReducer";
import postReducer from "./reducer/postReducer";
import authMiddleware from "./middleware/authMiddleware";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authMiddleware),
});