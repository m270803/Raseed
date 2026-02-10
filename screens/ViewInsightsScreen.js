import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import {
  collection,
  getDocs,
  query,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { PieChart, LineChart, BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function ViewInsightsScreen() {
  const [pieData, setPieData] = useState([]);
  const [lineLabels, setLineLabels] = useState([]);
  const [lineValues, setLineValues] = useState([]);
  const [barLabels, setBarLabels] = useState([]);
  const [barValues, setBarValues] = useState([]);

  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [savings, setSavings] = useState(0);
  const [topCategory, setTopCategory] = useState('');
  const [avgDaily, setAvgDaily] = useState(0);

  const auth = getAuth();
  const user = auth.currentUser;

  const fetchInsights = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // ---------- EXPENSES (current month) ----------
      const expensesRef = collection(
        db,
        'users',
        user.uid,
        'incomeTrackers',
        'default',
        'expenses'
      );
      const expensesQuery = query(expensesRef);
      const expensesSnap = await getDocs(expensesQuery);

      const expensesRaw = expensesSnap.docs
        .map((doc) => doc.data())
        .filter((item) => {
          if (!item.createdAt) return false;
          let date;
          if (item.createdAt?.toDate) {
            date = item.createdAt.toDate();
          } else if (typeof item.createdAt === 'string') {
            date = new Date(item.createdAt);
          } else {
            return false;
          }
          return (
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
          );
        });

      // ---------- INCOME (current month) ----------
      const incomesRef = collection(
        db,
        'users',
        user.uid,
        'incomeTrackers',
        'default',
        'incomes'
      );
      const incomesQuery = query(incomesRef);
      const incomesSnap = await getDocs(incomesQuery);

      const incomesRaw = incomesSnap.docs
        .map((doc) => doc.data())
        .filter((item) => {
          if (!item.date) return false;
          const d = new Date(item.date);
          return (
            d.getMonth() === currentMonth &&
            d.getFullYear() === currentYear
          );
        });

      // ---------- Group expenses by category (Pie) ----------
      const groupedByCategory = {};
      let totalExp = 0;

      expensesRaw.forEach((item) => {
        const cat = item.category || 'Other';
        const amt = parseFloat(item.amount) || 0;
        if (!groupedByCategory[cat]) groupedByCategory[cat] = 0;
        groupedByCategory[cat] += amt;
        totalExp += amt;
      });

      const pieColors = [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40',
      ];

      const pieChartData = Object.entries(groupedByCategory).map(
        ([cat, amt], idx) => ({
          name: cat,
          amount: amt,
          color: pieColors[idx % pieColors.length],
          legendFontColor: '#333',
          legendFontSize: 13,
        })
      );

      // ---------- Daily expenses (Line chart) ----------
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const dailyTotals = Array(daysInMonth).fill(0);

      expensesRaw.forEach((item) => {
        let dateObj;
        if (item.createdAt?.toDate) {
          dateObj = item.createdAt.toDate();
        } else if (typeof item.createdAt === 'string') {
          dateObj = new Date(item.createdAt);
        } else {
          return;
        }
        const day = dateObj.getDate(); // 1..daysInMonth
        const amt = parseFloat(item.amount) || 0;
        dailyTotals[day - 1] += amt;
      });

      // labels: 1, 5, 10, 15, 20, 25, last
      const labels = [];
      const values = [];
      for (let i = 0; i < daysInMonth; i++) {
        const day = i + 1;
        const includeLabel =
          day === 1 ||
          day === daysInMonth ||
          day === 5 ||
          day === 10 ||
          day === 15 ||
          day === 20 ||
          day === 25;
        labels.push(includeLabel ? String(day) : '');
        values.push(dailyTotals[i]);
      }

      // ---------- Top categories (Bar chart) ----------
      const sortedCats = Object.entries(groupedByCategory).sort(
        (a, b) => b[1] - a[1]
      );
      const top5 = sortedCats.slice(0, 5);
      const barLabelsLocal = top5.map(([cat]) => cat);
      const barValuesLocal = top5.map(([, amt]) => amt);

      // ---------- Income totals ----------
      let totalInc = 0;
      incomesRaw.forEach((it) => {
        totalInc += parseFloat(it.amount) || 0;
      });

      const savingsLocal = totalInc - totalExp;

      // ---------- Smart insights ----------
      const highestCat = sortedCats[0]?.[0] || '';
      const avgDailyLocal =
        daysInMonth > 0 ? totalExp / daysInMonth : 0;

      // ---------- Set state ----------
      setPieData(pieChartData);
      setLineLabels(labels);
      setLineValues(values);
      setBarLabels(barLabelsLocal);
      setBarValues(barValuesLocal);
      setTotalExpenses(totalExp);
      setTotalIncome(totalInc);
      setSavings(savingsLocal);
      setTopCategory(highestCat);
      setAvgDaily(avgDailyLocal);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(28, 43, 72, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    propsForDots: {
      r: '3',
    },
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Monthly Expense Insights</Text>

      {/* ---------- SUMMARY CARDS ---------- */}
      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total Income</Text>
          <Text style={styles.cardValue}>₹{totalIncome.toFixed(2)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total Expenses</Text>
          <Text style={styles.cardValue}>₹{totalExpenses.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.cardsRow}>
        <View style={[styles.card, savings >= 0 ? styles.cardPositive : styles.cardNegative]}>
          <Text style={styles.cardLabel}>Net Savings</Text>
          <Text style={styles.cardValue}>
            ₹{savings.toFixed(2)}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Avg Daily Spend</Text>
          <Text style={styles.cardValue}>
            ₹{avgDaily.toFixed(0)}
          </Text>
        </View>
      </View>

      {/* ---------- DAILY TREND (LINE CHART) ---------- */}
      {lineValues.length > 0 && (
        <View style={styles.chartBlock}>
          <Text style={styles.chartTitle}>Spending Trend (This Month)</Text>
          <LineChart
            data={{
              labels: lineLabels,
              datasets: [
                {
                  data: lineValues,
                },
              ],
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* ---------- CATEGORY SPLIT (PIE CHART) ---------- */}
      {pieData.length > 0 ? (
        <View style={styles.chartBlock}>
          <Text style={styles.chartTitle}>Spending by Category</Text>
          <PieChart
            data={pieData.map((d) => ({
              name: d.name,
              population: d.amount,
              color: d.color,
              legendFontColor: d.legendFontColor,
              legendFontSize: d.legendFontSize,
            }))}
            width={screenWidth - 32}
            height={230}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="10"
            absolute
          />
        </View>
      ) : (
        <Text style={styles.noData}>No expenses for this month yet.</Text>
      )}

      {/* ---------- TOP CATEGORIES (BAR CHART) ---------- */}
      {barLabels.length > 0 && (
        <View style={styles.chartBlock}>
          <Text style={styles.chartTitle}>Top Categories</Text>
          <BarChart
            data={{
              labels: barLabels,
              datasets: [{ data: barValues }],
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            fromZero
            showValuesOnTopOfBars
          />
        </View>
      )}

      {/* ---------- SMART INSIGHTS TEXT ---------- */}
      <View style={styles.insightsBox}>
        <Text style={styles.insightsTitle}>Smart Insights</Text>
        {topCategory ? (
          <Text style={styles.insightsText}>
            • Your highest spending category this month is{' '}
            <Text style={styles.bold}>{topCategory}</Text>.
          </Text>
        ) : null}

        <Text style={styles.insightsText}>
          • You spent a total of{' '}
          <Text style={styles.bold}>₹{totalExpenses.toFixed(0)}</Text> this month,
          with an average of{' '}
          <Text style={styles.bold}>₹{avgDaily.toFixed(0)}</Text> per day.
        </Text>

        <Text style={styles.insightsText}>
          • Net savings this month:{' '}
          <Text
            style={[
              styles.bold,
              savings >= 0 ? styles.positiveText : styles.negativeText,
            ]}
          >
            ₹{savings.toFixed(0)}
          </Text>
          .
        </Text>

        {totalIncome > 0 && (
          <Text style={styles.insightsText}>
            • You are using{' '}
            <Text style={styles.bold}>
              {((totalExpenses / (totalIncome || 1)) * 100).toFixed(1)}%
            </Text>{' '}
            of your income on expenses.
          </Text>
        )}
      </View>
    </ScrollView>
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

  // Summary cards
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c2b48',
  },
  cardPositive: {
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  cardNegative: {
    borderWidth: 1,
    borderColor: '#dc2626',
  },

  // Charts
  chartBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 16,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c2b48',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  chart: {
    borderRadius: 12,
  },

  total: {
    fontSize: 18,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#1c2b48',
  },
  noData: {
    fontSize: 16,
    marginTop: 24,
    textAlign: 'center',
    color: '#666',
  },

  // Insights text
  insightsBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
    marginBottom: 24,
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c2b48',
    marginBottom: 8,
  },
  insightsText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
    color: '#1c2b48',
  },
  positiveText: {
    color: '#16a34a',
  },
  negativeText: {
    color: '#dc2626',
  },
});