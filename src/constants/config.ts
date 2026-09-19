export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, ''),
  isDemoMode: !process.env.EXPO_PUBLIC_API_URL,
};
