const authMiddleware = ({ dispatch }) => (next) => (action) => {
  const result = next(action);

  // getAboutUser failed
  if (action.type === "user/getAbout/rejected") {
    const status = action.payload?.status;

    // Only logout for invalid/expired token
    if (status === 401 || status === 403) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }

      dispatch({
        type: "auth/reset",
      });
    }
  }

  return result;
};

export default authMiddleware;