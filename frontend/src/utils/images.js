export const BASE_URL = "https://proconnect-ljsc.onrender.com";

// Builds a full image URL from a path stored in the database.
// Returns null for empty values and for the default placeholder picture.
export const getImageUrl = (filePath) => {
  if (!filePath || typeof filePath !== "string" || filePath.trim() === "" || filePath === "default.jpg") {
    return null;
  }
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  let cleanPath = filePath.trim();
  if (cleanPath.startsWith("/")) cleanPath = cleanPath.slice(1);

  return encodeURI(`${BASE_URL}/${cleanPath}`);
};