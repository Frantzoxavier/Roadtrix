import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../../services/api';
import { Card, LoadingScreen, Badge } from '../../components/ui';
import { Colors, Spacing, FontSize, BorderRadius } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function EarningsScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['myPayments'],
    queryFn: paymentsApi.getMyPayments,
  });

  const payments = data?.data?.data || [];

  const total = payments.reduce((s: number, p: any) => s + p.amount, 0);
  const paid = payments.filter((p: any) => p.status === 'PAID').reduce((s: number, p: any) => s + p.amount, 0);
  const pending = payments.filter((p: any) => p.status === 'PENDING').reduce((s: number, p: any) => s + p.amount, 0);

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['myPayments'] });
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    if (status === 'PAID') return Colors.success;
    if (status === 'PENDING') return Colors.warning;
    return Colors.danger;
  };

  if (isLoading) return <LoadingScreen message="Loading earnings..." />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary cards */}
        <View style={styles.summaryGrid}>
          <Card style={[styles.summaryCard, styles.summaryCardTotal]}>
            <Ionicons name="wallet-outline" size={22} color={Colors.white} />
            <Text style={styles.summaryAmountWhite}>{formatCurrency(total)}</Text>
            <Text style={styles.summaryLabelWhite}>Total Earned</Text>
          </Card>

          <View style={styles.summaryRight}>
            <Card style={styles.summaryMini}>
              <Text style={[styles.summaryMiniAmount, { color: Colors.success }]}>{formatCurrency(paid)}</Text>
              <Text style={styles.summaryMiniLabel}>Paid Out</Text>
            </Card>
            <Card style={styles.summaryMini}>
              <Text style={[styles.summaryMiniAmount, { color: Colors.warning }]}>{formatCurrency(pending)}</Text>
              <Text style={styles.summaryMiniLabel}>Pending</Text>
            </Card>
          </View>
        </View>

        {/* Payment list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {payments.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="cash-outline" size={40} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>No payments yet</Text>
              <Text style={styles.emptyText}>Payments appear here after you complete deliveries.</Text>
            </Card>
          ) : (
            payments.map((payment: any) => (
              <Card key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentRow}>
                  <View style={styles.paymentIcon}>
                    <Ionicons name="cash-outline" size={20} color={Colors.accent} />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                    <Text style={styles.paymentDate}>{formatDate(payment.createdAt)}</Text>
                  </View>
                  <Badge
                    label={payment.status}
                    color={getStatusColor(payment.status)}
                  />
                </View>
                {payment.payoutDate && (
                  <Text style={styles.payoutDate}>
                    Paid on {formatDate(payment.payoutDate)}
                  </Text>
                )}
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: 100, gap: Spacing.lg },

  summaryGrid: { flexDirection: 'row', gap: Spacing.sm },
  summaryCard: {
    flex: 1, padding: Spacing.md, gap: Spacing.xs,
    backgroundColor: Colors.accent, borderColor: Colors.accent,
  },
  summaryCardTotal: { flex: 1.4 },
  summaryAmountWhite: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white, marginTop: 4 },
  summaryLabelWhite: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  summaryRight: { flex: 1, gap: Spacing.sm },
  summaryMini: { flex: 1, padding: Spacing.sm },
  summaryMiniAmount: { fontSize: FontSize.md, fontWeight: '700' },
  summaryMiniLabel: { fontSize: FontSize.xs, color: Colors.textMuted },

  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },

  emptyCard: {
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm,
  },
  emptyTitle: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },

  paymentCard: { padding: Spacing.md, marginBottom: 2 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  paymentIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.accentLight,
    alignItems: 'center', justifyContent: 'center',
  },
  paymentInfo: { flex: 1 },
  paymentAmount: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  paymentDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  payoutDate: { fontSize: FontSize.xs, color: Colors.success, marginTop: Spacing.xs, paddingLeft: 52 },
});
