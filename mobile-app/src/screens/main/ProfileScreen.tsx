import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { driverApi } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { Card, Button, Badge, LoadingScreen } from '../../components/ui';
import { Colors, Spacing, FontSize, BorderRadius, getLoadStatusColor } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['driverProfile'],
    queryFn: driverApi.getProfile,
  });

  const driver = data?.data?.data;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const getStatusColor = (status: string) => {
    if (status === 'AVAILABLE') return Colors.success;
    if (status === 'ON_TRIP') return Colors.accent;
    if (status === 'SUSPENDED') return Colors.danger;
    return Colors.textMuted;
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + name */}
        <View style={styles.heroSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
          <Text style={styles.driverName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.driverEmail}>{user?.email}</Text>
          {driver && (
            <Badge
              label={driver.status.replace('_', ' ')}
              color={getStatusColor(driver.status)}
              size="md"
            />
          )}
        </View>

        {/* Stats row */}
        {driver && (
          <View style={styles.statsRow}>
            {[
              { label: 'Rating', value: `★ ${driver.rating.toFixed(1)}`, color: Colors.warning },
              { label: 'Loads Done', value: driver.assignments?.length?.toString() || '—', color: Colors.accent },
            ].map(({ label, value, color }) => (
              <Card key={label} style={styles.statCard}>
                <Text style={[styles.statValue, { color }]}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </Card>
            ))}
          </View>
        )}

        {/* Contact info */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardTitle}>Contact</Text>
          <View style={styles.infoRows}>
            {[
              { icon: 'call-outline', label: 'Phone', value: user?.phone || '—' },
              { icon: 'mail-outline', label: 'Email', value: user?.email || '—' },
            ].map(({ icon, label, value }) => (
              <View key={label} style={styles.infoRow}>
                <View style={styles.infoRowIcon}>
                  <Ionicons name={icon as any} size={16} color={Colors.accent} />
                </View>
                <View style={styles.infoRowContent}>
                  <Text style={styles.infoRowLabel}>{label}</Text>
                  <Text style={styles.infoRowValue}>{value}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Vehicle info */}
        {driver && (
          <Card style={styles.infoCard}>
            <Text style={styles.cardTitle}>Vehicle</Text>
            <View style={styles.infoRows}>
              {[
                { icon: 'car-outline', label: 'Make & Model', value: `${driver.vehicleMake} ${driver.vehicleModel}` },
                { icon: 'layers-outline', label: 'Type', value: driver.vehicleType },
                { icon: 'card-outline', label: 'Plate', value: driver.plateNumber },
              ].map(({ icon, label, value }) => (
                <View key={label} style={styles.infoRow}>
                  <View style={styles.infoRowIcon}>
                    <Ionicons name={icon as any} size={16} color={Colors.accent} />
                  </View>
                  <View style={styles.infoRowContent}>
                    <Text style={styles.infoRowLabel}>{label}</Text>
                    <Text style={styles.infoRowValue}>{value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* License */}
        {driver && (
          <Card style={styles.infoCard}>
            <Text style={styles.cardTitle}>License</Text>
            <View style={styles.infoRows}>
              {[
                { icon: 'shield-checkmark-outline', label: 'License Number', value: driver.licenseNumber },
                { icon: 'calendar-outline', label: 'Expiration', value: new Date(driver.licenseExpiration).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
              ].map(({ icon, label, value }) => (
                <View key={label} style={styles.infoRow}>
                  <View style={styles.infoRowIcon}>
                    <Ionicons name={icon as any} size={16} color={Colors.accent} />
                  </View>
                  <View style={styles.infoRowContent}>
                    <Text style={styles.infoRowLabel}>{label}</Text>
                    <Text style={styles.infoRowValue}>{value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Sign out */}
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="danger"
          style={styles.signOutButton}
          icon={<Ionicons name="log-out-outline" size={18} color={Colors.white} />}
        />

        <Text style={styles.version}>RoadTrix Driver App v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: 100, gap: Spacing.md },

  heroSection: {
    alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  driverName: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.3 },
  driverEmail: { fontSize: FontSize.sm, color: Colors.textSecondary },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, padding: Spacing.md, alignItems: 'center', gap: 4 },
  statValue: { fontSize: FontSize.xl, fontWeight: '800' },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '500' },

  infoCard: { padding: Spacing.md },
  cardTitle: {
    fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm,
  },
  infoRows: { gap: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  infoRowIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.accentLight,
    alignItems: 'center', justifyContent: 'center',
  },
  infoRowContent: { flex: 1 },
  infoRowLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '500' },
  infoRowValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500', marginTop: 1 },

  signOutButton: { marginTop: Spacing.sm },
  version: { fontSize: FontSize.xs, color: Colors.textLight, textAlign: 'center', marginTop: Spacing.sm },
});
