import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const { height } = Dimensions.get('window');

export default function OTPVerification({ route, navigation }) {
  const { uid, email } = route.params;
  const [emailOtp, setEmailOtp] = useState('');

  const verifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      return Alert.alert('Invalid OTP', 'Please enter the 6-digit code.');
    }

    try {
      const docRef = doc(db, 'users', uid);
      const userSnap = await getDoc(docRef);

      if (!userSnap.exists()) {
        return Alert.alert('User not found');
      }

      const savedOtp = userSnap.data().emailOtp;

      if (emailOtp === savedOtp) {
        await updateDoc(docRef, { verifiedEmail: true });
        Alert.alert('Email verified!', '', [
          { text: 'Continue', onPress: () => navigation.replace('Login') },
        ]);
      } else {
        Alert.alert('Incorrect OTP', 'Please check your email and try again.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Verification failed', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomContainer}>
        <Text style={styles.loginTitle}>Verify your Email</Text>
        <Text style={styles.loginSubtitle}>Enter the 6-digit OTP sent to {email}</Text>

        <Text style={styles.label}>EMAIL OTP</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          value={emailOtp}
          onChangeText={setEmailOtp}
          keyboardType="number-pad"
          maxLength={6}
        />

        <TouchableOpacity style={styles.otpButton} onPress={verifyEmailOtp}>
          <Text style={styles.otpButtonText}>Verify</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c2b48',
  },
  topContainer: {
    height: height * 0.10,
    justifyContent: 'center',
    alignItems: 'flex-start', // 'left' is invalid
    paddingLeft: 20,
    paddingTop: 30,
    backgroundColor: '#1c2b48',
    borderBottomRightRadius: 90,
  },
  bottomContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 90,
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#e2e2e2',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 25,
  },
  otpButton: {
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  otpButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
