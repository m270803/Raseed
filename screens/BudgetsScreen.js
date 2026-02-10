import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function BudgetsScreen() {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [budgets, setBudgets] = useState([]);

  const auth = getAuth();
  const user = auth.currentUser;

  const fetchBudgets = async () => {
    const userBudgetsRef = collection(db, 'users', user.uid, 'budgets');
    const snapshot = await getDocs(userBudgetsRef);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setBudgets(data);
  };

  const saveBudget = async () => {
    if (!category || !amount) return alert('Please fill all fields');
    const newBudget = {
      category,
      amount: parseFloat(amount),
      createdAt: new Date().toISOString(),
    };
    await addDoc(collection(db, 'users', user.uid, 'budgets'), newBudget);
    fetchBudgets();
    setCategory('');
    setAmount('');
  };

  const deleteBudget = async (id) => {
    await deleteDoc(doc(db, 'users', user.uid, 'budgets', id));
    fetchBudgets();
  };

  const editBudget = async (item) => {
    setCategory(item.category);
    setAmount(String(item.amount));
    await deleteBudget(item.id);
  };

  useEffect(() => {
    if (user) {
      fetchBudgets();
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Budgets</Text>
      <Text style={styles.heading}>Set Monthly Budgets</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Food"
          value={category}
          onChangeText={setCategory}
        />

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="e.g. 5000"
          value={amount}
          onChangeText={setAmount}
        />

        <TouchableOpacity style={styles.btn} onPress={saveBudget}>
          <Text style={styles.btnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item.category} - ₹{item.amount}</Text>
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <TouchableOpacity onPress={() => editBudget(item)} style={{ marginRight: 20 }}>
                <Text style={{ color: 'blue' }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteBudget(item.id)}>
                <Text style={{ color: 'red' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f6f8fa',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 14,
    color: '#1c2b48',
  },
  card: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    color: '#1c2b48',
  },
  input: {
    backgroundColor: '#f0f2f5',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: '#1c2b48',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
