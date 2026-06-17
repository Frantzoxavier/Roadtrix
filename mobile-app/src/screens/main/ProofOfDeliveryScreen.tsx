import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, TextInput, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { loadsApi } from '../../services/api';
import { Button, Card } from '../../components/ui';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProofOfDeliveryScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { load } = route.params;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    const permissionFn = useCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;

    const { status } = await permissionFn();
    if (status !== 'granted') {
      Alert.alert('Permission Required', `Please allow ${useCamera ? 'camera' : 'photo library'} access.`);
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsEditing: true,
          aspect: [4, 3],
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsEditing: true,
          aspect: [4, 3],
        });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert('Add Photo', 'Choose a source for your proof of delivery photo.', [
      { text: 'Take Photo', onPress: () => pickImage(true) },
      { text: 'Choose from Library', onPress: () => pickImage(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    if (!imageUri) {
      Alert.alert('Photo Required', 'Please add a proof of delivery photo.');
      return;
    }
    if (!recipientName.trim()) {
      Alert.alert('Recipient Required', 'Please enter the recipient\'s name.');
      return;
    }

    Alert.alert(
      'Confirm Delivery',
      `Submit delivery confirmation for ${load.deliveryAddress}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Delivery',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const formData = new FormData();
              const filename = imageUri.split('/').pop() || 'pod.jpg';
              const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
              const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

              formData.append('podImage', {
                uri: imageUri,
                name: filename,
                type: mimeType,
              } as any);
              formData.append('recipientName', recipientName.trim());
              if (notes.trim()) formData.append('notes', notes.trim());

              await loadsApi.deliver(load.id, formData);

              queryClient.invalidateQueries({ queryKey: ['myLoads'] });
              queryClient.invalidateQueries({ queryKey: ['activeLoad'] });

              Alert.alert(
                '🎉 Delivery Confirmed!',
                'Great work! Your delivery has been recorded. Payment will be processed by your dispatcher.',
                [{ text: 'Back to Home', onPress: () => navigation.navigate('MainTabs') }]
              );
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to submit delivery. Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Proof of Delivery</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Destination info */}
        <Card style={styles.destinationCard}>
          <View style={styles.destinationRow}>
            <View style={styles.destinationIcon}>
              <Ionicons name="location" size={20} color={Colors.danger} />
            </View>
            <View style={styles.destinationInfo}>
              <Text style={styles.destinationLabel}>DELIVERY ADDRESS</Text>
              <Text style={styles.destinationAddress}>{load.deliveryAddress}</Text>
            </View>
          </View>
        </Card>

        {/* Photo capture */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Photo</Text>
          <Text style={styles.sectionSubtitle}>Take a photo of the delivered cargo</Text>

          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.podImage} resizeMode="cover" />
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={showImageOptions}
              >
                <Ionicons name="camera" size={16} color={Colors.white} />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.photoPicker} onPress={showImageOptions} activeOpacity={0.8}>
              <View style={styles.photoPickerIcon}>
                <Ionicons name="camera-outline" size={36} color={Colors.accent} />
              </View>
              <Text style={styles.photoPickerTitle}>Add Photo</Text>
              <Text style={styles.photoPickerSubtitle}>Tap to take or choose a photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recipient name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipient Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Recipient Name *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder="John Smith"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Additional Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Left at front door, signature obtained, etc."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Submit */}
        <Button
          title="Submit Delivery Confirmation"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!imageUri || !recipientName.trim()}
          variant="success"
          size="lg"
          icon={<Ionicons name="checkmark-circle" size={20} color={Colors.white} />}
          style={styles.submitButton}
        />

        <Text style={styles.disclaimer}>
          By submitting, you confirm the cargo was delivered to the address above.
        </Text>
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
  content: { padding: Spacing.md, paddingBottom: 40, gap: Spacing.lg },

  destinationCard: {
    padding: Spacing.md,
    borderColor: Colors.danger + '30',
    borderWidth: 1.5,
  },
  destinationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  destinationIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center', justifyContent: 'center',
  },
  destinationInfo: { flex: 1 },
  destinationLabel: {
    fontSize: FontSize.xs, fontWeight: '700', color: Colors.danger,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  destinationAddress: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },

  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  sectionSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },

  imageContainer: { position: 'relative', borderRadius: BorderRadius.lg, overflow: 'hidden' },
  podImage: { width: '100%', height: 220, borderRadius: BorderRadius.lg },
  retakeButton: {
    position: 'absolute', bottom: Spacing.sm, right: Spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  retakeText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '600' },

  photoPicker: {
    height: 180, borderRadius: BorderRadius.lg,
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.accent + '60',
    backgroundColor: Colors.accentLight,
    alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
  },
  photoPickerIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xs, ...Shadow.sm,
  },
  photoPickerTitle: { fontSize: FontSize.base, fontWeight: '600', color: Colors.accent },
  photoPickerSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },

  inputGroup: { gap: 4 },
  inputLabel: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textSecondary },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md,
    backgroundColor: Colors.white, paddingHorizontal: Spacing.sm,
  },
  inputIcon: { marginRight: Spacing.xs },
  input: {
    flex: 1, height: 48, fontSize: FontSize.base, color: Colors.textPrimary,
  },
  textArea: {
    height: 96, paddingTop: Spacing.sm, paddingHorizontal: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md,
    backgroundColor: Colors.white, textAlignVertical: 'top',
  },

  submitButton: { marginTop: Spacing.sm },
  disclaimer: {
    fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center',
    paddingHorizontal: Spacing.lg, lineHeight: 18,
  },
});
