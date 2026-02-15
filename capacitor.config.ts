import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.crimsoncare.app',
  appName: 'CrimsonCare',
  webDir: 'public',
  server: {
    url: 'https://localhost:8080',
};
}

export default config;
