import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { loadsApi } from '../../services/api';
import { Button, Badge } from '../../components/ui';
import { Colors, Spacing, FontSize, BorderRadius, Shadow, getLoadStatusColor, getLoadStatusLabel } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { emitLocationUpdate } from '../../services/socket';

export default function TripScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { load } = route.params;
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentLoad, setCurrentLoad] = useState(load);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    async function startTracking() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setCurrentLocation({ lat: latitude, lng: longitude });
      emitLocationUpdate(latitude, longitude);

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 15000, distanceInterval: 50 },
        (loc) => {
          setCurrentLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          emitLocationUpdate(loc.coords.latitude, loc.coords.longitude);
        }
      );
    }

    startTracking();
    return () => { sub?.remove(); };
  }, []);

  const startMutation = useMutation({
    mutationFn: () => loadsApi.startTrip(currentLoad.id),
    onSuccess: (res) => {
      const updatedLoad = { ...currentLoad, status: 'EN_ROUTE_PICKUP' };
      setCurrentLoad(updatedLoad);
      queryClient.invalidateQueries({ queryKey: ['activeLoad'] });
      queryClient.invalidateQueries({ queryKey: ['myLoads'] });
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.message || 'Failed.'),
  });

  const pickupMutation = useMutation({
    mutationFn: () => loadsApi.pickup(currentLoad.id),
    onSuccess: () => {
      setCurrentLoad({ ...currentLoad, status: 'PICKED_UP' });
      queryClient.invalidateQueries({ queryKey: ['activeLoad'] });
      queryClient.invalidateQueries({ queryKey: ['myLoads'] });
      Alert.alert('Cargo Picked Up!', 'Now en route to delivery destination.');
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.message || 'Failed.'),
  });

  const handleOpenMaps = (lat: number, lng: number, label: string) => {
    const scheme = Platform.OS === 'ios' ? 'maps:' : 'geo:';
    const url = Platform.OS === 'ios'
      ? `maps:?q=${label}&ll=${lat},${lng}`
      : `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) Linking.openURL(url);
      else Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
    });
  };

  const getActionButton = () => {
    switch (currentLoad.status) {
      case 'ACCEPTED':
        return (
          <Button
            title="Start Trip — En Route to Pickup"
            onPress={() => {
              Alert.alert('Start Trip?', 'Confirm you are heading to the pickup location.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Start', onPress: () => startMutation.mutate() },
              ]);
            }}
            loading={startMutation.isPending}
            icon={<Ionicons name="navigate" size={18} color={Colors.white} />}
          />
        );
      case 'EN_ROUTE_PICKUP':
        return (
          <View style={styles.actionGroup}>
            <Button
              title="Arrived at Pickup"
              onPress={() => {
                Alert.alert('Confirm Pickup Arrival?', 'Tap confirm when you arrive at the pickup location.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Confirm', onPress: () => pickupMutation.mutate() },
                ]);
              }}
              loading={pickupMutation.isPending}
              variant="success"
              icon={<Ionicons name="location" size={18} color={Colors.white} />}
            />
            <Button
              title="Navigate to Pickup"
              onPress={() => handleOpenMaps(currentLoad.pickupLat, currentLoad.pickupLng, 'Pickup')}
              variant="ghost"
            />
          </View>
        );
      case 'PICKED_UP':
        return (
          <View style={styles.actionGroup}>
            <Button
              title="Cargo Picked Up — Deliver Now"
              onPress={() => navigation.navigate('ProofOfDelivery', { load: currentLoad })}
              variant="success"
              icon={<Ionicons name="checkmark-done-circle" size={18} color={Colors.white} />}
            />
            <Button
              title="Navigate to Delivery"
              onPress={() => handleOpenMaps(currentLoad.deliveryLat, currentLoad.deliveryLng, 'Delivery')}
              variant="ghost"
            />
          </View>
        );
      case 'EN_ROUTE_DELIVERY':
        return (
          <Button
            title="Confirm Delivery"
            onPress={() => navigation.navigate('ProofOfDelivery', { load: currentLoad })}
            variant="success"
            icon={<Ionicons name="cube" size={18} color={Colors.white} />}
          />
        );
      default:
        return null;
    }
  };

  const mapRegion = {
    latitude: currentLoad.pickupLat,
    longitude: currentLoad.pickupLng,
    latitudeDelta: Math.abs(currentLoad.deliveryLat - currentLoad.pickupLat) * 1.5 + 0.1,
    longitudeDelta: Math.abs(currentLoad.deliveryLng - currentLoad.pickupLng) * 1.5 + 0.1,
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={mapRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Pickup marker */}
        <Marker
          coordinate={{ latitude: currentLoad.pickupLat, longitude: currentLoad.pickupLng }}
          title="Pickup"
          description={currentLoad.pickupAddress}
          pinColor={Colors.success}
        />

        {/* Delivery marker */}
        <Marker
          coordinate={{ latitude: currentLoad.deliveryLat, longitude: currentLoad.deliveryLng }}
          title="Delivery"
          description={currentLoad.deliveryAddress}
          pinColor={Colors.danger}
        />

        {/* Route line */}
        <Polyline
          coordinates={[
            { latitude: currentLoad.pickupLat, longitude: currentLoad.pickupLng },
            { latitude: currentLoad.deliveryLat, longitude: currentLoad.deliveryLng },
          ]}
          strokeColor={Colors.accent}
          strokeWidth={3}
          lineDashPattern={[10, 5]}
        />
      </MapView>

      {/* Back button overlay */}
      <SafeAreaView style={styles.overlay} edges={['top']}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom panel */}
      <SafeAreaView style={styles.panel} edges={['bottom']}>
        {/* Status + route summary */}
        <View style={styles.panelHeader}>
          <Badge label={getLoadStatusLabel(currentLoad.status)} color={getLoadStatusColor(currentLoad.status)} size="md" />
        </View>

        <View style={styles.routeSummary}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.routePointText} numberOfLines={1}>{currentLoad.pickupAddress}</Text>
          </View>
          <Ionicons name="arrow-down" size={14} color={Colors.textMuted} style={styles.routeArrow} />
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: Colors.danger }]} />
            <Text style={styles.routePointText} numberOfLines={1}>{currentLoad.deliveryAddress}</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {getActionButton()}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.md,
  },
  panel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    ...Shadow.lg,
  },
  panelHeader: { marginBottom: Spacing.sm },
  routeSummary: { marginBottom: Spacing.md },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 4 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routePointText: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500' },
  routeArrow: { marginLeft: 4, marginVertical: 2 },
  actions: { gap: Spacing.sm, marginBottom: Spacing.sm },
  actionGroup: { gap: Spacing.sm },
});
