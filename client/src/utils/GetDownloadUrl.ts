const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const getDownloadUrl = (fileId: string): string =>
  `${baseURL}/files/download/${fileId}`;
