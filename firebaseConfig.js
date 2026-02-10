// firebaseConfig.js

import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

// 🔐 Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCCZ1eV0QLqTkKmLyTUwhpqY7wZiCvpRFA',
  authDomain: 'projectraseed-app.firebaseapp.com',
  projectId: 'projectraseed-app',
  storageBucket: 'projectraseed-app.appspot.com',
  messagingSenderId: '517818146196',
  appId: '1:517818146196:android:b7092c731840b4d1454381',
};

// 🔥 Initialize Firebase App
const app = initializeApp(firebaseConfig);

// ✅ Initialize Auth with persistent session support
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// 🔎 Initialize Firestore
const db = getFirestore(app);

// ✅ Export for use in your app
export { auth, db, firebaseConfig };
