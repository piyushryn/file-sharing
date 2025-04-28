const baseURL = process.env.REACT_APP_API_URL || "http://localhost:9876/api";

export const getDownloadUrl = (fileId: string): string =>
  `${baseURL}/files/download/${fileId}`;
