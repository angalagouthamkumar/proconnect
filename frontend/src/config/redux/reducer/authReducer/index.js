import { createSlice } from "@reduxjs/toolkit";
import {
  loginUser,
  registerUser,
  getAboutUser,
  getAllUsers
} from "../../action/authAction";

const initialState = {
  user: null,
  isError: false,
  isSuccess: false,
  LoggedIn: false,
  message: null,
  isToken: false,
  profileFetched: false,
  connections: [],
  connectionRequests: [],
  token: null,
  loading: false,
  allProfiles: [],
  postid: null
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    reset: () => initialState,

    handleLoginUser: (state) => {
      state.message = {
        text: "Login successful",
        type: "success"
      };
    },

    emptyMessage: (state) => {
      state.message = null;
    },

    setTokenIsThere: (state) => {
      state.isToken = true;
    },

    setTokenIsNotThere: (state) => {
      state.isToken = false;
    },

    resetpostid: (state) => {
      state.postid = null;
    }
  },

  extraReducers: (builder) => {
    builder
      // LOGIN CASES
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.isError = false;
        state.message = {
          text: "Logging in...",
          type: "info"
        };
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isError = false;
        state.isSuccess = true;
        state.profileFetched = true;
        state.LoggedIn = true;
        state.token = action.payload?.token || null;

        state.message = {
          text: action.payload?.message || "Login successful",
          type: "success"
        };
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload || {
          text: "Login failed",
          type: "error"
        };
      })

      // REGISTER CASES
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.isError = false;
        state.message = {
          text: "Registering...",
          type: "info"
        };
      })

      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isError = false;
        state.isSuccess = true;
        state.LoggedIn = true;
        state.profileFetched = true;
        state.token = action.payload?.token || null;

        state.message = {
          text: action.payload?.message || "Registration successful",
          type: "success"
        };
      })

      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload || {
          text: "Registration failed",
          type: "error"
        };
      })

      // GET ABOUT USER CASES
      .addCase(getAboutUser.pending, (state) => {
        state.loading = true;
      })

      .addCase(getAboutUser.fulfilled, (state, action) => {
        state.loading = false;
        state.profileFetched = true;
        state.user = action.payload.user;
      })

      .addCase(getAboutUser.rejected, (state) => {
        state.loading = false;
        state.isError = true;
      })

      // GET ALL USERS CASES
      .addCase(getAllUsers.pending, (state) => {
        state.loading = true;
      })

      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.allProfiles = action.payload.users || action.payload.profiles || action.payload || [];
        state.connections = action.payload.connections || [];
        state.connectionRequests = action.payload.profile || [];
      })

      .addCase(getAllUsers.rejected, (state) => {
        state.loading = false;
        state.isError = true;
      });
  }
});

export const {
  reset,
  handleLoginUser,
  emptyMessage,
  setTokenIsThere,
  setTokenIsNotThere,
  resetpostid
} = authSlice.actions;

export default authSlice.reducer;