import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.adausta.app',
  appName: 'Adausta',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'adausta.com',
    cleartext: false,
  },
  android: {
    minWebViewVersion: 55,
    backgroundColor: '#ffffff',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1e40af',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    Geolocation: {
      requestPermissions: true,
    },
  },
};

export default config;
