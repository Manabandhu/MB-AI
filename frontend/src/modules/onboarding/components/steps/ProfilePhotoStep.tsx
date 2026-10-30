import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import type { StepProps } from './types';

/** Step 5: Profile Photo & Bio */
export function ProfilePhotoStep({ flow, styles, colors }: StepProps) {
  const { bio, setBio, avatarUrl, avatarUpload, chooseAvatar } = flow;
  return (
    <View style={styles.stepContainer}>
      <View style={styles.photoContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>MB</Text>
          </View>
        )}
        <Pressable
          accessibilityLabel={avatarUrl ? 'Change profile photo' : 'Add a profile photo'}
          accessibilityRole="button"
          disabled={avatarUpload.state.status === 'uploading'}
          hitSlop={8}
          onPress={chooseAvatar}
          style={styles.cameraBadge}
        >
          <AppIcon color={colors.surface} name="user" size={18} />
        </Pressable>
      </View>
      <Text style={styles.photoHint}>
        {avatarUpload.state.status === 'uploading'
          ? `Uploading photo… ${avatarUpload.state.progress}%`
          : 'A friendly photo helps roommates and carpool partners recognize you'}
      </Text>
      {avatarUpload.state.status === 'error' ? (
        <Text accessibilityRole="alert" style={styles.photoError}>
          {avatarUpload.state.message}
        </Text>
      ) : null}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Short 1-line Bio (Optional)</Text>
        <TextInput
          maxLength={160}
          multiline
          numberOfLines={2}
          onChangeText={setBio}
          placeholder="e.g., Software engineer in Irving, foodie, weekend badminton player..."
          placeholderTextColor={colors.muted}
          style={[styles.textInput, { minHeight: 70, textAlignVertical: 'top' }]}
          value={bio}
        />
      </View>
    </View>
  );
}
