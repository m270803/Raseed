import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';

export default function IncomeTrackingScreen() {
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [incomeList, setIncomeList] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const auth = getAuth();
  const user = auth.currentUser;
  const navigation = useNavigation();

  /* ---------------- SAVE INCOME ---------------- */
  const saveIncome = async () => {
    if (!source || !amount) return Alert.alert('Fill all fields');

    const newIncome = {
      source,
      amount: parseFloat(amount),
      date: new Date().toISOString(),
    };

    await addDoc(
      collection(db, 'users', user.uid, 'incomeTrackers', 'default', 'incomes'),
      newIncome
    );

    setSource('');
    setAmount('');
    fetchIncomes();
  };

  /* ---------------- FETCH INCOMES ---------------- */
  const fetchIncomes = async () => {
    const incomeRef = collection(db, 'users', user.uid, 'incomeTrackers', 'default', 'incomes');
    const snapshot = await getDocs(incomeRef);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setIncomeList(data);
  };

  /* ---------------- FETCH EXPENSES (FIXED PATH) ---------------- */
  const fetchExpenses = async () => {
    // FIXED: Correct path for Expense Tracker
    const expenseRef = collection(
      db,
      'users',
      user.uid,
      'incomeTrackers',
      'default',
      'expenses'
    );

    const snapshot = await getDocs(expenseRef);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setExpenses(data);
  };

  /* ---------------- DELETE INCOME ---------------- */
  const deleteIncome = async (id) => {
    const docRef = doc(db, 'users', user.uid, 'incomeTrackers', 'default', 'incomes', id);
    await deleteDoc(docRef);
    fetchIncomes();
  };

  /* ---------------- EDIT INCOME ---------------- */
  const editIncome = async (item) => {
    setSource(item.source);
    setAmount(String(item.amount));
    await deleteIncome(item.id);
  };

  useEffect(() => {
    if (user) {
      fetchIncomes();
      fetchExpenses(); // load expenses for summary
    }
  }, []);

  /* ---------------- SUMMARY CALCULATIONS ---------------- */
  const totalIncome = incomeList.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netSavings = totalIncome - totalExpenses;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Income Tracker</Text>
      <Text style={styles.heading}>Add Income</Text>

      {/* INPUT CARD */}
      <View style={styles.card}>
        <Text style={styles.label}>Source</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Salary"
          value={source}
          onChangeText={setSource}
        />

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 50000"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <TouchableOpacity style={styles.btn} onPress={saveIncome}>
          <Text style={styles.btnText}>Add Income</Text>
        </TouchableOpacity>
      </View>

      {/* SUMMARY BOX */}
      <View style={styles.summaryBox}>
        <Text>Total Income: ₹{totalIncome}</Text>
        <Text>Total Expenses: ₹{totalExpenses}</Text>
        <Text style={{ fontWeight: 'bold' }}>Net Savings: ₹{netSavings}</Text>
      </View>

      <Text style={styles.heading}>Income List</Text>

      {/* LIST */}
      <FlatList
        data={incomeList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item.source} - ₹{item.amount}</Text>

            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <TouchableOpacity onPress={() => editIncome(item)} style={{ marginRight: 20 }}>
                <Text style={{ color: 'blue' }}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => deleteIncome(item.id)}>
                <Text style={{ color: 'red' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* GO TO EXPENSES */}
      <TouchableOpacity onPress={() => navigation.navigate('AddExpense')}>
        <Text style={{ color: '#007AFF', textAlign: 'center', marginTop: 10, marginBottom: 50 }}>
          Go to Expense Tracker
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* -------------------------- STYLES -------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  heading: { fontSize: 22, fontWeight: 'bold', marginTop: 14, marginBottom: 14 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15 },
  label: { marginTop: 10, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginTop: 5,
  },
  btn: {
    backgroundColor: '#1c2b48',
    padding: 12,
    borderRadius: 6,
    marginTop: 15,
  },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  summaryBox: {
    padding: 15,
    backgroundColor: '#e0f7fa',
    borderRadius: 10,
    marginVertical: 10,
  },
});