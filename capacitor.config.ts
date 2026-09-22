import type { CapacitorConfig } from "@capacitor/cli";

// Native release builds must load the bundled mobile app from `webDir`.
// A dev server is still supported, but only when it is explicitly requested.
const devServerUrl = process.env.CAPACITOR_DEV_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.sterlingmart.app",
  appName: "SterlingMart",
  webDir: "public",
  backgroundColor: "#2f1b10",
  loggingBehavior: "none",
  zoomEnabled: false,
  ios: {
    contentInset: "automatic",
    backgroundColor: "#2f1b10",
  },
  server: devServerUrl
    ? {
        url: devServerUrl,
        cleartext: devServerUrl.startsWith("http://"),
      }
    : undefined,
  plugins: {
    App: {
      disableBackButtonHandler: true,
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1400,
      launchFadeOutDuration: 250,
      backgroundColor: "#2f1b10",
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
      style: "DARK",
      backgroundColor: "#2f1b10",
    },
  },
};

export default config;
