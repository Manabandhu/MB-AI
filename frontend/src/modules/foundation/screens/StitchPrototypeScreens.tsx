import { color as baseColors, space } from '@manabandhu/design-system';
import type { Href } from 'expo-router';
import { Link, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { welcomeLogo } from '@/modules/foundation/welcomeAssets';

const colors = {
  ...baseColors,
  appPrimary: '#2c0096',
  primaryContainer: '#5b3fd6',
  surfaceContainer: '#eaedff',
  surfaceContainerLow: '#f2f3ff',
  surfaceContainerHigh: '#e2e7ff',
  appShellSurface: '#efedf4',
  warm: '#ff7e33',
};

const welcomeImages = {
  help: 'https://lh3.googleusercontent.com/aida/AP1WRLuihH-mSVxYhIAX0g3XSpYMHRaSs0kbK5uQCKWYinPX-8Gkfl0D6QOOYna7jkBL-XBFoAgVulXErCpyQxyPCXcAFjLvy8jUchV2mluO1-uL1mm0N53J5icFnoXEut4vWkPDovzsDhbjMYB3SbmrvZvVAFyhDinQIniIh2UHI3jjzSfcdaU86ZtypYnANXAoePqFb5RoSedJnEh9vDlYoCc5JD_MXTe_2yhbvQKJTTzwkevVyWz28B_ktfg',
  trust:
    'https://lh3.googleusercontent.com/aida/AP1WRLtUf2ODs2thv2Z3Tn-zrq2aaYnq5daSL9KBeeHzLFYPNJDJO4vD7UcsoIaltEvAbFrubE_vZrNGdGO7BzEX972UyQL9JthY2LS5FgRQMeLeAS43Xo2flktTuSUyxHVbfsTJ4G76kcuaR1yjJrSb6yZIoYTXfaPKaAkfNWGohBFMJV2Oa5QuO7-okaQO5kx7T2Gw7fqG8KggE0Vdny10VVgAS-d0JbHYNSThckQ6FCLQaVD-scfhzIQK9x8',
  life: 'https://lh3.googleusercontent.com/aida/AP1WRLsnX0Z0wRXO1bksJlF36mVKcxGpWmLHDKh29_dDO-daHA-WP1kZN6-es7SZecpR_E9zdLoffF80G3fOX9M0i3_caLaWhTKfh0-eg85lYLp4mxvpEOp4DdqjjekgMhByhMLrJggPuIra_sofSIGmHJ6DnTE4EOKEaGGD04XoInVhxLtiYar_nTsvhPklWvpaxQOZ_9-FLtTUoVx71PxgUfThSVk0lbXBgQ0v1ODZt0a9mZ_Z62QyFc52xCs',
};

const demoUser = {
  email: 'demo@manabandhu.local',
  password: 'DemoPass123',
};

export function StitchSplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => router.replace('/welcome'), 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.splash}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace('/welcome')}
        style={styles.splashInner}
      >
        <Image accessibilityIgnoresInvertColors source={welcomeLogo} style={styles.splashLogo} />
        <Text style={styles.splashBrand}>ManaBandhu</Text>
        <Text style={styles.splashTagline}>Your trusted community, wherever you are.</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const welcomeSteps = [
  {
    title: 'Find the help you need',
    body: 'Rooms, rides, jobs, local services, and useful information in one friendly app.',
    image: welcomeImages.help,
    action: 'Next',
  },
  {
    title: 'Connect with people you can trust',
    body: 'Ask questions, join communities, chat safely, and meet people nearby.',
    image: welcomeImages.trust,
    action: 'Next',
  },
  {
    title: 'Make everyday life easier.',
    body: 'Share expenses, find events, track packages, and stay organized.',
    image: welcomeImages.life,
    action: 'Next',
  },
  {
    title: 'Welcome to ManaBandhu',
    body: 'Your global community for meaningful connections and support is ready.',
    image: null,
    action: 'Get Started',
  },
];

export function StitchWelcomeFlowScreen() {
  const [index, setIndex] = useState(0);
  const step = welcomeSteps[index];
  const isFinal = index === welcomeSteps.length - 1;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 24 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -50) advance();
        if (gesture.dx > 50) setIndex((current) => Math.max(current - 1, 0));
      },
    }),
  ).current;

  function advance() {
    if (isFinal) router.push('/sign-in');
    else setIndex((current) => Math.min(current + 1, welcomeSteps.length - 1));
  }

  return (
    <SafeAreaView style={styles.welcomeSafe}>
      <View style={styles.welcomePage} {...panResponder.panHandlers}>
        <View style={styles.welcomeTop}>
          {isFinal ? <Text style={styles.skip}>Skip</Text> : <Text />}
        </View>
        <View style={[styles.welcomeVisual, isFinal && styles.welcomeLogoFrame]}>
          {step.image ? (
            <Image source={{ uri: step.image }} style={styles.welcomeImage} />
          ) : (
            <Image source={welcomeLogo} style={styles.welcomeLogo} />
          )}
        </View>
        <View style={styles.welcomeCopy}>
          <Text style={styles.welcomeTitle}>{step.title}</Text>
          <Text style={styles.welcomeBody}>{step.body}</Text>
        </View>
        <View style={styles.dots}>
          {welcomeSteps.map((item, dotIndex) => (
            <View key={item.title} style={[styles.dot, dotIndex === index && styles.dotActive]} />
          ))}
        </View>
        <Pressable accessibilityRole="button" onPress={advance} style={styles.primaryPill}>
          <Text style={styles.primaryPillText}>{step.action}</Text>
        </Pressable>
        {isFinal ? (
          <>
            <Link href="/sign-in" asChild>
              <Pressable accessibilityRole="button" style={styles.secondaryPill}>
                <Text style={styles.secondaryPillText}>Sign In</Text>
              </Pressable>
            </Link>
            <Text style={styles.safeNote}>
              Your data is safe and private. We never share your personal information.
            </Text>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

type AuthKind =
  | 'sign-in'
  | 'create-account'
  | 'choose'
  | 'phone'
  | 'email'
  | 'otp'
  | 'forgot'
  | 'reset';

const authCopy = {
  'sign-in': {
    title: 'Sign In',
    body: 'Welcome back to your community.',
    fields: ['Email or phone'],
    action: 'Continue',
    next: '/choose-login-method',
  },
  'create-account': {
    title: 'Create Account',
    body: 'Join ManaBandhu and start building your trusted community.',
    fields: ['Full name', 'Email or phone'],
    action: 'Create account',
    next: '/choose-login-method',
  },
  choose: {
    title: 'Choose Login Method',
    body: 'Pick how you would like to continue.',
    fields: [],
    action: 'Continue with phone',
    next: '/phone-login',
  },
  phone: {
    title: 'Phone Login',
    body: 'Enter your mobile number to receive a secure code.',
    fields: ['Phone number'],
    action: 'Send code',
    next: '/otp-verification',
  },
  email: {
    title: 'Email Login',
    body: 'Use your email to continue into ManaBandhu.',
    fields: ['Email address'],
    action: 'Continue',
    next: '/otp-verification',
  },
  otp: {
    title: 'OTP Verification',
    body: 'Enter the verification code we sent you.',
    fields: ['Verification code'],
    action: 'Verify',
    next: '/forgot-password',
  },
  forgot: {
    title: 'Forgot Password',
    body: 'Enter your email and we will help you reset access.',
    fields: ['Email address'],
    action: 'Send reset link',
    next: '/reset-password',
  },
  reset: {
    title: 'Reset Password',
    body: 'Create a new password for your account.',
    fields: ['New password', 'Confirm password'],
    action: 'Reset password',
    next: '/onboarding',
  },
} satisfies Record<
  AuthKind,
  { title: string; body: string; fields: string[]; action: string; next: string }
>;

export function StitchAuthScreen({ kind }: { kind: AuthKind }) {
  const copy = authCopy[kind];
  return (
    <ScreenChrome showBack title="ManaBandhu">
      <View style={styles.authHero}>
        <Image source={welcomeLogo} style={styles.authLogo} />
        <Text style={styles.authTitle}>{copy.title}</Text>
        <Text style={styles.authBody}>{copy.body}</Text>
      </View>
      <View style={styles.form}>
        {copy.fields.map((field) => (
          <View key={field} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{field}</Text>
            <TextInput placeholder={`Enter your ${field.toLowerCase()}`} style={styles.input} />
          </View>
        ))}
        {kind === 'sign-in' ? (
          <View style={styles.demoCredentials}>
            <Text style={styles.demoTitle}>Test user</Text>
            <Text style={styles.demoLine}>Email: {demoUser.email}</Text>
            <Text style={styles.demoLine}>Password: {demoUser.password}</Text>
            <Button label="Use demo account" route="/home" secondary />
          </View>
        ) : null}
        {kind === 'choose' ? (
          <View style={styles.socialStack}>
            <Button label="Continue with Google" route="/email-login" secondary />
            <Button label="Continue with Apple" route="/email-login" secondary />
          </View>
        ) : null}
        {kind === 'sign-in' ? (
          <Link href="/forgot-password">
            <Text style={styles.forgot}>Forgot password?</Text>
          </Link>
        ) : null}
        <Button label={copy.action} route={copy.next} />
        <Text style={styles.orText}>or</Text>
        <Button
          label={kind === 'sign-in' ? 'Create account' : 'Sign In'}
          route={kind === 'sign-in' ? '/sign-up' : '/sign-in'}
          secondary
        />
      </View>
      <View style={styles.privacyChip}>
        <Text style={styles.privacyText}>Your data is safe and private.</Text>
      </View>
    </ScreenChrome>
  );
}

type OnboardingKind =
  | 'about'
  | 'photo'
  | 'reason'
  | 'location'
  | 'languages'
  | 'interests'
  | 'notifications'
  | 'trust'
  | 'complete';

const onboardingSteps = {
  about: {
    step: 1,
    title: 'About You',
    body: 'Tell us a bit about yourself to get started.',
    inputs: ['First Name', 'Last Name', 'Preferred Name', 'Date of Birth'],
    options: [],
    next: '/onboarding/profile-photo',
  },
  photo: {
    step: 2,
    title: 'Profile Photo',
    body: 'Add a friendly photo so community members can recognize you.',
    inputs: [],
    options: ['Upload Photo', 'Use Initials', 'Skip for now'],
    next: '/onboarding/what-brings-you-here',
  },
  reason: {
    step: 3,
    title: 'What brings you here?',
    body: 'Select the ways ManaBandhu can help you.',
    inputs: [],
    options: [
      'Find a room',
      'Offer or request rides',
      'Find jobs',
      'Join community',
      'Local services',
    ],
    next: '/onboarding/location',
  },
  location: {
    step: 4,
    title: 'Your Location',
    body: 'Use a broad area to personalize discovery while protecting privacy.',
    inputs: ['City or neighborhood'],
    options: ['Use current location', 'Set manually'],
    next: '/onboarding/languages',
  },
  languages: {
    step: 5,
    title: 'Languages',
    body: 'Choose languages you are comfortable using.',
    inputs: [],
    options: ['English', 'Telugu', 'Hindi', 'Tamil', 'Kannada', 'Spanish'],
    next: '/onboarding/interests',
  },
  interests: {
    step: 6,
    title: 'Interests',
    body: 'Tune your home feed with what matters most.',
    inputs: [],
    options: ['Rooms', 'Rides', 'Jobs', 'Events', 'Immigration', 'Marketplace', 'Safety'],
    next: '/onboarding/notifications',
  },
  notifications: {
    step: 7,
    title: 'Notifications',
    body: 'Choose how ManaBandhu should keep you updated.',
    inputs: [],
    options: ['Room matches', 'Ride updates', 'Community replies', 'Safety alerts'],
    next: '/onboarding/trust-and-safety',
  },
  trust: {
    step: 8,
    title: 'Trust & Safety',
    body: 'Review privacy, reporting, and trusted contact settings.',
    inputs: [],
    options: ['Verify profile', 'Add trusted contact', 'Review safety tips'],
    next: '/onboarding/complete',
  },
  complete: {
    step: 9,
    title: 'You’re all set',
    body: 'Your ManaBandhu community is ready.',
    inputs: [],
    options: ['Explore home', 'Find a room', 'Offer a ride'],
    next: '/home',
  },
} satisfies Record<
  OnboardingKind,
  { step: number; title: string; body: string; inputs: string[]; options: string[]; next: string }
>;

export function StitchOnboardingScreen({ kind }: { kind: OnboardingKind }) {
  const step = onboardingSteps[kind];
  return (
    <ScreenChrome title="ManaBandhu">
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(step.step / 9, 1) * 100}%` }]} />
        </View>
        <Text style={styles.stepText}>Step {Math.min(step.step, 5)} of 5</Text>
      </View>
      <Text style={styles.onboardingTitle}>{step.title}</Text>
      <Text style={styles.onboardingBody}>{step.body}</Text>
      <View style={styles.form}>
        {kind === 'photo' ? (
          <View style={styles.photoCircle}>
            <Text style={styles.photoInitials}>S</Text>
          </View>
        ) : null}
        {step.inputs.map((input) => (
          <View key={input} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{input}</Text>
            <TextInput placeholder={input} style={styles.input} />
          </View>
        ))}
        {step.options.length ? (
          <View style={styles.optionGrid}>
            {step.options.map((option) => (
              <Pressable key={option} style={styles.optionChip}>
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
      <View style={styles.stickyFooter}>
        <Button label={kind === 'complete' ? 'Go to Home' : 'Continue'} route={step.next} />
      </View>
    </ScreenChrome>
  );
}

type ShellKind = 'home' | 'chat' | 'explore' | 'community' | 'profile';

const tabs = [
  { key: 'home', label: 'Home', route: '/home', shortLabel: 'Home' },
  { key: 'chat', label: 'Chat', route: '/chat', shortLabel: 'Chat' },
  { key: 'explore', label: 'Explore', route: '/explore', shortLabel: 'Explore' },
  { key: 'community', label: 'Community', route: '/community', shortLabel: 'Community' },
  { key: 'profile', label: 'Profile', route: '/profile', shortLabel: 'Profile' },
] as const;

export function StitchAppShellScreen({ kind }: { kind: ShellKind }) {
  return (
    <SafeAreaView style={styles.shellSafe}>
      <View style={styles.shellHeader}>
        <View style={styles.brandRow}>
          <Image source={welcomeLogo} style={styles.headerLogo} />
          <Text style={styles.shellTitle}>{titleCase(kind)}</Text>
        </View>
        <View style={styles.headerActions}>
          <Link href="/notifications">
            <Text style={styles.headerLink}>Alerts</Text>
          </Link>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarText}>MB</Text>
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.shellContent}>
        {kind === 'home' ? <HomeShell /> : null}
        {kind === 'chat' ? <ChatShell /> : null}
        {kind === 'explore' ? <ExploreShell /> : null}
        {kind === 'community' ? <CommunityShell /> : null}
        {kind === 'profile' ? <ProfileShell /> : null}
      </ScrollView>
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <Link key={tab.key} href={tab.route} asChild>
            <Pressable style={styles.tab}>
              <Text style={[styles.tabLabel, tab.key === kind && styles.tabActive]}>
                {tab.shortLabel}
              </Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </SafeAreaView>
  );
}

function ScreenChrome({
  title,
  children,
}: {
  title: string;
  showBack?: boolean;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.authHeader}>
        <View style={styles.brandRow}>
          <Image source={welcomeLogo} style={styles.headerLogo} />
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarText}>MB</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.authContent}>{children}</ScrollView>
    </SafeAreaView>
  );
}

function Button({
  label,
  route,
  secondary = false,
}: {
  label: string;
  route: string;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(route as Href)}
      style={[styles.actionButton, secondary && styles.secondaryButton]}
    >
      <Text style={[styles.actionButtonText, secondary && styles.secondaryButtonText]}>
        {label}
      </Text>
    </Pressable>
  );
}

function HomeShell() {
  return (
    <>
      <View style={styles.heroBlock}>
        <Text style={styles.display}>Hello, Surya! 👋</Text>
        <Text style={styles.lead}>Here’s what’s happening in your community today.</Text>
      </View>
      <View style={styles.bentoGrid}>
        <Link href="/rooms" asChild>
          <Pressable style={styles.largeAction}>
            <Text style={styles.largeActionTitle}>Find a Room</Text>
            <Text style={styles.largeActionBody}>Browse shared spaces & apartments</Text>
          </Pressable>
        </Link>
        <MiniAction label="Offer a Ride" route="/rides/offer" />
        <MiniAction label="Ask a Question" route="/community" />
      </View>
      <SectionTitle title="For You" />
      <View style={styles.horizontalCards}>
        <ImageCard
          image="https://lh3.googleusercontent.com/aida-public/AB6AXuAyUigpCMPxDs43S2hib_i5VB-rtt1kfqIu6nV4OVbVDw6Sk6k_U0HN6cLkGfTl-wX6sXPwQFpxrG3hU5_zNOdbA937Us-Rabbtpbo18JBRijXY5bV4wWz0o1qiTB2TNWyosxtqYUJp00_LPQjEqCNo5X2kYuKUhQdT8MNiksIpSHwt37PLgQ-tJh9soFRwHy3KZZhU2GczR1jlFsk2b-ra85_M10W93gACL-P-93_GSY43EUVR5mpa"
          meta="$850/mo"
          title="Sunny room in Downtown"
        />
        <InfoCard
          accent
          title="Tech Meetup & Mixer"
          body="Sat, Oct 14 • 6:00 PM"
          meta="Community Event"
        />
      </View>
      <SectionTitle title="Trending in your area" />
      <FeedItem
        title="Ride offered to SF"
        body="Driving from SJ to SF this Friday at 5 PM. Have 2 seats available."
      />
      <FeedItem
        title="Kiran asked a question"
        body="Does anyone know a good, affordable moving service for a 1BHK?"
      />
    </>
  );
}

function ChatShell() {
  return (
    <>
      <View style={styles.searchBox}>
        <Text style={styles.muted}>search</Text>
      </View>
      <View style={styles.segmentRow}>
        {['All', 'Groups', 'Support'].map((item, index) => (
          <Text key={item} style={[styles.segment, index === 0 && styles.segmentActive]}>
            {item}
          </Text>
        ))}
      </View>
      {[
        ['Sarah Jenkins', 'Are we still on for coffee later? ☕️', '10:42 AM'],
        ['Design Team', 'I uploaded the new assets to the drive.', 'Yesterday'],
        ['Marcus Chen', 'Thanks for the help yesterday!', 'Mon'],
        ['Dog Walkers Club', 'Elena: We are meeting at the park at 8am!', 'Sun'],
      ].map(([title, body, time]) => (
        <FeedItem key={title} title={title} body={body} meta={time} />
      ))}
    </>
  );
}

function ExploreShell() {
  return (
    <>
      <View style={styles.searchBox}>
        <Text style={styles.muted}>search</Text>
      </View>
      <View style={styles.categoryGrid}>
        <MiniAction label="Rooms" route="/rooms" />
        <MiniAction label="Rides" route="/rides" />
        <MiniAction label="Jobs" route="/jobs" />
        <MiniAction label="Services" route="/utilities" />
      </View>
      <SectionTitle title="Featured Opportunities" />
      <InfoCard
        title="UX Designer - Contract"
        body="TechFlow Inc. • Downtown"
        meta="Job • 2h ago"
      />
      <InfoCard
        title="Community Tech Meetup"
        body="Central Library • 6:00 PM"
        meta="Event • Tomorrow"
      />
      <InfoCard
        title="Master Bedroom in 2BHK"
        body="$1,200/mo • Mission District"
        meta="Room • 1d ago"
      />
    </>
  );
}

function CommunityShell() {
  return (
    <>
      <View style={styles.searchBox}>
        <Text style={styles.muted}>search</Text>
      </View>
      <View style={styles.segmentRow}>
        {['All', 'Tech & Career', 'Culture', 'Sports'].map((item, index) => (
          <Text key={item} style={[styles.segment, index === 0 && styles.segmentActive]}>
            {item}
          </Text>
        ))}
      </View>
      <SectionTitle title="Your Hubs" />
      <View style={styles.categoryGrid}>
        <MiniAction label="Bay Area Indians" route="/community" />
        <MiniAction label="Telugu Techies" route="/community" />
        <MiniAction label="Create Hub" route="/community" />
      </View>
      <SectionTitle title="Activity Feed" />
      <InfoCard
        title="Priya Reddy"
        body="Planning a casual meetup this Saturday at Dolores Park! We'll bring homemade snacks and maybe a frisbee."
        meta="in Bay Area Indians • 2h ago"
      />
    </>
  );
}

function ProfileShell() {
  return (
    <>
      <View style={styles.profileHero}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>A</Text>
        </View>
        <Text style={styles.profileName}>Aria Thompson</Text>
        <Text style={styles.lead}>San Francisco, CA</Text>
        <Text style={styles.profileBio}>
          UX Designer passionate about crafting digital experiences that feel human and engaging.
          Coffee enthusiast.
        </Text>
      </View>
      <View style={styles.statRow}>
        <Stat value="124" label="Posts" />
        <Stat value="892" label="Connections" />
        <Stat value="4.9" label="Helpful" />
      </View>
      {['Account Settings', 'Trust & Safety', 'Help & Support', 'Privacy Policy', 'Log Out'].map(
        (item) => (
          <FeedItem
            key={item}
            title={item}
            body={
              item === 'Account Settings'
                ? 'Update profile, email, and password'
                : 'Privacy controls and support'
            }
          />
        ),
      )}
    </>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function MiniAction({ label, route }: { label: string; route: string }) {
  return (
    <Link href={route as Href} asChild>
      <Pressable style={styles.miniAction}>
        <Text style={styles.miniLabel}>{label}</Text>
      </Pressable>
    </Link>
  );
}

function ImageCard({ image, title, meta }: { image: string; title: string; meta: string }) {
  return (
    <View style={styles.imageCard}>
      <Image source={{ uri: image }} style={styles.cardImage} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardMeta}>{meta}</Text>
    </View>
  );
}

function InfoCard({
  title,
  body,
  meta,
  accent = false,
}: {
  title: string;
  body: string;
  meta: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.infoCard, accent && styles.infoCardAccent]}>
      <Text style={styles.cardMeta}>{meta}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardBody}>{body}</Text>
    </View>
  );
}

function FeedItem({ title, body, meta }: { title: string; body: string; meta?: string }) {
  return (
    <View style={styles.feedItem}>
      <View style={styles.feedCopy}>
        <View style={styles.feedTop}>
          <Text style={styles.feedTitle}>{title}</Text>
          {meta ? <Text style={styles.feedMeta}>{meta}</Text> : null}
        </View>
        <Text style={styles.cardBody}>{body}</Text>
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  splash: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  splashInner: { alignItems: 'center', gap: space.x3, padding: space.x8 },
  splashLogo: { borderRadius: 28, height: 128, width: 128 },
  splashBrand: { color: colors.primary, fontSize: 36, fontWeight: '800', lineHeight: 44 },
  splashTagline: { color: colors.muted, fontSize: 18, lineHeight: 28, textAlign: 'center' },
  welcomeSafe: { backgroundColor: colors.background, flex: 1 },
  welcomePage: { flex: 1, gap: space.x6, justifyContent: 'center', padding: space.x4 },
  welcomeTop: { minHeight: 28 },
  skip: { alignSelf: 'flex-end', color: colors.primary, fontSize: 14, fontWeight: '700' },
  welcomeVisual: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: 24,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  welcomeLogoFrame: { alignSelf: 'center', borderRadius: 80, height: 160, width: 160 },
  welcomeImage: { height: '100%', width: '100%' },
  welcomeLogo: { borderRadius: 72, height: 144, width: 144 },
  welcomeCopy: { alignItems: 'center', gap: space.x3 },
  welcomeTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    textAlign: 'center',
  },
  welcomeBody: { color: colors.muted, fontSize: 17, lineHeight: 27, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: space.x2, justifyContent: 'center' },
  dot: { backgroundColor: colors.border, borderRadius: 4, height: 8, width: 8 },
  dotActive: { backgroundColor: colors.primary, width: 32 },
  primaryPill: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    minHeight: 56,
    justifyContent: 'center',
  },
  primaryPillText: { color: colors.surface, fontSize: 15, fontWeight: '800' },
  secondaryPill: {
    alignItems: 'center',
    borderRadius: 999,
    minHeight: 52,
    justifyContent: 'center',
  },
  secondaryPillText: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  safeNote: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  authHeader: {
    alignItems: 'center',
    backgroundColor: 'rgba(250,248,255,0.92)',
    flexDirection: 'row',
    height: 64,
    justifyContent: 'space-between',
    paddingHorizontal: space.x4,
  },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: space.x2 },
  headerLogo: { borderRadius: 8, height: 32, width: 32 },
  headerTitle: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  avatarSmall: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  avatarText: { color: colors.surface, fontSize: 11, fontWeight: '900' },
  authContent: { flexGrow: 1, justifyContent: 'center', padding: space.x4 },
  authHero: { alignItems: 'center', gap: space.x2, marginBottom: space.x6 },
  authLogo: { borderRadius: 16, height: 64, width: 64 },
  authTitle: {
    color: colors.ink,
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
    textAlign: 'center',
  },
  authBody: { color: colors.muted, fontSize: 18, lineHeight: 28, textAlign: 'center' },
  form: { gap: space.x4 },
  inputGroup: { gap: space.x2 },
  inputLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    color: colors.ink,
    fontSize: 16,
    minHeight: 56,
    paddingHorizontal: space.x4,
  },
  demoCredentials: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    gap: space.x2,
    padding: space.x4,
  },
  demoTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  demoLine: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  forgot: { alignSelf: 'flex-end', color: colors.primary, fontSize: 12, fontWeight: '700' },
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    minHeight: 56,
    justifyContent: 'center',
  },
  secondaryButton: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  actionButtonText: { color: colors.surface, fontSize: 14, fontWeight: '800' },
  secondaryButtonText: { color: colors.ink },
  socialStack: { gap: space.x3 },
  orText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  privacyChip: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 999,
    flexDirection: 'row',
    gap: space.x2,
    marginTop: space.x6,
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
  },
  privacyText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x2,
    marginBottom: space.x6,
  },
  progressTrack: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 999,
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: colors.primary, borderRadius: 999, height: '100%' },
  stepText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  onboardingTitle: { color: colors.ink, fontSize: 26, fontWeight: '800', lineHeight: 34 },
  onboardingBody: { color: colors.muted, fontSize: 16, lineHeight: 24, marginBottom: space.x6 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3 },
  optionChip: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
  },
  optionText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  photoCircle: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 64,
    height: 128,
    justifyContent: 'center',
    width: 128,
  },
  photoInitials: { color: colors.primary, fontSize: 40, fontWeight: '800' },
  stickyFooter: { marginTop: 'auto', paddingTop: space.x6 },
  shellSafe: { backgroundColor: colors.background, flex: 1 },
  shellHeader: {
    alignItems: 'center',
    backgroundColor: 'rgba(250,248,255,0.92)',
    flexDirection: 'row',
    height: 64,
    justifyContent: 'space-between',
    paddingHorizontal: space.x4,
  },
  shellTitle: { color: colors.appPrimary, fontSize: 20, fontWeight: '700' },
  headerActions: { alignItems: 'center', flexDirection: 'row', gap: space.x3 },
  headerLink: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  shellContent: { gap: space.x6, padding: space.x4, paddingBottom: 96 },
  heroBlock: { gap: space.x2 },
  display: { color: colors.ink, fontSize: 36, fontWeight: '800', lineHeight: 44 },
  lead: { color: colors.muted, fontSize: 18, lineHeight: 28 },
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x4 },
  largeAction: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 24,
    flexBasis: '100%',
    gap: space.x3,
    minHeight: 164,
    padding: space.x4,
  },
  largeActionTitle: { color: '#d7cfff', fontSize: 20, fontWeight: '800' },
  largeActionBody: { color: '#d7cfff', fontSize: 14, lineHeight: 20 },
  miniAction: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 20,
    flex: 1,
    gap: space.x2,
    minHeight: 112,
    minWidth: 150,
    padding: space.x3,
  },
  miniLabel: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  sectionTitle: { color: colors.ink, fontSize: 24, fontWeight: '800', lineHeight: 32 },
  horizontalCards: { flexDirection: 'row', gap: space.x4 },
  imageCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    flex: 1,
    minWidth: 180,
    overflow: 'hidden',
  },
  cardImage: { height: 140, width: '100%' },
  cardTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
    paddingHorizontal: space.x4,
    paddingTop: space.x3,
  },
  cardMeta: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
  },
  cardBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  infoCard: { backgroundColor: colors.surface, borderRadius: 20, gap: space.x2, padding: space.x4 },
  infoCardAccent: { backgroundColor: colors.primarySoft },
  feedItem: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    flexDirection: 'row',
    gap: space.x3,
    padding: space.x3,
  },
  feedCopy: { flex: 1, gap: space.x1 },
  feedTop: { flexDirection: 'row', justifyContent: 'space-between', gap: space.x2 },
  feedTitle: { color: colors.ink, flex: 1, fontSize: 14, fontWeight: '800' },
  feedMeta: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  searchBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 18,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: space.x4,
  },
  muted: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2 },
  segment: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 999,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
  },
  segmentActive: { backgroundColor: colors.primary, color: colors.surface },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3 },
  profileHero: { alignItems: 'center', gap: space.x2 },
  profileAvatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 52,
    height: 104,
    justifyContent: 'center',
    width: 104,
  },
  profileAvatarText: { color: colors.surface, fontSize: 36, fontWeight: '900' },
  profileName: { color: colors.ink, fontSize: 28, fontWeight: '800' },
  profileBio: { color: colors.muted, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  statRow: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: space.x4,
  },
  stat: { alignItems: 'center', gap: space.x1 },
  statValue: { color: colors.primary, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  tabBar: {
    backgroundColor: 'rgba(250,248,255,0.96)',
    flexDirection: 'row',
    height: 72,
    paddingHorizontal: space.x2,
  },
  tab: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  tabLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  tabActive: { color: colors.appPrimary },
});
