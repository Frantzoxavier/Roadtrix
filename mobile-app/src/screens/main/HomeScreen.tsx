import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverApi, loadsApi } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { connectSocket, emitLocationUpdate } from '../../services/socket';
import { Card, Badge, LoadingScreen, SectionHeader, Button } from '../../components/ui';
import { Colors, Spacing, FontSize, BorderRadius, Shadow, getLoadStatusColor, getLoadStatusLabel } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const [isAvailable, setIsAvailable] = useState(
    user?.driver?.status === 'AVAILABLE'
  );
  const [refreshing, setRefreshing] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: ['driverProfile'],
    queryFn: driverApi.getProfile,
  });

  const { data: loadsData, isLoading: loadsLoading } = useQuery({
    queryKey: ['myLoads'],
    queryFn: () => loadsApi.getMyLoads({ limit: '10' }),
    refetchInterval: 15000,
  });

  const { data: activeLoadData } = useQuery({
    queryKey: ['activeLoad'],
    queryFn: driverApi.getActiveLoad,
    refetchInterval: 10000,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => driverApi.updateStatus(status),
    onSuccess: (_, status) => {
      setIsAvailable(status === 'AVAILABLE');
      updateUser({ driver: { ...user?.driver!, status } });
      queryClient.invalidateQueries({ queryKey: ['driverProfile'] });
    },
  });

  const driver = profileData?.data?.data;
  const loads = loadsData?.data?.data || [];
  const activeLoad = activeLoadData?.data?.data;

  // Setup socket + location tracking
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    async function setup() {
      try {
        const socket = await connectSocket();

        socket.on('loadAssigned', () => {
          queryClient.invalidateQueries({ queryKey: ['myLoads'] });
          queryClient.invalidateQueries({ queryKey: ['activeLoad'] });
        });

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          locationSubscription = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, timeInterval: 30000, distanceInterval: 100 },
            (location) => {
              emitLocationUpdate(location.coords.latitude, location.coords.longitude);
            }
          );
        }
      } catch (err) {
        console.error('Setup error:', err);
      }
    }

    setup();

    return () => {
      locationSubscription?.remove();
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  const handleStatusToggle = (value: boolean) => {
    const newStatus = value ? 'AVAILABLE' : 'UNAVAILABLE';
    Alert.alert(
      value ? 'Go Available' : 'Go Unavailable',
      value ? 'You will start receiving load assignments.' : 'You will stop receiving load assignments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => statusMutation.mutate(newStatus),
        },
      ]
    );
  };

  const assignedLoads = loads.filter((l: any) =>
    ['ASSIGNED', 'ACCEPTED'].includes(l.status)
  );

  const upcomingLoads = loads.filter((l: any) =>
    ['OPEN'].includes(l.status)
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},
            </Text>
            <Text style={styles.driverName}>{user?.firstName} {user?.lastName}</Text>
          </View>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
        </View>

        {/* Status toggle */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: isAvailable ? Colors.success : Colors.textMuted }]} />
              <View>
                <Text style={styles.statusLabel}>Status</Text>
                <Text style={styles.statusValue}>{isAvailable ? 'Available for Loads' : 'Unavailable'}</Text>
              </View>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleStatusToggle}
              trackColor={{ false: Colors.border, true: Colors.success + '40' }}
              thumbColor={isAvailable ? Colors.success : Colors.textMuted}
              disabled={statusMutation.isPending || driver?.status === 'ON_TRIP'}
            />
          </View>
        </Card>

        {/* Active Load */}
        {activeLoad && (
          <View style={styles.section}>
            <SectionHeader title="Active Load" subtitle="In progress" />
            <Card
              style={styles.activeLoadCard}
              onPress={() => navigation.navigate('Trip', { loadId: activeLoad.load?.id, load: activeLoad.load })}
              elevated
            >
              <View style={styles.activeLoadHeader}>
                <Badge
                  label={getLoadStatusLabel(activeLoad.load?.status)}
                  color={getLoadStatusColor(activeLoad.load?.status)}
                />
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </View>

              <View style={styles.routeContainer}>
                <View style={styles.routeRow}>
                  <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.routeText} numberOfLines={1}>{activeLoad.load?.pickupAddress}</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeRow}>
                  <View style={[styles.routeDot, { backgroundColor: Colors.danger }]} />
                  <Text style={styles.routeText} numberOfLines={1}>{activeLoad.load?.deliveryAddress}</Text>
                </View>
              </View>

              <View style={styles.activeLoadFooter}>
                <Text style={styles.payoutLabel}>Your Payout</Text>
                <Text style={styles.payoutValue}>${activeLoad.load?.driverPayout?.toFixed(2)}</Text>
              </View>
            </Card>
          </View>
        )}

        {/* Assigned Loads */}
        {assignedLoads.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Awaiting Action" subtitle={`${assignedLoads.length} load${assignedLoads.length > 1 ? 's' : ''}`} />
            {assignedLoads.map((load: any) => (
              <Card
                key={load.id}
                style={styles.loadCard}
                onPress={() => navigation.navigate('LoadDetail', { loadId: load.id, load })}
              >
                <View style={styles.loadCardHeader}>
                  <Badge label={getLoadStatusLabel(load.status)} color={getLoadStatusColor(load.status)} />
                  <Text style={styles.loadPayout}>${load.driverPayout.toFixed(2)}</Text>
                </View>
                <View style={styles.routeMini}>
                  <Text style={styles.routeMiniFrom} numberOfLines={1}>{load.pickupAddress}</Text>
                  <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
                  <Text style={styles.routeMiniTo} numberOfLines={1}>{load.deliveryAddress}</Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Upcoming Loads */}
        {upcomingLoads.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Upcoming Loads" />
            {upcomingLoads.slice(0, 3).map((load: any) => (
              <Card
                key={load.id}
                style={styles.loadCard}
                onPress={() => navigation.navigate('LoadDetail', { loadId: load.id, load })}
              >
                <View style={styles.loadCardHeader}>
                  <Text style={styles.loadType}>{load.loadType}</Text>
                  <Text style={styles.loadPayout}>${load.driverPayout.toFixed(2)}</Text>
                </View>
                <View style={styles.routeMini}>
                  <Text style={styles.routeMiniFrom} numberOfLines={1}>{load.pickupAddress}</Text>
                  <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
                  <Text style={styles.routeMiniTo} numberOfLines={1}>{load.deliveryAddress}</Text>
                </View>
                <Text style={styles.loadWeight}>{load.weight.toLocaleString()} lbs · {load.sourcePlatform}</Text>
              </Card>
            ))}
          </View>
        )}

        {!activeLoad && assignedLoads.length === 0 && upcomingLoads.length === 0 && !loadsLoading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={56} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No loads yet</Text>
            <Text style={styles.emptyText}>Your dispatcher will assign loads here. Make sure you're set to available.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  greeting: { fontSize: FontSize.sm, color: Colors.textSecondary },
  driverName: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5 },
  avatarBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.base },
  statusCard: { padding: Spacing.md, marginBottom: Spacing.lg },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '500' },
  statusValue: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textPrimary, marginTop: 1 },
  section: { marginBottom: Spacing.lg },
  activeLoadCard: { padding: Spacing.md, borderColor: Colors.accent + '40', borderWidth: 1.5 },
  activeLoadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  routeContainer: { gap: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeText: { flex: 1, fontSize: FontSize.base, fontWeight: '500', color: Colors.textPrimary },
  routeLine: { width: 2, height: 16, backgroundColor: Colors.border, marginLeft: 3 },
  activeLoadFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  payoutLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  payoutValue: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.success },
  loadCard: { padding: Spacing.md, marginBottom: Spacing.sm },
  loadCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  loadType: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  loadPayout: { fontSize: FontSize.md, fontWeight: '700', color: Colors.accent },
  routeMini: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  routeMiniFrom: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500' },
  routeMiniTo: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500' },
  loadWeight: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  emptyContainer: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.lg },
});
