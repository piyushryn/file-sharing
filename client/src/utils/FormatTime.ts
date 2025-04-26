// Helper function to format remaining time
export const formatRemainingTime = (expiryDate: string): string => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Expired";
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 24) {
    const days = Math.floor(diffHours / 24);
    return `${days} day${days !== 1 ? "s" : ""} ${diffHours % 24} hr`;
  }

  return `${diffHours} hr ${diffMinutes} min`;
};
