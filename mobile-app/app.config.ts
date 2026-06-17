import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'RoadTrix',
  slug: 'roadtrix',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0F172A',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.roadtrix.driver',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'RoadTrix needs your location to track deliveries.',
      NSLocationAlwaysUsageDescription: 'RoadTrix needs your location to track active deliveries.',
      NSCameraUsageDescription: 'RoadTrix needs camera access for proof of delivery photos.',
      NSPhotoLibraryUsageDescription: 'RoadTrix needs photo library access for proof of delivery.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0F172A',
    },
    package: 'com.roadtrix.driver',
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000',
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  },
  plugins: [
    'expo-router',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'Allow RoadTrix to use your location for delivery tracking.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow RoadTrix to access your photos for proof of delivery.',
        cameraPermission: 'Allow RoadTrix to use your camera for proof of delivery.',
      },
    ],
  ],
});
