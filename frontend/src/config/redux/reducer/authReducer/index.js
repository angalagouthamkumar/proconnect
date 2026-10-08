import { createSlice } from "@reduxjs/toolkit";

import {
  loginUser,
  registerUser,
  getAboutUser,
  getAllUsers,
  getMyConnectionRequests,
  getMyConnections,
  acceptConnectionRequest,
  rejectConnectionRequest
} from "../../action/authAction";

const initialState = {
  user: null,
  Profile: null,
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
  postid: null,
  sessionExpired: false
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
    },
    sessionExpired: (state) => {
      state.user = null;
      state.token = null;
      state.isToken = false;
      state.LoggedIn = false;
      state.profileFetched = false;
      state.sessionExpired = true;
      state.loading = false;
    }
  },

  extraReducers: (builder) => {
    builder

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
        state.isToken = true;
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
        state.isToken = true;
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


      .addCase(getAboutUser.pending, (state) => {
        state.loading = true;
      })

      .addCase(getAboutUser.fulfilled, (state, action) => {
        state.loading = false;
        state.profileFetched = true;
        state.user = action.payload?.user || null;
        state.profile = action.payload?.profile || null;
      })

      .addCase(getAboutUser.rejected, (state) => {
        state.loading = false;
        state.isError = true;
      })


      .addCase(getAllUsers.pending, (state) => {
        state.loading = true;
        state.isError = false;
      })

      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.loading = false;

        state.allProfiles =
          action.payload?.users ||
          action.payload?.profiles ||
          [];

        state.connections =
          action.payload?.connections || [];

        state.connectionRequests =
          action.payload?.connectionRequests || [];
      })

      .addCase(getAllUsers.rejected, (state) => {
        state.loading = false;
        state.isError = true;
      })


      .addCase(getMyConnectionRequests.pending, (state) => {
        state.loading = true;
        state.isError = false;
      })

      .addCase(getMyConnectionRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.isError = false;

        state.connectionRequests =
          action.payload?.connectionRequests ||
          action.payload?.requests ||
          action.payload ||
          [];
      })

      .addCase(getMyConnectionRequests.rejected, (state, action) => {
        state.loading = false;
        state.isError = true;

        state.message = action.payload || {
          text: "Failed to fetch connection requests",
          type: "error"
        };
      })


      .addCase(getMyConnections.pending, (state) => {
        state.loading = true;
        state.isError = false;
      })

      .addCase(getMyConnections.fulfilled, (state, action) => {
        state.loading = false;
        state.isError = false;

        state.connections =
          action.payload?.connections ||
          action.payload ||
          [];
      })

      .addCase(getMyConnections.rejected, (state, action) => {
        state.loading = false;
        state.isError = true;

        state.message = action.payload || {
          text: "Failed to fetch connections",
          type: "error"
        };
      })


      .addCase(acceptConnectionRequest.pending, (state) => {
        state.loading = true;
      })

      .addCase(acceptConnectionRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.isError = false;

        state.message = {
          text:
            action.payload?.message ||
            "Connection request accepted",
          type: "success"
        };
      })

      .addCase(acceptConnectionRequest.rejected, (state, action) => {
        state.loading = false;
        state.isError = true;

        state.message = action.payload || {
          text: "Failed to accept connection request",
          type: "error"
        };
      })


      .addCase(rejectConnectionRequest.pending, (state) => {
        state.loading = true;
      })

      .addCase(rejectConnectionRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.isError = false;

        state.message = {
          text:
            action.payload?.message ||
            "Connection request rejected",
          type: "success"
        };
      })

      .addCase(rejectConnectionRequest.rejected, (state, action) => {
        state.loading = false;
        state.isError = true;

        state.message = action.payload || {
          text: "Failed to reject connection request",
          type: "error"
        };
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