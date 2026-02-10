import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Picker } from '@react-native-picker/picker';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig'; // Ensure this path is correct

export default function SettingsScreen({ navigation }) {
  const systemTheme = useColorScheme(); // 'light' or 'dark'
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState('on');
  const [walletSync, setWalletSync] = useState('auto');
  const [theme, setTheme] = useState('auto'); // 'auto' by default
  const [dataUsage, setDataUsage] = useState(50);

  const currentTheme = theme === 'auto' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';
  const themedStyles = getThemedStyles(isDark);

  const user = auth.currentUser;

  // Fetch theme from Firestore on mount
  useEffect(() => {
    const fetchTheme = async () => {
      if (!user) return;
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const savedTheme = docSnap.data().theme;
        if (savedTheme) setTheme(savedTheme);
      }
    };
    fetchTheme();
  }, []);

  // Update Firestore on theme change
  const handleThemeChange = async (item) => {
    setTheme(item);
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), { theme: item }, { merge: true });
      } catch (e) {
        console.log('Failed to save theme:', e);
      }
    }
  };

  const handleClearData = () => {
    Alert.alert('Confirm', 'Do you want to clear data usage?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', onPress: () => setDataUsage(0) },
    ]);
  };

  return (
    <ScrollView style={themedStyles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Profile')}>
        <Ionicons name="arrow-back-circle" size={32} color={isDark ? '#fff' : '#000'} />
      </TouchableOpacity>

      <Text style={themedStyles.title}>Settings</Text>

      <Text style={themedStyles.label}>Language:</Text>
      <View style={themedStyles.pickerBox}>
        <Picker selectedValue={language} onValueChange={(item) => setLanguage(item)}>
          <Picker.Item label="English" value="en" />
          <Picker.Item label="Hindi" value="hi" />
        </Picker>
      </View>

      <Text style={themedStyles.label}>Notifications:</Text>
      <View style={themedStyles.pickerBox}>
        <Picker selectedValue={notifications} onValueChange={(item) => setNotifications(item)}>
          <Picker.Item label="On" value="on" />
          <Picker.Item label="Off" value="off" />
        </Picker>
      </View>

      <Text style={themedStyles.label}>Wallet Sync:</Text>
      <View style={themedStyles.pickerBox}>
        <Picker selectedValue={walletSync} onValueChange={(item) => setWalletSync(item)}>
          <Picker.Item label="Auto" value="auto" />
          <Picker.Item label="Manual" value="manual" />
        </Picker>
      </View>

      <Text style={themedStyles.label}>Data Usage:</Text>
      <View style={styles.dataRow}>
        <Text style={themedStyles.dataValue}>{dataUsage} MB</Text>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearData}>
          <Text style={styles.clearButtonText}>Clear data</Text>
        </TouchableOpacity>
      </View>

      <Text style={themedStyles.label}>Theme:</Text>
      <View style={themedStyles.pickerBox}>
        <Picker selectedValue={theme} onValueChange={handleThemeChange}>
          <Picker.Item label="Light" value="light" />
          <Picker.Item label="Dark" value="dark" />
          <Picker.Item label="Auto (Device)" value="auto" />
        </Picker>
      </View>

      <View style={styles.footer}>
        <Text style={themedStyles.footerText}>About Raseed</Text>
        <Text style={themedStyles.footerText}>Version: 1.0.0, 07/07/2025</Text>
        <Text style={[themedStyles.footerText, { textDecorationLine: 'underline' }]}>
          Terms & Conditions
        </Text>
      </View>
    </ScrollView>
  );
}

// Themed styles function
const getThemedStyles = (isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: Constants.statusBarHeight + 10,
      paddingHorizontal: 20,
      backgroundColor: isDark ? '#121212' : '#fff',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 25,
      color: isDark ? '#fff' : '#000',
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 5,
      color: isDark ? '#fff' : '#000',
    },
    pickerBox: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      marginBottom: 20,
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
    },
    dataValue: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
    },
    footerText: {
      fontSize: 14,
      color: isDark ? '#aaa' : '#333',
      marginBottom: 4,
    },
  });

const styles = StyleSheet.create({
  backButton: {
    marginBottom: 10,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  clearButton: {
    backgroundColor: '#2e2d63',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    marginTop: 40,
    alignItems: 'flex-start',
  },
});

