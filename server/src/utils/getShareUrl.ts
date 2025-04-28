export const getShareUrl = (fileId: string): string =>
  `${process.env.API_BASE_URL}/files/download/${fileId}`;
