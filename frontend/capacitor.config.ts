import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId:  "com.libroware.app",
  appName: "Libroware",
  webDir: "dist",
  server: {
    // Use HTTPS scheme inside the WebView (required for cookies, secure storage)
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration:       2000,
      launchAutoHide:           true,
      backgroundColor:          "#059669",
      androidSplashResourceName: "splash",
      androidScaleType:         "CENTER_CROP",
      showSpinner:              false,
      splashFullScreen:         true,
      splashImmersive:          true,
    },
    StatusBar: {
      style:           "Light",
      backgroundColor: "#059669",
    },
  },
};

export default config;
