# AI Engine Setup Guide

## Issue Fixed
The AI Engine was failing to initialize with the error:
```
ERROR  Error: Cannot find native module 'ExponentGLObjectManager'
```

This occurred because TensorFlow.js React Native requires `expo-gl` for GPU acceleration support.

## What Was Changed

### 1. Added TensorFlow.js React Native Backend Initialization
**File**: `mobile/src/services/aiEngine/intentClassifier.ts`

- Added `import '@tensorflow/tfjs-react-native'` to load the React Native backend
- Added `await tf.ready()` before any TensorFlow operations to ensure proper initialization

### 2. Added Required Dependency
**File**: `mobile/package.json`

- Added `expo-gl: "~13.6.0"` - required peer dependency for TensorFlow.js React Native

## Installation Steps

### Step 1: Install Dependencies
Run the following command in the `mobile` directory:

```bash
npm install
```

This will install the newly added `expo-gl` package.

### Step 2: Rebuild the Development Client
Since we added a native module (`expo-gl`), you need to rebuild the development client:

```bash
# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

**Important**: Do NOT use `expo start` or `npm start` until after rebuilding. The native modules need to be compiled first.

### Step 3: Verify Installation
After rebuilding, start the app and check the logs. You should see:

```
🚀 Initializing AI Engine...
🧠 Initializing Intent Classifier...
✓ TensorFlow.js backend ready
📚 Loaded vocabulary: XXX words
✅ Intent Classifier initialized successfully
```

## Why This Was Needed

TensorFlow.js in React Native uses WebGL through Expo GL for GPU acceleration. The error occurred because:

1. **Missing Native Module**: `expo-gl` provides the `ExponentGLObjectManager` native module
2. **Backend Not Initialized**: TensorFlow.js needs `tf.ready()` to set up the platform-specific backend
3. **Import Side Effects**: The `import '@tensorflow/tfjs-react-native'` statement registers the RN platform

## Troubleshooting

### If you still see "Cannot find native module" errors:

1. **Clear Metro cache**:
   ```bash
   npx expo start --clear
   ```

2. **Clean build**:
   ```bash
   cd android && ./gradlew clean && cd ..
   npx expo run:android
   ```

3. **Verify expo-gl installation**:
   ```bash
   npm list expo-gl
   ```
   Should show: `expo-gl@13.6.0`

### If the app crashes on startup:

1. Check that you rebuilt the development client after adding expo-gl
2. Ensure you're using Expo SDK 50 (check `expo` version in package.json)
3. Try uninstalling and reinstalling the app

## Technical Details

### TensorFlow.js React Native Architecture

```
┌─────────────────────────────────────┐
│   Your App (intentClassifier.ts)   │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  @tensorflow/tfjs (Core Library)    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ @tensorflow/tfjs-react-native       │
│ (Platform Adapter)                  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  expo-gl (OpenGL Bindings)          │
│  ExponentGLObjectManager            │
└─────────────────────────────────────┘
```

### Backend Initialization Flow

1. `import '@tensorflow/tfjs-react-native'` - Registers the RN platform with TensorFlow.js
2. `await tf.ready()` - Initializes the GL context and prepares the backend
3. TensorFlow operations (model creation, training, prediction) can now run

## References

- [TensorFlow.js React Native](https://github.com/tensorflow/tfjs/tree/master/tfjs-react-native)
- [Expo GL Documentation](https://docs.expo.dev/versions/latest/sdk/gl-view/)
- [Expo SDK 50 Compatibility](https://docs.expo.dev/versions/v50.0.0/)
