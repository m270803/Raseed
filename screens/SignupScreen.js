import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const { height } = Dimensions.get('window');

export default function SignupScreen({ navigation }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showRules, setShowRules] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignup = async () => {
    if (isSubmitting) return;

    const { firstName, lastName, email, password, confirmPassword } = form;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return Alert.alert('Missing Fields', 'Please fill out all fields.');
    }

    if (password !== confirmPassword) {
      return Alert.alert('Password Mismatch', 'Passwords do not match.');
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return Alert.alert('Invalid Email', 'Enter a valid email.');
    }

    // ⭐ PASSWORD RULES
    if (password.length < 6) {
      return Alert.alert('Weak Password', 'Password must be at least 6 characters.');
    }

    if (!/[A-Z]/.test(password)) {
      return Alert.alert('Weak Password', 'Password must contain at least one uppercase letter.');
    }

    if (!/[0-9]/.test(password)) {
      return Alert.alert('Weak Password', 'Password must contain at least one number.');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return Alert.alert('Weak Password', 'Password must contain at least one special character.');
    }

    // END RULES

    setIsSubmitting(true);

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      const uid = user.uid;

      await setDoc(doc(db, 'users', uid), {
        uid,
        firstName,
        lastName,
        email,
        createdAt: new Date().toISOString(),
      });

      navigation.navigate('Login');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        Alert.alert('Email In Use', 'This email is already registered. Please log in.');
      } else {
        console.error(err);
        Alert.alert('Signup Failed', err.message);
      }
    } finally {
      setIsSubmitting(false);
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
        <Text style={styles.loginTitle}>Create new Account</Text>
        <Text style={styles.loginSubtitle}>Already registered? Log in here.</Text>

        <Text style={styles.label}>FIRST NAME</Text>
        <TextInput
          style={styles.input}
          value={form.firstName}
          onChangeText={(v) => handleChange('firstName', v)}
        />

        <Text style={styles.label}>LAST NAME</Text>
        <TextInput
          style={styles.input}
          value={form.lastName}
          onChangeText={(v) => handleChange('lastName', v)}
        />

        <Text style={styles.label}>EMAIL</Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          onChangeText={(v) => handleChange('email', v)}
        />

        <Text style={styles.label}>PASSWORD</Text>
        <TouchableOpacity onPress={() => setShowRules(true)}>
          <Text style={{ color: '#1c2b48', marginBottom: 5 }}>Show Password Rules</Text>
        </TouchableOpacity>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            secureTextEntry={!showPassword}
            value={form.password}
            onChangeText={(v) => handleChange('password', v)}
          />
          <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
            <Ionicons
              name={showPassword ? 'eye' : 'eye-off'}
              size={24}
              color="#888"
            />
          </TouchableOpacity>
        </View>

        {/* ⭐ CONFIRM PASSWORD FIELD ADDED */}
        <Text style={styles.label}>CONFIRM PASSWORD</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            secureTextEntry={!showConfirmPassword}
            value={form.confirmPassword}
            onChangeText={(v) => handleChange('confirmPassword', v)}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
            <Ionicons
              name={showConfirmPassword ? 'eye' : 'eye-off'}
              size={24}
              color="#888"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.otpButton}
          onPress={handleSignup}
          disabled={isSubmitting}
        >
          <Text style={styles.otpButtonText}>
            {isSubmitting ? 'Signing up...' : 'Sign up'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ⭐ PASSWORD RULES POPUP */}
      <Modal visible={showRules} transparent animationType="fade">
        <View style={styles.rulesOverlay}>
          <View style={styles.rulesBox}>
            <Text style={styles.rulesTitle}>Password Rules</Text>
            <Text>• Minimum 6 characters</Text>
            <Text>• At least 1 uppercase letter</Text>
            <Text>• At least 1 number</Text>
            <Text>• At least 1 special character</Text>

            <TouchableOpacity
              style={styles.rulesButton}
              onPress={() => setShowRules(false)}
            >
              <Text style={styles.rulesButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    alignItems: 'flex-start',
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2e2e2',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 25,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
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

  // ⭐ POPUP STYLES
  rulesOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rulesBox: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  rulesButton: {
    marginTop: 20,
    backgroundColor: '#1c2b48',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  rulesButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});