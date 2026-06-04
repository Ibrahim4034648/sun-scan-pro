import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.spwms",
  appName: "SPWMS",
  webDir: "dist",
  android: {
    allowMixedContent: true,
  },
  plugins: {
    Camera: {
      // android permissions are auto-injected by the plugin
    },
  },
  server: {
    androidScheme: "https",
    // For live preview during development, uncomment and set your Lovable preview URL:
    // url: "https://id-preview--33e88332-cc3b-4c3e-bfad-fbc87cdf19da.lovable.app",
    // cleartext: true,
  },
};

export default config;
