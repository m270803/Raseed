import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';

export default function SavingsGoalScreen() {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [saved, setSaved] = useState('');
  const [goals, setGoals] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user?.uid;

  const fetchGoals = async () => {
    if (!userId) return;
    const snapshot = await getDocs(collection(db, 'users', userId, 'savingsGoals'));
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setGoals(list);
  };

  useEffect(() => {
    fetchGoals();
  }, [userId]);

  const saveGoal = async () => {
    if (!title || !target || !saved) {
      Alert.alert('Please fill all fields');
      return;
    }

    const goalData = {
      title,
      target: parseFloat(target),
      saved: parseFloat(saved),
      createdAt: new Date().toISOString(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'users', userId, 'savingsGoals', editingId), goalData);
        setEditingId(null);
        Alert.alert('Goal updated!');
      } else {
        await addDoc(collection(db, 'users', userId, 'savingsGoals'), goalData);
        Alert.alert('Goal added!');
      }

      setTitle('');
      setTarget('');
      setSaved('');
      fetchGoals();
    } catch (error) {
      console.error(error);
      Alert.alert('Failed to save goal');
    }
  };

  const handleEdit = (item) => {
    setTitle(item.title);
    setTarget(item.target.toString());
    setSaved(item.saved.toString());
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'users', userId, 'savingsGoals', id));
      fetchGoals();
    } catch (error) {
      console.error('Delete failed:', error);
      Alert.alert('Error deleting goal');
    }
  };

  const renderItem = ({ item }) => {
    const progress = ((item.saved / item.target) * 100).toFixed(1);
    return (
      <View style={styles.expenseItem}>
        <View>
          <Text style={styles.expenseTitle}>{item.title} • ₹{item.saved} / ₹{item.target}</Text>
          <Text style={styles.expenseMeta}>Progress: {progress}%</Text>
        </View>
        <View style={styles.actionBtns}>
          <TouchableOpacity onPress={() => handleEdit(item)}>
            <Ionicons name="pencil" size={20} color="#1c2b48" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 12 }}>
            <Ionicons name="trash" size={20} color="crimson" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Savings Goals</Text>
      <Text style={styles.heading}>Add Goal</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Goal</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Buy iPhone"
        />

        <Text style={styles.label}>Target Amount</Text>
        <TextInput
          style={styles.input}
          value={target}
          onChangeText={setTarget}
          keyboardType="numeric"
          placeholder="e.g. 80000"
        />

        <Text style={styles.label}>Saved So Far</Text>
        <TextInput
          style={styles.input}
          value={saved}
          onChangeText={setSaved}
          keyboardType="numeric"
          placeholder="e.g. 15000"
        />

        <TouchableOpacity style={styles.btn} onPress={saveGoal}>
          <Text style={styles.btnText}>{editingId ? 'Update' : 'Add'} Goal</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.heading, { fontSize: 20, marginTop: 24 }]}>Your Goals</Text>
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f6f8fa' },
  heading: { fontSize: 24, fontWeight: '700', color: '#1c2b48', marginVertical: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  label: { marginTop: 12, marginBottom: 4, fontSize: 14, fontWeight: '600', color: '#1c2b48' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#f9fafb',
    fontSize: 15,
    color: '#1c2b48',
  },
  btn: {
    backgroundColor: '#1c2b48',
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c2b48',
  },
  expenseMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
