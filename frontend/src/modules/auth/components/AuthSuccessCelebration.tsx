import { color, radius, space } from '@manabandhu/design-system';
import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

interface AuthSuccessCelebrationProps {
  userName?: string;
  title?: string;
  subtitle?: string;
  onComplete: () => void;
}

export function AuthSuccessCelebration({
  userName,
  title = 'Welcome to ManaBandhu! 🎉',
  subtitle = 'Your verified session is ready. Redirecting you home...',
  onComplete,
}: AuthSuccessCelebrationProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation loop
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();

    // Progress bar animation to 100% then call onComplete
    const timer = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1300,
      useNativeDriver: false,
    });

    timer.start(({ finished }) => {
      if (finished) {
        onComplete();
      }
    });

    return () => {
      pulseLoop.stop();
      timer.stop();
    };
  }, [fadeAnim, scaleAnim, progressAnim, pulseAnim, onComplete]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onComplete}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Glowing Badge Ring */}
          <View style={styles.badgeContainer}>
            <Animated.View style={[styles.glowRing, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.iconCircle}>
              <AppIcon name="check" size={32} color="#ffffff" strokeWidth={3} />
            </View>
            <View style={styles.sparkleTop}>
              <AppIcon name="sparks" size={20} color={color.warm} />
            </View>
            <View style={styles.sparkleBottom}>
              <AppIcon name="star" size={16} color={color.teal} />
            </View>
          </View>

          {/* Member Trust Pill */}
          <View style={styles.trustPill}>
            <AppIcon name="shield" size={14} color={color.teal} />
            <Text style={styles.trustPillText}>Verified Desi Community Member</Text>
          </View>

          {/* Headline */}
          <Text style={styles.title}>{title}</Text>
          {userName ? <Text style={styles.greeting}>Hello, {userName}!</Text> : null}
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Animated Progress Bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>

          {/* Instant Skip Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue to home"
            onPress={onComplete}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>Enter Dashboard Now →</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    padding: space.x4,
    width: '100%',
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 28,
    elevation: 20,
    maxWidth: 420,
    paddingHorizontal: space.x6,
    paddingVertical: space.x6,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    width: '100%',
  },
  badgeContainer: {
    alignItems: 'center',
    height: 88,
    justifyContent: 'center',
    marginBottom: space.x3,
    position: 'relative',
    width: 88,
  },
  glowRing: {
    backgroundColor: 'rgba(0, 105, 107, 0.18)',
    borderRadius: 44,
    height: 88,
    position: 'absolute',
    width: 88,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: color.teal,
    borderRadius: 34,
    elevation: 8,
    height: 68,
    justifyContent: 'center',
    shadowColor: color.teal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    width: 68,
  },
  sparkleTop: {
    position: 'absolute',
    right: -4,
    top: -2,
  },
  sparkleBottom: {
    bottom: -2,
    left: -4,
    position: 'absolute',
  },
  trustPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 105, 107, 0.10)',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 6,
    marginBottom: space.x3,
    paddingHorizontal: space.x3,
    paddingVertical: 5,
  },
  trustPillText: {
    color: color.teal,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  title: {
    color: color.ink,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: space.x1,
    textAlign: 'center',
  },
  greeting: {
    color: color.primary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: space.x1,
    textAlign: 'center',
  },
  subtitle: {
    color: color.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: space.x5,
    textAlign: 'center',
  },
  progressTrack: {
    backgroundColor: 'rgba(67, 30, 190, 0.08)',
    borderRadius: 4,
    height: 6,
    marginBottom: space.x5,
    overflow: 'hidden',
    width: '100%',
  },
  progressBar: {
    backgroundColor: color.primary,
    borderRadius: 4,
    height: '100%',
  },
  ctaButton: {
    alignItems: 'center',
    backgroundColor: color.primary,
    borderRadius: radius.pill,
    paddingHorizontal: space.x5,
    paddingVertical: space.x3,
    width: '100%',
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
