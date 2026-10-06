import { createAsyncThunk } from "@reduxjs/toolkit";
import clientServer from "../clientServer";

export const loginUser = createAsyncThunk("user/login", async (user, ThunkAPI) => {
  try {
    const response = await clientServer.post("user/login", {
      email: user.email,
      password: user.password
    });
    
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      // Fetch user profile immediately after token is stored
      await ThunkAPI.dispatch(getAboutUser({ token: response.data.token }));
    }
    
    return response.data;
  } catch (error) {
    const errorText = error.response?.data?.message || error.message || "Login failed";
    return ThunkAPI.rejectWithValue({
      text: typeof errorText === "object" ? errorText.message || JSON.stringify(errorText) : errorText,
      type: "error"
    });
  }
});

export const registerUser = createAsyncThunk("user/register", async (user, ThunkAPI) => {
  try {
    const response = await clientServer.post("user/register", {
      username: user.username,
      name: user.name,
      email: user.email,
      password: user.password
    });

    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      // Fetch user details into Redux immediately
      await ThunkAPI.dispatch(getAboutUser({ token: response.data.token }));
    }
    return response.data;
  } catch (error) {
    const errorText = error.response?.data?.message || error.message || "Registration failed";
    return ThunkAPI.rejectWithValue({
      text: typeof errorText === "object" ? errorText.message || JSON.stringify(errorText) : errorText,
      type: "error"
    });
  }
});
export const getAboutUser = createAsyncThunk("user/getAbout", async (user, ThunkAPI) => {
  try {
    // FIXED: Changed /users to /user
    const response = await clientServer.get(`/user/get_user_and_profile`, { params: { token: user.token } });
    return ThunkAPI.fulfillWithValue(response.data);
  } catch (error) {
    const errorText = error.response?.data?.message || error.message || "Failed to fetch about user";
    return ThunkAPI.rejectWithValue({
      text: typeof errorText === "object" ? errorText.message || JSON.stringify(errorText) : errorText,
      type: "error"
    });
  }
});

export const getAllUsers = createAsyncThunk("user/getAll", async (user, ThunkAPI) => {
  try {
    const response = await clientServer.get('/user/get_all_users', { 
      params: { token: user.token } 
    });
    console.log("getAllUsers Backend Data:", response.data);
    return ThunkAPI.fulfillWithValue(response.data);
  } catch (error) {
    const errorText = error.response?.data?.message || error.message || "Failed to fetch all users";
    return ThunkAPI.rejectWithValue({
      text: typeof errorText === "object" ? errorText.message || JSON.stringify(errorText) : errorText,
      type: "error"
    });
  }
});

export const getUserProfileByUsername = createAsyncThunk(
  "user/getProfileByUsername",
  async ({ username, token }, ThunkAPI) => {
    try {
      const response = await clientServer.get(
        "/user/get_user_profile_based_on_username",
        {
          params: {
            username,
            token
          }
        }
      );

      return ThunkAPI.fulfillWithValue(response.data);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "User profile not found";

      return ThunkAPI.rejectWithValue(errorMsg);
    }
  }
);

export const sendConnectionRequest = createAsyncThunk(
  "user/sendConnectionRequest",
  async ({ token, connectionId }, ThunkAPI) => {
    try {
      const response = await clientServer.post(
        "/user/send_connection_request",
        {
          token,
          connectionId
        }
      );

      return ThunkAPI.fulfillWithValue(response.data);
    } catch (error) {
      const errorText =
        error.response?.data?.message ||
        error.message ||
        "Failed to send connection request";

      return ThunkAPI.rejectWithValue({
        text:
          typeof errorText === "object"
            ? errorText.message || JSON.stringify(errorText)
            : errorText,
        type: "error"
      });
    }
  }
);

export const getMyConnectionRequests = createAsyncThunk(
  "user/getMyConnectionRequests",
  async ({ token }, ThunkAPI) => {
    try {
      const response = await clientServer.get(
        "/user/get_my_connections",
        {
          params: {
            token
          }
        }
      );

      return ThunkAPI.fulfillWithValue(response.data);
    } catch (error) {
      const errorText =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch connection requests";

      return ThunkAPI.rejectWithValue({
        text:
          typeof errorText === "object"
            ? errorText.message || JSON.stringify(errorText)
            : errorText,
        type: "error"
      });
    }
  }
);

export const getMyConnections = createAsyncThunk(
  "user/getMyConnections",
  async ({ token }, ThunkAPI) => {
    try {
      const response = await clientServer.get(
        "/user/what_are_my_connections",
        {
          params: {
            token
          }
        }
      );

      return ThunkAPI.fulfillWithValue(response.data);
    } catch (error) {
      const errorText =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch connections";

      return ThunkAPI.rejectWithValue({
        text:
          typeof errorText === "object"
            ? errorText.message || JSON.stringify(errorText)
            : errorText,
        type: "error"
      });
    }
  }
);

export const acceptConnectionRequest = createAsyncThunk(
  "user/acceptConnectionRequest",
  async ({ token, requestId }, ThunkAPI) => {
    try {
      const response = await clientServer.post(
        "/user/accept_connection_request",
        {
          token,
          requestId
        }
      );

      return ThunkAPI.fulfillWithValue(response.data);
    } catch (error) {
      const errorText =
        error.response?.data?.message ||
        error.message ||
        "Failed to accept connection request";

      return ThunkAPI.rejectWithValue({
        text:
          typeof errorText === "object"
            ? errorText.message || JSON.stringify(errorText)
            : errorText,
        type: "error"
      });
    }
  }
);

export const rejectConnectionRequest = createAsyncThunk(
  "user/rejectConnectionRequest",
  async ({ token, requestId }, ThunkAPI) => {
    try {
      const response = await clientServer.post(
        "/user/reject_connection_request",
        {
          token,
          requestId
        }
      );

      return ThunkAPI.fulfillWithValue(response.data);
    } catch (error) {
      const errorText =
        error.response?.data?.message ||
        error.message ||
        "Failed to reject connection request";

      return ThunkAPI.rejectWithValue({
        text:
          typeof errorText === "object"
            ? errorText.message || JSON.stringify(errorText)
            : errorText,
        type: "error"
      });
    }
  }
);