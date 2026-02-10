import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';

const CATEGORIES = ['All', 'Food', 'Rent', 'Travel', 'Shopping', 'Utilities', 'Other'];
const MONTHLY_LIMIT = 40000;

export default function AddExpenseScreen({ navigation, route }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showCat, setShowCat] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortNewest, setSortNewest] = useState(true);
  const [searchText, setSearchText] = useState('');

  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user?.uid;

  /* AUTO-FILL FROM ScanReceiptScreen */
  useEffect(() => {
    if (route?.params?.fromScan) {
      const t = route.params.prefillTitle || "";
      const a = route.params.prefillAmount || "";

      setTitle(t);
      setAmount(String(a));
      setShowForm(true);
      navigation.setParams({ fromScan: false });
    }
  }, [route?.params]);

  /* FILTERS */
  const applyFilters = (list, search = searchText) => {
    let f = [...list];

    if (activeFilter !== 'All') {
      f = f.filter((exp) => exp.category === activeFilter);
    }

    if (search.trim() !== '') {
      f = f.filter((exp) =>
        exp.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    f.sort((a, b) => (sortNewest ? b.date - a.date : a.date - b.date));
    setFilteredExpenses(f);
  };

  /* FETCH EXPENSES */
  const fetchExpenses = async () => {
    if (!userId) return;

    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

    const expensesRef = collection(
      db,
      'users',
      userId,
      'incomeTrackers',
      'default',
      'expenses'
    );

    const q = query(
      expensesRef,
      where('date', '>=', startOfMonth),
      where('date', '<=', endOfMonth)
    );

    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
      date: new Date(docSnap.data().date),
    }));

    setExpenses(list);
    applyFilters(list);
  };

  useEffect(() => {
    fetchExpenses();
  }, [userId]);

  useEffect(() => {
    applyFilters(expenses);
  }, [activeFilter, sortNewest]);

  /* SAVE EXPENSE */
  const saveExpense = async () => {
    if (!title || !amount) return alert('Please fill all fields');
    if (!userId) return alert('User not authenticated');

    const expenseData = {
      title,
      amount: parseFloat(amount),
      category,
      date: date.toISOString(),
      createdAt: new Date(),
    };

    try {
      if (editingId) {
        await updateDoc(
          doc(
            db,
            'users',
            userId,
            'incomeTrackers',
            'default',
            'expenses',
            editingId
          ),
          expenseData
        );
        alert('Expense updated!');
        setEditingId(null);
      } else {
        await addDoc(
          collection(
            db,
            'users',
            userId,
            'incomeTrackers',
            'default',
            'expenses'
          ),
          expenseData
        );
        alert('Expense saved!');
      }

      setTitle('');
      setAmount('');
      setCategory('Food');
      setDate(new Date());

      fetchExpenses();
    } catch (error) {
      alert('Failed to save expense');
    }
  };

  /* EDIT */
  const handleEdit = (item) => {
    setTitle(item.title);
    setAmount(item.amount.toString());
    setCategory(item.category);
    setDate(new Date(item.date));
    setEditingId(item.id);
    setShowForm(true);
  };

  /* DELETE */
  const handleDelete = async (id) => {
    await deleteDoc(
      doc(
        db,
        'users',
        userId,
        'incomeTrackers',
        'default',
        'expenses',
        id
      )
    );
    fetchExpenses();
  };

  /* RENDER ITEM */
  const renderItem = ({ item }) => (
    <View style={styles.expenseItem}>
      <View>
        <Text style={styles.expenseTitle}>{item.title} • ₹{item.amount}</Text>
        <Text style={styles.expenseMeta}>
          {item.category} | {item.date.toDateString()}
        </Text>
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

  /* PDF */
  const buildExpensesHtml = () => {
    const rows = filteredExpenses
      .map(
        (e, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${e.title}</td>
          <td>₹${e.amount}</td>
          <td>${e.category}</td>
          <td>${e.date.toDateString()}</td>
        </tr>`
      )
      .join('');

    return `
      <html>
        <body>
          <h1 style="text-align:center;">Monthly Expenses</h1>
          <table border="1" width="100%" style="border-collapse:collapse;">
            ${rows}
          </table>
        </body>
      </html>`;
  };

  const downloadMonthlyPdf = async () => {
    if (!filteredExpenses.length) return alert('No expenses to export.');

    const html = buildExpensesHtml();
    const { uri } = await Print.printToFileAsync({ html });
    await shareAsync(uri, { mimeType: 'application/pdf' });
  };

  /* ------------------------------ UI ------------------------------ */
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Expense Tracker</Text>

      {/* ADD HEADER */}
      <View style={styles.addHeaderRow}>
        <Text style={styles.heading}>Add Expense</Text>
        <TouchableOpacity onPress={() => setShowForm((p) => !p)}>
          <Ionicons
            name={showForm ? 'remove-circle-outline' : 'add-circle-outline'}
            size={26}
            color="#1c2b48"
          />
        </TouchableOpacity>
      </View>

      {/* FORM */}
      {showForm && (
        <View style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} />

          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Category</Text>
          <TouchableOpacity style={styles.select} onPress={() => setShowCat(true)}>
            <Text>{category}</Text>
            <Ionicons name="chevron-down" size={20} />
          </TouchableOpacity>

          <Text style={styles.label}>Date</Text>
          <TouchableOpacity style={styles.select} onPress={() => setShowDate(true)}>
            <Text>{date.toDateString()}</Text>
            <Ionicons name="calendar" size={20} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn} onPress={saveExpense}>
            <Text style={styles.btnText}>{editingId ? 'Update' : 'Save'} Expense</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CATEGORY MODAL */}
      <Modal visible={showCat} transparent animationType="fade">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            width: '80%',
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 20
          }}>
            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10 }}>
              Select Category
            </Text>

            {CATEGORIES.filter(c => c !== 'All').map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => {
                  setCategory(cat);
                  setShowCat(false);
                }}
                style={{ paddingVertical: 10 }}
              >
                <Text style={{ fontSize: 15 }}>{cat}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setShowCat(false)}
              style={{ marginTop: 10, alignSelf: 'flex-end' }}
            >
              <Text style={{ color: 'crimson' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DATE PICKER */}
      {showDate && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDate(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      {/* THIS MONTH'S EXPENSES */}
      <Text style={[styles.heading, { fontSize: 20, marginTop: 24 }]}>
        This Month’s Expenses
      </Text>

      {/* SEARCH BAR */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#1c2b48" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search expenses..."
          value={searchText}
          onChangeText={(t) => {
            setSearchText(t);
            applyFilters(expenses, t);
          }}
        />
      </View>

      {/* CATEGORY FILTER */}
      <View style={styles.filterRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setActiveFilter(cat)}
            style={[
              styles.filterBtn,
              activeFilter === cat && styles.filterBtnActive,
            ]}
          >
            <Text style={{ color: activeFilter === cat ? '#fff' : '#1c2b48' }}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SORTING */}
      <TouchableOpacity
        style={styles.sortLink}
        onPress={() => setSortNewest((prev) => !prev)}
      >
        <Text style={styles.sortTextLink}>
          Sort: {sortNewest ? 'Newest First' : 'Oldest First'}
        </Text>
      </TouchableOpacity>

      {/* LIST */}
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      <TouchableOpacity onPress={downloadMonthlyPdf}>
        <Text style={styles.link}>Download Monthly Expenses PDF</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Income')}>
        <Text style={[styles.link, { marginBottom: 50 }]}>
          Go to Income Tracker
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* -------------------------- STYLES -------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f6f8fa' },

  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c2b48',
  },

  addHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 2,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1c2b48',
    marginRight: 8,
    marginBottom: 8,
  },
  filterBtnActive: {
    backgroundColor: '#1c2b48',
  },

  sortLink: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  sortTextLink: {
    color: '#007AFF',
    fontWeight: '700',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },

  label: { fontSize: 14, fontWeight: '600', marginTop: 12 },

  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#f9fafb',
  },

  select: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  btn: {
    backgroundColor: '#1c2b48',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
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
  actionBtns: { flexDirection: 'row', alignItems: 'center' },

  link: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 10,
  },
});