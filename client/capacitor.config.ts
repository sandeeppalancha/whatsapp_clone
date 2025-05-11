// client/capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fyzks.synapse',
  appName: 'Synapse',
  webDir: 'build',
  // bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  // server: {
  //   // For development only - use capacitor.config.json for production
  //   url: "http://192.168.1.100:3000", // Update with your local IP when testing
  //   cleartext: true,
  // },
};

export default config;