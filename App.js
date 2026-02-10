// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InterfaceScreen from './screens/InterfaceScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
//import OTPVerificationScreen from './screens/OTPVerificationScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import ScanReceiptScreen from './screens/ScanReceiptScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import BudgetsScreen from './screens/BudgetsScreen';
import IncomeTrackingScreen from './screens/IncomeTrackingScreen';
import SavingsGoalScreen from './screens/SavingsGoalScreen';
import ViewInsightsScreen from './screens/ViewInsightsScreen';
import AskAssistantScreen from './screens/AskAssistantScreen';
import {ThemeProvider} from './ThemeContext';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Interface" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Interface" component={InterfaceScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} /> 
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ScanReceipt" component={ScanReceiptScreen} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
        <Stack.Screen name="Budgets" component={BudgetsScreen} />
        <Stack.Screen name="Income" component={IncomeTrackingScreen} />
        <Stack.Screen name="SavingsGoals" component={SavingsGoalScreen} />
        <Stack.Screen name="Insights" component={ViewInsightsScreen} />
        <Stack.Screen name="AskAssistant" component={AskAssistantScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </ThemeProvider>
  );
}

