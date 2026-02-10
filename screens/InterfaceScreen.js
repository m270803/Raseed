import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

export default function Interface({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login'); // Navigate to LoginScreen after 5 seconds
    }, 5000);

    return () => clearTimeout(timer); // Clean up on unmount
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>Raseed</Text>
      </View>

      {/* ⭐ ADDED LINE: Tagline below logo box */}
      <Text style={styles.tagline}>Smart Finance Tracker And Receipt Scanner</Text>

      <Text style={styles.footerText}>from</Text>
      <Text style={[styles.footerText, { bottom: 60 }]}>Raseed</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c2b48',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBox: {
    backgroundColor: '#fff',
    width: 100,
    height: 100,
    borderRadius: 25,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1.5,
  },

  /* ⭐ ADDED STYLE FOR TAGLINE */
  tagline: {
    marginTop: 20,
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    width: '80%',
    fontWeight: '600',
  },

  footerText: {
    position: 'absolute',
    bottom: 80,
    color: '#fff',
    fontSize: 14,
  },
});