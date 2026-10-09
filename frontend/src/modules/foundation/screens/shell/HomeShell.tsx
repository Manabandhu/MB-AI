import type { Href } from 'expo-router';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocationStore } from '@/lib/locationStore';
import { LocationSelectorModal } from '@/modules/foundation/components/LocationSelectorModal';
import type { HomeShellData } from '@/modules/foundation/homeApi';
import { useDynamicModules, useUserActivityStore } from '@/modules/foundation/userActivityStore';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { Avatar, AvatarFallbackText } from '@/modules/shared/ui/gluestack/avatar';
import { UnreadNotificationDot } from './components';
import { colors, s } from './theme';

export function HomeShell({
  data,
  displayName,
  avatarInitial,
  isDesktop,
}: {
  data: HomeShellData;
  displayName: string;
  avatarInitial: string;
  isDesktop: boolean;
}) {
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const feed = data?.feed ?? [];
  const metrics = data?.metrics ?? [];

  const dynamicModules = useDynamicModules(8);
  const recordModuleVisit = useUserActivityStore((s) => s.recordModuleVisit);

  const roomItems = feed.filter((item) => item.kind === 'room');
  const postItems = feed.filter((item) => item.kind === 'post');
  const jobItems = feed.filter((item) => item.kind === 'job');

  return (
    <>
      <View style={[s.greetRow, !isDesktop && s.greetRowMobile]}>
        <View style={s.greetLeft}>
          <Text style={s.greetText}>
            {greeting}, {displayName.split(' ')[0]} 👋
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select location"
            onPress={() => setIsLocationModalVisible(true)}
            style={s.locationChip}
          >
            <AppIcon color={colors.appPrimary} name="map" size={12} />
            <Text style={s.locationText} numberOfLines={1}>
              {currentLocation.name}
            </Text>
            <AppIcon color={colors.appPrimary} name="chevron-down" size={10} />
          </Pressable>
        </View>

        {!isDesktop ? (
          <View style={s.greetRight}>
            <Pressable
              accessibilityLabel="Open notifications"
              accessibilityRole="button"
              onPress={() => router.push('/notifications')}
              style={s.headerIconBtn}
            >
              <AppIcon color={colors.appPrimary} name="bell" size={18} />
              <UnreadNotificationDot />
            </Pressable>
            <Pressable
              accessibilityLabel="Go to profile"
              accessibilityRole="button"
              onPress={() => router.push('/profile' as Href)}
            >
              <Avatar className="h-10 w-10 bg-primary">
                <AvatarFallbackText className="text-primary-foreground text-sm font-bold">
                  {avatarInitial}
                </AvatarFallbackText>
              </Avatar>
            </Pressable>
          </View>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search rooms, flatmates, rides, jobs"
        onPress={() => router.push('/search' as Href)}
        style={s.searchBar}
      >
        <AppIcon color={colors.muted} name="search" size={18} />
        <Text style={s.searchPlaceholder}>Search rooms, flatmates, rides, jobs...</Text>
      </Pressable>

      <View style={s.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={s.sectionTitle}>Frequently Used & Recent</Text>
          <View
            style={{
              backgroundColor: 'rgba(67,30,190,0.08)',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.appPrimary }}>
              DYNAMIC
            </Text>
          </View>
        </View>
        <Link href="/explore" asChild>
          <Pressable accessibilityRole="link">
            <Text style={s.seeAll}>All Features →</Text>
          </Pressable>
        </Link>
      </View>

      <View style={[s.qaGrid, isDesktop && s.qaGridDesktop]}>
        {dynamicModules.map((qa) => (
          <Link key={qa.id} href={qa.route as Href} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={qa.label}
              onPress={() => recordModuleVisit(qa.id)}
              style={StyleSheet.flatten([
                s.qaTile,
                isDesktop && s.qaTileDesktop,
                { backgroundColor: qa.bg },
              ])}
            >
              <AppIcon color={qa.iconColor} name={qa.icon} size={22} />
              <Text
                style={[s.qaLabel, { color: qa.iconColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {qa.label}
              </Text>
            </Pressable>
          </Link>
        ))}
      </View>

      {metrics.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillRow}>
          {metrics.map((metric, i) => {
            const pillColors = [
              { color: '#00696b', bg: 'rgba(0,105,107,0.08)' },
              { color: '#431ebe', bg: 'rgba(67,30,190,0.07)' },
              { color: '#ff7e33', bg: 'rgba(255,126,51,0.10)' },
              { color: '#1a8a5c', bg: '#e2f9ef' },
            ];
            const c = pillColors[i % pillColors.length];
            return (
              <View key={metric.label} style={[s.statPill, { backgroundColor: c.bg }]}>
                <View style={[s.statDot, { backgroundColor: c.color }]} />
                <Text style={[s.statPillText, { color: c.color }]}>
                  {metric.value} {metric.label}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Rooms Near You</Text>
        <Link href="/rooms" asChild>
          <Pressable accessibilityRole="link">
            <Text style={s.seeAll}>See All →</Text>
          </Pressable>
        </Link>
      </View>
      {roomItems.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hScroll}>
          {roomItems.map((room) => (
            <Link key={room.id} href={room.route as Href} asChild>
              <Pressable onPress={() => recordModuleVisit('rooms')} style={s.roomCard}>
                <View style={s.roomThumb}>
                  <Text style={s.roomThumbEmoji}>🏠</Text>
                </View>
                <View style={s.roomInfo}>
                  <Text style={s.roomPrice}>{room.meta}</Text>
                  <Text style={s.roomTitle} numberOfLines={1}>
                    {room.title}
                  </Text>
                  <View style={s.roomMeta}>
                    <AppIcon color={colors.muted} name="map" size={11} />
                    <Text style={s.roomLocation}>{room.body}</Text>
                  </View>
                </View>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      ) : (
        <Pressable
          onPress={() => {
            recordModuleVisit('rooms');
            router.push('/rooms');
          }}
          style={s.roomCard}
        >
          <View style={s.roomInfo}>
            <Text style={s.roomTitle}>Find or post a room</Text>
            <Text style={s.roomLocation}>Explore verified shared rooms and apartments</Text>
          </View>
        </Pressable>
      )}

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Community Feed</Text>
        <Link href="/community" asChild>
          <Pressable accessibilityRole="link">
            <Text style={s.seeAll}>See All →</Text>
          </Pressable>
        </Link>
      </View>
      {postItems.length > 0 ? (
        postItems.map((post) => (
          <Link key={post.id} href={post.route as Href} asChild>
            <Pressable onPress={() => recordModuleVisit('community')} style={s.postCard}>
              <Text style={s.postName}>{post.title}</Text>
              <Text style={s.postBody} numberOfLines={2}>
                {post.body}
              </Text>
              <Text style={s.postTime}>{post.meta}</Text>
            </Pressable>
          </Link>
        ))
      ) : (
        <Link href="/community" asChild>
          <Pressable onPress={() => recordModuleVisit('community')} style={s.postCard}>
            <Text style={s.postName}>Join the conversation</Text>
            <Text style={s.postBody}>
              Connect with local community members, ask questions, and share advice.
            </Text>
          </Pressable>
        </Link>
      )}

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Job Referrals</Text>
        <Link href="/jobs" asChild>
          <Pressable accessibilityRole="link">
            <Text style={s.seeAll}>See All →</Text>
          </Pressable>
        </Link>
      </View>
      {jobItems.length > 0 ? (
        jobItems.map((job) => (
          <Link key={job.id} href={job.route as Href} asChild>
            <Pressable onPress={() => recordModuleVisit('jobs')} style={s.jobRow}>
              <View style={s.jobLogo}>
                <Text style={s.jobLogoText}>{job.title[0]}</Text>
              </View>
              <View style={s.jobInfo}>
                <Text style={s.jobTitle}>{job.title}</Text>
                <Text style={s.jobLocation}>{job.body}</Text>
              </View>
              <View style={s.jobBonus}>
                <Text style={s.jobBonusText}>{job.meta}</Text>
              </View>
            </Pressable>
          </Link>
        ))
      ) : (
        <Link href="/jobs" asChild>
          <Pressable onPress={() => recordModuleVisit('jobs')} style={s.jobRow}>
            <View style={s.jobLogo}>
              <Text style={s.jobLogoText}>💼</Text>
            </View>
            <View style={s.jobInfo}>
              <Text style={s.jobTitle}>Explore Job Referrals</Text>
              <Text style={s.jobLocation}>Browse tech openings and request employee referrals</Text>
            </View>
          </Pressable>
        </Link>
      )}

      <LocationSelectorModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
      />
    </>
  );
}

// ─── EXPLORE SHELL (Master Capabilities Hub) ──────────────────────────────────
