import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  FlatList,
  useColorScheme,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../ThemeContext';

/* ----------------------- NEW BUTTON ADDED HERE ----------------------- */
const features = [
  { name: 'Scan Receipt', icon: 'scan-outline', type: 'Ionicons', screen: 'ScanReceipt' }, // ✅ UPDATED ICON
  { name: 'Add Expense', icon: 'cash-outline', type: 'Ionicons', screen: 'AddExpense' },
  { name: 'Income Tracking', icon: 'trending-up', type: 'MaterialIcons', screen: 'Income' },
  { name: 'Budgets', icon: 'pie-chart', type: 'Feather', screen: 'Budgets' },
  { name: 'Savings Goal', icon: 'bullseye', type: 'FontAwesome5', screen: 'SavingsGoals' },
  { name: 'View Insights', icon: 'insights', type: 'MaterialIcons', screen: 'Insights' },
  { name: 'Ask Assistant', icon: 'robot', type: 'FontAwesome5', screen: 'AskAssistant' },
];

const getIcon = (type, icon, size, color) => {
  switch (type) {
    case 'Ionicons':
      return <Ionicons name={icon} size={size} color={color} />;
    case 'MaterialIcons':
      return <MaterialIcons name={icon} size={size} color={color} />;
    case 'FontAwesome5':
      return <FontAwesome5 name={icon} size={size} color={color} />;
    case 'Feather':
      return <Ionicons name={icon} size={size} color={color} />;
    default:
      return <Ionicons name="help-circle" size={size} color={color} />;
  }
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const systemTheme = useColorScheme();
  const { currentTheme } = useContext(ThemeContext);
  const isDark = currentTheme === 'dark';

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => navigation.navigate(item.screen)}
    >
      <View style={styles.iconBox}>
        {getIcon(item.type, item.icon, 28, '#1c2b48')}
      </View>
      <Text style={styles.itemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: '#000' }]}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>Raseed</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <FontAwesome5 name="user-circle" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.tagline}>Smart Receipts, Smarter Savings</Text>
      <Text style={styles.solution}>All problems, one solution!</Text>

      <FlatList
        data={features}
        renderItem={renderItem}
        keyExtractor={(item) => item.name}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
      />
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
  },
  topBar: {
    backgroundColor: '#1c2b48',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  tagline: {
    marginTop: 10,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  solution: {
    marginTop: 4,
    textAlign: 'center',
    color: '#008b8b',
    fontSize: 13,
    marginBottom: 10,
  },
  grid: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  gridItem: {
    backgroundColor: '#fff',
    width: cardWidth,
    marginVertical: 10,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  iconBox: {
    marginBottom: 10,
    backgroundColor: '#e2e8f0',
    padding: 14,
    borderRadius: 50,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1c2b48',
  },
});

export default HomeScreen;
