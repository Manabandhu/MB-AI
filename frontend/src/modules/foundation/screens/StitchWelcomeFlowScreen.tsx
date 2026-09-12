import { color, space } from '@manabandhu/design-system';
import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/lib/authStore';
import { welcomeLogo } from '@/modules/foundation/welcomeAssets';
import { useAdaptiveLayout } from '@/platform/adaptive';

const slides = [
  {
    category: 'Housing',
    title: 'Verified Rooms & Roommates',
    desc: 'Find verified shared rooms, 1BHK/2BHK apartments, and trusted Telugu roommates across Dallas, Bay Area, Seattle, NJ, and beyond.',
    tag: 'Zero Brokerage',
    tagBg: 'rgba(67, 30, 190, 0.10)',
    tagColor: color.primary,
    stat: 'Avg savings: $450/mo',
    icon: '🏠',
    testimonial: '“Found my roommate in Dallas in 2 days with zero brokerage!”',
    author: 'Sravan K., Dallas TX',
    bullets: [
      'ID verified hosts & tenants',
      'Furnished & lease-share listings',
      'Direct chats with zero broker fees',
    ],
  },
  {
    category: 'Carpools',
    title: 'Community Carpools & Commute',
    desc: 'Share rides with Telugu colleagues to office parks, airports (DFW, SFO, SEA, ORD), and weekend intercity trips. Safe and friendly.',
    tag: 'Trusted Routes',
    tagBg: 'rgba(0, 105, 107, 0.12)',
    tagColor: color.teal,
    stat: '15,000+ trips shared',
    icon: '🚗',
    testimonial: '“Cut my weekly commute cost by 60% and made great friends.”',
    author: 'Madhu V., San Jose CA',
    bullets: [
      'Daily office park commutes',
      'Airport luggage-friendly rides',
      'Direct fuel & toll cost splitting',
    ],
  },
  {
    category: 'Careers',
    title: 'Insider Job Referrals & Tech Hub',
    desc: 'Get recommended directly by Telugu engineers, managers, and recruiters at Google, Microsoft, Amazon, Meta, and high-growth startups.',
    tag: 'Fast Track',
    tagBg: 'rgba(255, 126, 51, 0.14)',
    tagColor: color.warm,
    stat: '3,500+ successful referrals',
    icon: '💼',
    testimonial: '“Landed my Senior SWE interview within a week through a referral.”',
    author: 'Ananya R., Seattle WA',
    bullets: [
      'Direct employee internal referrals',
      'Senior dev resume reviews',
      'H-1B & OPT friendly tech openings',
    ],
  },
  {
    category: 'Community',
    title: 'Vibrant Hub, Events & Support',
    desc: 'Celebrate Ugadi, Sankranti, Diwali, and cricket screenings together. Buy & sell furniture, and get trusted answers on visa and utilities.',
    tag: 'Active 24/7',
    tagBg: 'rgba(67, 30, 190, 0.10)',
    tagColor: color.primary,
    stat: '50,000+ active members',
    icon: '🤝',
    testimonial: '“Having ManaBandhu is like having family in every city I move to.”',
    author: 'Karthik N., Austin TX',
    bullets: [
      'Festive & cultural local meetups',
      'Student marketplace for pre-loved items',
      '24/7 community emergency assistance',
    ],
  },
];

export function StitchWelcomeFlowScreen() {
  const status = useAuthStore((s) => s.status);
  const isLoading = useAuthStore((s) => s.isLoading);
  const { windowClass } = useAdaptiveLayout();
  const isDesktop = windowClass !== 'compact';

  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isLoading && status === 'authenticated') {
      router.replace('/home');
    }
  }, [status, isLoading]);

  // Auto-advance carousel every 4.5 seconds unless paused
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((curr) => (curr + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const current = slides[activeSlide];

  function handlePrev() {
    setIsPaused(true);
    setActiveSlide((curr) => (curr - 1 + slides.length) % slides.length);
  }

  function handleNext() {
    setIsPaused(true);
    setActiveSlide((curr) => (curr + 1) % slides.length);
  }

  function handleSelectSlide(idx: number) {
    setIsPaused(true);
    setActiveSlide(idx);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* ========================================================================= */}
        {/* DESKTOP WEB NAVIGATION BAR                                               */}
        {/* ========================================================================= */}
        {isDesktop ? (
          <View style={styles.desktopNavbar}>
            <View style={styles.brandRow}>
              <Image source={welcomeLogo} style={styles.desktopNavLogo} />
              <View>
                <View style={styles.brandTitleRow}>
                  <Text style={styles.brandTitle}>ManaBandhu</Text>
                  <View style={styles.verifiedDot}>
                    <Text style={styles.verifiedCheck}>✓</Text>
                  </View>
                </View>
                <Text style={styles.brandSubtitle}>Telugu Diaspora Platform</Text>
              </View>
            </View>

            {/* Nav Links */}
            <View style={styles.desktopNavLinks}>
              <Pressable onPress={() => handleSelectSlide(0)} style={styles.navLinkItem}>
                <Text style={[styles.navLinkText, activeSlide === 0 && styles.navLinkActive]}>
                  Verified Rooms
                </Text>
              </Pressable>
              <Pressable onPress={() => handleSelectSlide(1)} style={styles.navLinkItem}>
                <Text style={[styles.navLinkText, activeSlide === 1 && styles.navLinkActive]}>
                  Carpools
                </Text>
              </Pressable>
              <Pressable onPress={() => handleSelectSlide(2)} style={styles.navLinkItem}>
                <Text style={[styles.navLinkText, activeSlide === 2 && styles.navLinkActive]}>
                  Job Referrals
                </Text>
              </Pressable>
              <Pressable onPress={() => handleSelectSlide(3)} style={styles.navLinkItem}>
                <Text style={[styles.navLinkText, activeSlide === 3 && styles.navLinkActive]}>
                  Community Hub
                </Text>
              </Pressable>
            </View>

            {/* Nav CTAs */}
            <View style={styles.desktopNavActions}>
              <Pressable
                onPress={() => router.push('/sign-in')}
                style={styles.desktopNavSignIn}
                accessibilityRole="button"
              >
                <Text style={styles.desktopNavSignInText}>Sign In</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/sign-up')}
                style={styles.desktopNavCta}
                accessibilityRole="button"
              >
                <Text style={styles.desktopNavCtaText}>Join Free →</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={[styles.pageContainer, isDesktop && styles.pageContainerDesktop]}>
          {/* ========================================================================= */}
          {/* MOBILE HEADER                                                             */}
          {/* ========================================================================= */}
          {!isDesktop ? (
            <View style={styles.mobileTopBar}>
              <View style={styles.brandRow}>
                <Image source={welcomeLogo} style={styles.brandLogo} />
                <View>
                  <View style={styles.brandTitleRow}>
                    <Text style={styles.brandTitle}>ManaBandhu</Text>
                    <View style={styles.verifiedDot}>
                      <Text style={styles.verifiedCheck}>✓</Text>
                    </View>
                  </View>
                  <Text style={styles.brandSubtitle}>Telugu Diaspora Platform</Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Skip to sign in"
                onPress={() => router.push('/sign-in')}
                style={styles.skipButton}
              >
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            </View>
          ) : null}

          {/* ========================================================================= */}
          {/* HERO SECTION (2-COL ON DESKTOP, STACK ON MOBILE)                         */}
          {/* ========================================================================= */}
          <View style={[styles.heroRow, isDesktop && styles.heroRowDesktop]}>
            {/* Left Column: Hero Text & Value Props */}
            <View style={[styles.heroTextCol, isDesktop && styles.heroTextColDesktop]}>
              <View style={styles.heroPillBadge}>
                <Text style={styles.heroPillText}>✨ North America’s #1 Telugu Diaspora App</Text>
              </View>
              <Text style={[styles.mainHeading, isDesktop && styles.mainHeadingDesktop]}>
                Your Trusted Telugu Community, Everywhere You Go
              </Text>
              <Text style={[styles.mainSubheading, isDesktop && styles.mainSubheadingDesktop]}>
                Connect with 50,000+ verified Telugu students, working professionals, and families.
                Find verified housing without brokerage, share friendly daily commutes, unlock
                insider tech referrals, and stay united with our roots.
              </Text>

              {/* Value Checkpoints */}
              <View style={styles.valuePointsBlock}>
                <View style={styles.valuePointItem}>
                  <Text style={styles.valuePointCheck}>✓</Text>
                  <Text style={styles.valuePointText}>100% ID Verified & Moderated Community</Text>
                </View>
                <View style={styles.valuePointItem}>
                  <Text style={styles.valuePointCheck}>✓</Text>
                  <Text style={styles.valuePointText}>
                    Zero Brokerage Housing & Transparent Costs
                  </Text>
                </View>
                <View style={styles.valuePointItem}>
                  <Text style={styles.valuePointCheck}>✓</Text>
                  <Text style={styles.valuePointText}>
                    24/7 Peer Assistance & Local Diaspora Chapters
                  </Text>
                </View>
              </View>

              {/* Desktop CTA Row */}
              {isDesktop ? (
                <View style={styles.desktopCtaRow}>
                  <Pressable
                    onPress={() => router.push('/sign-up')}
                    style={styles.desktopHeroPrimaryCta}
                    accessibilityRole="button"
                  >
                    <Text style={styles.desktopHeroPrimaryCtaText}>Get Started Free →</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push('/sign-in')}
                    style={styles.desktopHeroSecondaryCta}
                    accessibilityRole="button"
                  >
                    <Text style={styles.desktopHeroSecondaryCtaText}>Sign In</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push('/home')}
                    style={styles.desktopDemoCta}
                    accessibilityRole="button"
                  >
                    <Text style={styles.desktopDemoCtaText}>Explore Demo ⚡</Text>
                  </Pressable>
                </View>
              ) : null}

              {/* Live Trust Metrics Ticker */}
              <View style={styles.statsTicker}>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>50K+</Text>
                  <Text style={styles.statLabel}>Active Members</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>12K+</Text>
                  <Text style={styles.statLabel}>Rooms Shared</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>3.5K+</Text>
                  <Text style={styles.statLabel}>Job Referrals</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>4.9 ★</Text>
                  <Text style={styles.statLabel}>Trust Score</Text>
                </View>
              </View>
            </View>

            {/* Right Column: Interactive Carousel Showcase Card */}
            <View style={[styles.carouselCard, isDesktop && styles.carouselCardDesktop]}>
              {/* Category Navigation Pills */}
              <View style={styles.categoryPillsRow}>
                {slides.map((s, idx) => {
                  const isActive = idx === activeSlide;
                  return (
                    <Pressable
                      key={s.category}
                      onPress={() => handleSelectSlide(idx)}
                      style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                      accessibilityRole="button"
                      accessibilityLabel={`View ${s.category}`}
                    >
                      <Text
                        style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}
                      >
                        {s.category}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Slide Content Display Frame */}
              <Pressable
                onPress={() => setIsPaused(!isPaused)}
                style={styles.slideFrame}
                accessibilityRole="button"
                accessibilityLabel="Toggle carousel auto-play"
              >
                <View style={styles.slideHeader}>
                  <View style={styles.slideIconWrap}>
                    <Text style={styles.slideBigIcon}>{current.icon}</Text>
                  </View>
                  <View style={styles.slideHeaderRight}>
                    <View style={[styles.slideTag, { backgroundColor: current.tagBg }]}>
                      <Text style={[styles.slideTagText, { color: current.tagColor }]}>
                        {current.tag}
                      </Text>
                    </View>
                    <Text style={styles.slideStatBadge}>{current.stat}</Text>
                  </View>
                </View>

                {/* Slide Title & Description */}
                <Text style={styles.slideTitle}>{current.title}</Text>
                <Text style={styles.slideDesc}>{current.desc}</Text>

                {/* Bullets */}
                <View style={styles.slideBulletsCol}>
                  {current.bullets.map((b) => (
                    <View key={b} style={styles.slideBulletRow}>
                      <Text style={styles.slideBulletDot}>⚡</Text>
                      <Text style={styles.slideBulletText}>{b}</Text>
                    </View>
                  ))}
                </View>

                {/* Testimonial Quote */}
                <View style={styles.slideQuoteBox}>
                  <Text style={styles.slideQuoteText}>{current.testimonial}</Text>
                  <Text style={styles.slideQuoteAuthor}>{current.author}</Text>
                </View>
              </Pressable>

              {/* Carousel Interactive Controls (Prev / Next & Dots) */}
              <View style={styles.carouselControlsRow}>
                <Pressable
                  onPress={handlePrev}
                  style={styles.arrowButton}
                  accessibilityRole="button"
                  accessibilityLabel="Previous slide"
                >
                  <Text style={styles.arrowText}>‹</Text>
                </Pressable>

                {/* Clickable Animated Stepper Dots */}
                <View style={styles.dotsRow}>
                  {slides.map((s, idx) => (
                    <Pressable
                      key={s.category}
                      onPress={() => handleSelectSlide(idx)}
                      accessibilityRole="button"
                      accessibilityLabel={`Slide ${idx + 1}`}
                      style={idx === activeSlide ? styles.dotActive : styles.dot}
                    />
                  ))}
                </View>

                <Pressable
                  onPress={handleNext}
                  style={styles.arrowButton}
                  accessibilityRole="button"
                  accessibilityLabel="Next slide"
                >
                  <Text style={styles.arrowText}>›</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* ========================================================================= */}
          {/* MOBILE CTAS                                                               */}
          {/* ========================================================================= */}
          {!isDesktop ? (
            <View style={styles.mobileActionsBlock}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/sign-up')}
                style={styles.mobilePrimaryCta}
              >
                <Text style={styles.mobilePrimaryCtaText}>Get Started Free →</Text>
              </Pressable>

              <View style={styles.mobileSecondaryRow}>
                <Text style={styles.mobileSecondaryPrompt}>Already have an account? </Text>
                <Link href="/sign-in" asChild>
                  <Pressable accessibilityRole="link">
                    <Text style={styles.mobileSecondaryLink}>Sign In</Text>
                  </Pressable>
                </Link>
              </View>

              <Text style={styles.termsNote}>
                By continuing, you agree to ManaBandhu Terms of Service & Privacy Policy
              </Text>
            </View>
          ) : null}

          {/* ========================================================================= */}
          {/* DESKTOP FULL FEATURE MATRIX                                              */}
          {/* ========================================================================= */}
          {isDesktop ? (
            <View style={styles.desktopFeaturesMatrix}>
              <View style={styles.matrixHeader}>
                <Text style={styles.matrixBadge}>EVERYTHING YOU NEED</Text>
                <Text style={styles.matrixHeading}>Built Exclusively for the Telugu Diaspora</Text>
                <Text style={styles.matrixSub}>
                  No more unverified Facebook groups or fragmented WhatsApp chats. One verified,
                  safe, organized platform.
                </Text>
              </View>

              <View style={styles.matrixGrid}>
                {slides.map((s, idx) => (
                  <Pressable
                    key={s.title}
                    onPress={() => handleSelectSlide(idx)}
                    style={[styles.matrixCard, activeSlide === idx && styles.matrixCardSelected]}
                  >
                    <View style={styles.matrixCardTop}>
                      <Text style={styles.matrixCardIcon}>{s.icon}</Text>
                      <View style={[styles.matrixCardTag, { backgroundColor: s.tagBg }]}>
                        <Text style={[styles.matrixCardTagText, { color: s.tagColor }]}>
                          {s.tag}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.matrixCardTitle}>{s.title}</Text>
                    <Text style={styles.matrixCardDesc}>{s.desc}</Text>
                    <Text style={styles.matrixCardStat}>{s.stat}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Safety Banner */}
              <View style={styles.safetyPledgeBanner}>
                <Text style={styles.safetyPledgeIcon}>🛡️</Text>
                <View style={styles.safetyPledgeCol}>
                  <Text style={styles.safetyPledgeTitle}>
                    ManaBandhu Safety & Moderation Pledge
                  </Text>
                  <Text style={styles.safetyPledgeDesc}>
                    Every profile is phone and email verified. Suspicious postings are flagged by AI
                    and human community moderators within minutes.
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push('/sign-up')}
                  style={styles.safetyPledgeCta}
                  accessibilityRole="button"
                >
                  <Text style={styles.safetyPledgeCtaText}>Join the Safe Community</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* ========================================================================= */}
          {/* FOOTER                                                                    */}
          {/* ========================================================================= */}
          <View style={styles.footerBlock}>
            <Text style={styles.footerCopyright}>
              © 2026 ManaBandhu Inc. Connecting Telugu diaspora across USA, Canada & worldwide.
            </Text>
            <View style={styles.footerLinksRow}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
              <Text style={styles.footerDot}>•</Text>
              <Text style={styles.footerLink}>Terms of Service</Text>
              <Text style={styles.footerDot}>•</Text>
              <Text style={styles.footerLink}>Community Guidelines</Text>
              <Text style={styles.footerDot}>•</Text>
              <Text style={styles.footerLink}>Help Center</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: color.background, flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: space.x8 },
  // Desktop Navbar
  desktopNavbar: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomColor: 'rgba(67, 30, 190, 0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.x8,
    paddingVertical: space.x3,
  },
  desktopNavLogo: { borderRadius: 10, height: 40, width: 40 },
  desktopNavLinks: { alignItems: 'center', flexDirection: 'row', gap: space.x5 },
  navLinkItem: { paddingVertical: space.x2 },
  navLinkText: { color: color.muted, fontSize: 14, fontWeight: '700' },
  navLinkActive: { color: color.primary },
  desktopNavActions: { alignItems: 'center', flexDirection: 'row', gap: space.x3 },
  desktopNavSignIn: {
    borderColor: color.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
  },
  desktopNavSignInText: { color: color.ink, fontSize: 14, fontWeight: '700' },
  desktopNavCta: {
    backgroundColor: color.primary,
    borderRadius: 999,
    paddingHorizontal: space.x5,
    paddingVertical: space.x2,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  desktopNavCtaText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },

  // Containers
  pageContainer: {
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    gap: space.x5,
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
  },
  pageContainerDesktop: {
    maxWidth: 1200,
    paddingHorizontal: space.x6,
    paddingVertical: space.x8,
    gap: space.x8,
  },

  // Mobile Top Bar
  mobileTopBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.x1,
  },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: space.x2 },
  brandLogo: { borderRadius: 10, height: 38, width: 38 },
  brandTitleRow: { alignItems: 'center', flexDirection: 'row', gap: space.x1 },
  brandTitle: { color: color.primary, fontSize: 18, fontWeight: '800' },
  verifiedDot: {
    alignItems: 'center',
    backgroundColor: color.teal,
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  verifiedCheck: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  brandSubtitle: { color: color.muted, fontSize: 11, fontWeight: '600' },
  skipButton: { padding: space.x2 },
  skipText: { color: color.muted, fontSize: 14, fontWeight: '700' },

  // Hero Section
  heroRow: {
    gap: space.x5,
  },
  heroRowDesktop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x8,
  },
  heroTextCol: {
    gap: space.x3,
  },
  heroTextColDesktop: {
    flex: 1.1,
    gap: space.x4,
  },
  heroPillBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(67, 30, 190, 0.08)',
    borderColor: 'rgba(67, 30, 190, 0.18)',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: space.x3,
    paddingVertical: 5,
  },
  heroPillText: {
    color: color.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  mainHeading: {
    color: color.ink,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 34,
  },
  mainHeadingDesktop: {
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  mainSubheading: {
    color: color.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  mainSubheadingDesktop: {
    fontSize: 16,
    lineHeight: 26,
  },

  // Value Checkpoints
  valuePointsBlock: {
    gap: space.x2,
    marginVertical: space.x1,
  },
  valuePointItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x2,
  },
  valuePointCheck: {
    color: color.teal,
    fontSize: 14,
    fontWeight: '900',
  },
  valuePointText: {
    color: color.ink,
    fontSize: 14,
    fontWeight: '700',
  },

  // Desktop CTA Row
  desktopCtaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x3,
    marginTop: space.x2,
  },
  desktopHeroPrimaryCta: {
    backgroundColor: color.primary,
    borderRadius: 999,
    paddingHorizontal: space.x6,
    paddingVertical: space.x3,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  desktopHeroPrimaryCtaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  desktopHeroSecondaryCta: {
    backgroundColor: '#ffffff',
    borderColor: color.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: space.x5,
    paddingVertical: space.x3,
  },
  desktopHeroSecondaryCtaText: {
    color: color.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  desktopDemoCta: {
    backgroundColor: 'rgba(255, 126, 51, 0.12)',
    borderRadius: 999,
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
  },
  desktopDemoCtaText: {
    color: color.warm,
    fontSize: 14,
    fontWeight: '800',
  },

  // Stats Ticker
  statsTicker: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(67, 30, 190, 0.10)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: space.x2,
    paddingVertical: space.x3,
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    color: color.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: color.muted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    backgroundColor: color.border,
    height: '60%',
    width: 1,
    alignSelf: 'center',
  },

  // Carousel Showcase Card
  carouselCard: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(67, 30, 190, 0.14)',
    borderRadius: 28,
    borderWidth: 1,
    gap: space.x3,
    padding: space.x4,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  carouselCardDesktop: {
    flex: 1,
    padding: space.x5,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    gap: space.x2,
    justifyContent: 'space-between',
  },
  categoryPill: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 999,
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
  },
  categoryPillActive: {
    backgroundColor: color.primary,
  },
  categoryPillText: {
    color: color.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryPillTextActive: {
    color: '#ffffff',
  },

  // Slide Frame
  slideFrame: {
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    borderColor: 'rgba(67, 30, 190, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    gap: space.x3,
    padding: space.x4,
  },
  slideHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  slideIconWrap: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    width: 48,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  slideBigIcon: {
    fontSize: 26,
  },
  slideHeaderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  slideTag: {
    borderRadius: 999,
    paddingHorizontal: space.x2,
    paddingVertical: 3,
  },
  slideTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  slideStatBadge: {
    color: color.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  slideTitle: {
    color: color.ink,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  slideDesc: {
    color: color.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  slideBulletsCol: {
    gap: 6,
  },
  slideBulletRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x2,
  },
  slideBulletDot: {
    fontSize: 11,
  },
  slideBulletText: {
    color: color.ink,
    fontSize: 12,
    fontWeight: '600',
  },
  slideQuoteBox: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(67, 30, 190, 0.10)',
    borderRadius: 14,
    borderWidth: 1,
    padding: space.x3,
  },
  slideQuoteText: {
    color: color.ink,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  slideQuoteAuthor: {
    color: color.primary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },

  // Carousel Controls
  carouselControlsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.x2,
    paddingTop: space.x1,
  },
  arrowButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(67, 30, 190, 0.08)',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  arrowText: {
    color: color.primary,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
  },
  dotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x2,
  },
  dot: {
    backgroundColor: color.border,
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  dotActive: {
    backgroundColor: color.primary,
    borderRadius: 4,
    height: 7,
    width: 26,
  },

  // Mobile Action CTA
  mobileActionsBlock: {
    gap: space.x3,
    marginTop: space.x2,
  },
  mobilePrimaryCta: {
    alignItems: 'center',
    backgroundColor: color.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  mobilePrimaryCtaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  mobileSecondaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  mobileSecondaryPrompt: {
    color: color.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  mobileSecondaryLink: {
    color: color.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  termsNote: {
    color: color.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },

  // Desktop Features Matrix
  desktopFeaturesMatrix: {
    gap: space.x6,
    marginTop: space.x4,
  },
  matrixHeader: {
    alignItems: 'center',
    gap: space.x2,
  },
  matrixBadge: {
    color: color.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  matrixHeading: {
    color: color.ink,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  matrixSub: {
    color: color.muted,
    fontSize: 16,
    maxWidth: 640,
    textAlign: 'center',
    lineHeight: 24,
  },
  matrixGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.x4,
  },
  matrixCard: {
    backgroundColor: '#ffffff',
    borderColor: color.border,
    borderRadius: 20,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    gap: space.x2,
    padding: space.x4,
  },
  matrixCardSelected: {
    borderColor: color.primary,
    backgroundColor: 'rgba(67, 30, 190, 0.02)',
  },
  matrixCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  matrixCardIcon: {
    fontSize: 26,
  },
  matrixCardTag: {
    borderRadius: 999,
    paddingHorizontal: space.x2,
    paddingVertical: 3,
  },
  matrixCardTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  matrixCardTitle: {
    color: color.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  matrixCardDesc: {
    color: color.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  matrixCardStat: {
    color: color.primary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: space.x1,
  },

  // Safety Pledge Banner
  safetyPledgeBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 105, 107, 0.08)',
    borderColor: 'rgba(0, 105, 107, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.x4,
    padding: space.x5,
  },
  safetyPledgeIcon: {
    fontSize: 32,
  },
  safetyPledgeCol: {
    flex: 1,
  },
  safetyPledgeTitle: {
    color: color.teal,
    fontSize: 16,
    fontWeight: '800',
  },
  safetyPledgeDesc: {
    color: color.ink,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  safetyPledgeCta: {
    backgroundColor: color.teal,
    borderRadius: 999,
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
  },
  safetyPledgeCtaText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  // Footer
  footerBlock: {
    alignItems: 'center',
    borderTopColor: color.border,
    borderTopWidth: 1,
    gap: space.x2,
    marginTop: space.x6,
    paddingTop: space.x5,
  },
  footerCopyright: {
    color: color.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  footerLinksRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.x2,
    justifyContent: 'center',
  },
  footerLink: {
    color: color.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  footerDot: {
    color: color.muted,
    fontSize: 12,
  },
});
