require('dotenv').config();

export default ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS || "AIzaSyA3AsIvoyeasViVvlucuY4HGRY4Q4USdBc",
    },
  },
  android: {
    ...config.android,
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID || "AIzaSyA3AsIvoyeasViVvlucuY4HGRY4Q4USdBc",
      },
    },
  },
  extra: {
    ...config.extra,
    apiUrl: process.env.API_URL || "https://your-production-api.com/api",
    devApiUrl: process.env.DEV_API_URL || "http://192.168.1.59:3000/api",
    googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID || "731566945558-7232om519vm0ivgvour2mh7b5n83ju39.apps.googleusercontent.com",
    googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
    googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
  },
});
