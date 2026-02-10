// utils/fetchUserExpenses.js
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const fetchUserExpenses = async (uid) => {
  const expensesRef = collection(db, 'users', uid, 'incomeTrackers', 'expenses');
  const snapshot = await getDocs(expensesRef);
  return snapshot.docs.map((doc) => doc.data());
};
