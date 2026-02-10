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
} from 'react-native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      navigation.navigate('Home');
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/invalid-credential') {
        Alert.alert('Login Failed', 'Incorrect email or password.');
      } else if (error.code === 'auth/user-not-found') {
        Alert.alert('Login Failed', 'No account found with this email.');
      } else {
        Alert.alert('Login Failed', error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top dark section with logo */}
      <View style={styles.topContainer}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>Raseed</Text>
        </View>
      </View>

      {/* White curved bottom login section */}
      <View style={styles.bottomContainer}>
        <Text style={styles.loginTitle}>Login</Text>
        <Text style={styles.loginSubtitle}>Sign in to continue.</Text>

        <Text style={styles.label}>EMAIL ID</Text>
        <TextInput
          style={styles.input}
          placeholder=""
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>PASSWORD</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder=""
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color="#555"
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>
        <View style={{ marginBottom: 25 }} /> 

        <TouchableOpacity style={styles.otpButton} onPress={handleLogin} disabled={isSubmitting}>
          <Text style={styles.otpButtonText}>
            {isSubmitting ? 'Logging in...' : 'LOGIN'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.signupText}>Don't have an account? Signup!</Text>
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
    height: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1c2b48',
    borderBottomRightRadius: 90,
  },
  logoBox: {
    backgroundColor: '#fff',
    width: 85,
    height: 85,
    borderRadius: 16,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1,
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
    alignSelf: 'flex-start',
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
    paddingHorizontal: 10,
  },
  eyeIcon: {
    paddingHorizontal: 8,
  },
  otpButton: {
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  otpButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  signupText: {
    textAlign: 'center',
    color: '#111',
    textDecorationLine: 'underline',
    fontSize: 13,
  },
});
