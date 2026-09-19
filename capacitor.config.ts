import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAPACITOR_SERVER_URL ?? process.env.NEXT_PUBLIC_SITE_URL;

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
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith("http://"),
      }
    : undefined,
  plugins: {
    App: {
      disableBackButtonHandler: true,
    },
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 5000,
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
