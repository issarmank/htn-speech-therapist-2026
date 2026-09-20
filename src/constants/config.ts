/**
 * The backend runs on EC2. Set EXPO_PUBLIC_API_URL in `.env` (gitignored) to
 * its origin, e.g. `http://ec2-1-2-3-4.compute-1.amazonaws.com:8000`.
 *
 * With no URL set the app falls back to fixtures so the whole flow is still
 * reviewable — see src/features/api/fixture-client.ts.
 *
 * Plain HTTP needs `android.usesCleartextTraffic` and the iOS ATS exception,
 * both already in app.json. Without them a request fails as a bare
 * "Network request failed" with no further detail.
 */
export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, ''),
  isDemoMode: !process.env.EXPO_PUBLIC_API_URL,
};
