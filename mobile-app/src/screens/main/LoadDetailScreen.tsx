import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loadsApi } from '../../services/api';
import { Card, Badge, Button, InfoRow } from '../../components/ui';
import { Colors, Spacing, FontSize, BorderRadius, Shadow, getLoadStatusColor, getLoadStatusLabel } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

export default function LoadDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { load, loadId } = route.params;
  const [isLoading, setIsLoading] = useState(false);

  const acceptMutation = useMutation({
    mutationFn: () => loadsApi.accept(load.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLoads'] });
      queryClient.invalidateQueries({ queryKey: ['activeLoad'] });
      Alert.alert('Load Accepted!', 'Head to the pickup location when ready.', [
        { text: 'OK', onPress: () => navigation.navigate('Trip', { load, loadId: load.id }) },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Could not accept load.');
    },
  });

  const declineMutation = useMutation({
    mutationFn: () => loadsApi.decline(load.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLoads'] });
      Alert.alert('Load Declined', 'The load has been returned to the queue.');
      navigation.goBack();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Could not decline load.');
    },
  });

  const handleAccept = () => {
    Alert.alert(
      'Accept Load?',
      `Pick up at ${load.pickupAddress}. Deliver to ${load.deliveryAddress}. You'll earn $${load.driverPayout.toFixed(2)}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', style: 'default', onPress: () => acceptMutation.mutate() },
      ]
    );
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Load?',
      'This will remove the load assignment and it will go back to the queue.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: () => declineMutation.mutate() },
      ]
    );
  };

  const canAccept = ['ASSIGNED'].includes(load?.status);
  const canDecline = ['ASSIGNED', 'ACCEPTED'].includes(load?.status);
  const canViewTrip = ['ACCEPTED', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'EN_ROUTE_DELIVERY'].includes(load?.status);

  const profit = load.brokerPayout - load.driverPayout;
  const profitMargin = ((profit / load.brokerPayout) * 100).toFixed(0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Load Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Status */}
        <View style={styles.statusRow}>
          <Badge label={getLoadStatusLabel(load.status)} color={getLoadStatusColor(load.status)} size="md" />
          {load.externalLoadId && (
            <Text style={styles.externalId}>{load.externalLoadId}</Text>
          )}
        </View>

        {/* Route card */}
        <Card style={styles.routeCard} elevated>
          <Text style={styles.sectionLabel}>Route</Text>
          <View style={styles.routeContainer}>
            <View style={styles.routeRow}>
              <View style={styles.routeTimeline}>
                <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                <View style={styles.routeConnector} />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeTypeLabel}>PICKUP</Text>
                <Text style={styles.routeAddress}>{load.pickupAddress}</Text>
                <Text style={styles.routeCoords}>{load.pickupLat.toFixed(4)}, {load.pickupLng.toFixed(4)}</Text>
              </View>
            </View>
            <View style={styles.routeRow}>
              <View style={styles.routeTimeline}>
                <View style={[styles.routeDot, { backgroundColor: Colors.danger }]} />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeTypeLabel}>DELIVERY</Text>
                <Text style={styles.routeAddress}>{load.deliveryAddress}</Text>
                <Text style={styles.routeCoords}>{load.deliveryLat.toFixed(4)}, {load.deliveryLng.toFixed(4)}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Load details */}
        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>Load Info</Text>
          <View style={styles.detailGrid}>
            {[
              { label: 'Load Type', value: load.loadType },
              { label: 'Weight', value: `${load.weight.toLocaleString()} lbs` },
              { label: 'Platform', value: load.sourcePlatform },
            ].map(({ label, value }) => (
              <View key={label} style={styles.detailItem}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
              </View>
            ))}
          </View>
          {load.notes && (
            <View style={styles.notesBox}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.warning} />
              <Text style={styles.notesText}>{load.notes}</Text>
            </View>
          )}
        </Card>

        {/* Payout */}
        <Card style={styles.payoutCard} elevated>
          <Text style={styles.sectionLabel}>Your Earnings</Text>
          <View style={styles.payoutMain}>
            <Text style={styles.payoutAmount}>${load.driverPayout.toFixed(2)}</Text>
            <Text style={styles.payoutLabel}>Driver Payout</Text>
          </View>
          <View style={styles.payoutMeta}>
            <Text style={styles.payoutMetaText}>Broker Rate: ${load.brokerPayout.toFixed(2)}</Text>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          {canViewTrip && (
            <Button
              title="Open Trip Navigator"
              onPress={() => navigation.navigate('Trip', { load, loadId: load.id })}
              style={styles.actionButton}
              icon={<Ionicons name="navigate" size={18} color={Colors.white} />}
            />
          )}
          {canAccept && (
            <Button
              title="Accept Load"
              onPress={handleAccept}
              loading={acceptMutation.isPending}
              variant="success"
              style={styles.actionButton}
              icon={<Ionicons name="checkmark-circle" size={18} color={Colors.white} />}
            />
          )}
          {canDecline && (
            <Button
              title="Decline Load"
              onPress={handleDecline}
              loading={declineMutation.isPending}
              variant="danger"
              style={styles.actionButton}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: 100, gap: Spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  externalId: {
    fontSize: FontSize.xs, color: Colors.textMuted,
    backgroundColor: Colors.borderLight, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, fontFamily: 'monospace',
  },
  routeCard: { padding: Spacing.md },
  card: { padding: Spacing.md },
  sectionLabel: {
    fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.md,
  },
  routeContainer: { gap: 0 },
  routeRow: { flexDirection: 'row', gap: Spacing.sm },
  routeTimeline: { alignItems: 'center', width: 20 },
  routeDot: { width: 12, height: 12, borderRadius: 6 },
  routeConnector: { flex: 1, width: 2, backgroundColor: Colors.border, marginVertical: 4, minHeight: 24 },
  routeInfo: { flex: 1, paddingBottom: Spacing.md },
  routeTypeLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.8 },
  routeAddress: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },
  routeCoords: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  detailGrid: { gap: Spacing.md },
  detailItem: {},
  detailLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  detailValue: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: '500', marginTop: 2 },
  notesBox: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    marginTop: Spacing.md, padding: Spacing.sm, backgroundColor: Colors.warningLight, borderRadius: BorderRadius.sm,
  },
  notesText: { flex: 1, fontSize: FontSize.sm, color: Colors.warning },
  payoutCard: { padding: Spacing.lg, alignItems: 'center', borderColor: Colors.success + '30', borderWidth: 1.5 },
  payoutMain: { alignItems: 'center', marginBottom: Spacing.sm },
  payoutAmount: { fontSize: 40, fontWeight: '800', color: Colors.success, letterSpacing: -1 },
  payoutLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  payoutMeta: {},
  payoutMetaText: { fontSize: FontSize.sm, color: Colors.textMuted },
  actions: { gap: Spacing.sm },
  actionButton: { width: '100%' },
});
