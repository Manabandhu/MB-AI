import { color, radius, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  listAdminCommunityPosts,
  listAdminEvents,
  listAdminJobs,
  listAdminRides,
  listAdminRooms,
  listAuditLog,
  listReports,
  listUsers,
} from '@/modules/admin/api';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

const adminRoutes = [
  { label: 'Users', route: '/admin/users' },
  { label: 'Reports', route: '/admin/reports' },
  { label: 'Rooms Moderation', route: '/admin/rooms' },
  { label: 'Rides Moderation', route: '/admin/rides' },
  { label: 'Community', route: '/admin/community' },
  { label: 'Jobs', route: '/admin/jobs' },
  { label: 'Events', route: '/admin/events' },
  { label: 'Audit Log', route: '/admin/audit-log' },
];

const QUEUE_TABS = [
  'All Pending (7)',
  'Suspected Broker (3)',
  'ID Verification (2)',
  'Reported Content (2)',
];

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [activeQueueTab, setActiveQueueTab] = useState(QUEUE_TABS[0]);
  const [resolvedCards, setResolvedCards] = useState<Set<string>>(new Set());

  const _usersQuery = useQuery({ queryKey: ['admin', 'users'], queryFn: listUsers });
  const _reportsQuery = useQuery({ queryKey: ['admin', 'reports'], queryFn: listReports });
  const _roomsQuery = useQuery({ queryKey: ['admin', 'rooms'], queryFn: listAdminRooms });
  const _ridesQuery = useQuery({ queryKey: ['admin', 'rides'], queryFn: listAdminRides });
  const _communityQuery = useQuery({
    queryKey: ['admin', 'community'],
    queryFn: listAdminCommunityPosts,
  });
  const _jobsQuery = useQuery({ queryKey: ['admin', 'jobs'], queryFn: listAdminJobs });
  const _eventsQuery = useQuery({ queryKey: ['admin', 'events'], queryFn: listAdminEvents });
  const _auditQuery = useQuery({ queryKey: ['admin', 'audit-log'], queryFn: listAuditLog });

  const handleAction = (cardId: string, actionName: string) => {
    Alert.alert('Moderation Action', `${actionName} executed successfully.`);
    setResolvedCards((prev) => new Set([...prev, cardId]));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          {/* Super Admin Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>SUPER ADMIN • Austin & Dallas</Text>
              </View>
              <Text style={styles.pageTitle}>Moderation & Trust Console</Text>
              <Text style={styles.pageSubtitle}>
                Real-time safety telemetry, zero-brokerage enforcement, and diaspora verification.
              </Text>
            </View>
            <Pressable style={styles.auditIconBtn} onPress={() => router.push('/admin/audit-log')}>
              <AppIcon name="shield" size={20} color={color.primary} />
            </Pressable>
          </View>

          {/* 4 KPI Cards */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderColor: '#fde68a', backgroundColor: '#fffbeb' }]}>
              <Text style={[styles.kpiValue, { color: '#b45309' }]}>7</Text>
              <Text style={styles.kpiLabel}>Pending Queue</Text>
              <Text style={styles.kpiSub}>3 urgent</Text>
            </View>
            <View style={[styles.kpiCard, { borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }]}>
              <Text style={[styles.kpiValue, { color: '#15803d' }]}>24</Text>
              <Text style={styles.kpiLabel}>Verified Today</Text>
              <Text style={styles.kpiSub}>Dell & Apple</Text>
            </View>
            <View style={[styles.kpiCard, { borderColor: '#fecdd3', backgroundColor: '#fff1f2' }]}>
              <Text style={[styles.kpiValue, { color: '#be123c' }]}>3</Text>
              <Text style={styles.kpiLabel}>Flagged Brokers</Text>
              <Text style={styles.kpiSub}>Multi-post detected</Text>
            </View>
            <View style={[styles.kpiCard, { borderColor: '#e2e8f0', backgroundColor: '#ffffff' }]}>
              <Text style={[styles.kpiValue, { color: color.primary }]}>18m</Text>
              <Text style={styles.kpiLabel}>Response SLA</Text>
              <Text style={styles.kpiSub}>Target &lt; 25m</Text>
            </View>
          </View>

          {/* Priority Moderation Queue */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Priority Action Queue</Text>

            {/* Queue Filter Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
              {QUEUE_TABS.map((tab) => {
                const isActive = activeQueueTab === tab;
                return (
                  <Pressable
                    key={tab}
                    style={[styles.tabPill, isActive && styles.tabPillActive]}
                    onPress={() => setActiveQueueTab(tab)}
                  >
                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Queue Item 1: Broker Violation */}
            {!resolvedCards.has('broker-1') && (
              <View style={styles.modItem}>
                <View style={[styles.alertTag, { backgroundColor: '#fee2e2' }]}>
                  <Text style={[styles.alertTagText, { color: '#991b1b' }]}>
                    ⚠️ Commercial Brokerage Suspected (Multiple watermarked numbers)
                  </Text>
                </View>
                <Text style={styles.modTitle}>Furnished 3B2B Condo in Frisco, TX ($2,400/mo)</Text>
                <Text style={styles.modMeta}>
                  Poster: Rajesh K. • Created today • 4 identical listings across Austin & Dallas •
                  Zero community reviews
                </Text>
                <View style={styles.modActions}>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: '#dc2626' }]}
                    onPress={() => handleAction('broker-1', 'Ban & Remove')}
                  >
                    <Text style={styles.actionBtnText}>Ban & Remove</Text>
                  </Pressable>
                  <Pressable
                    style={styles.outlineActionBtn}
                    onPress={() => handleAction('broker-1', 'Review Details')}
                  >
                    <Text style={styles.outlineActionText}>Review Details</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.outlineActionBtn, { borderColor: color.teal }]}
                    onPress={() => handleAction('broker-1', 'Mark Safe')}
                  >
                    <Text style={[styles.outlineActionText, { color: color.teal }]}>Mark Safe</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Queue Item 2: Employer Verification */}
            {!resolvedCards.has('verify-1') && (
              <View style={styles.modItem}>
                <View style={[styles.alertTag, { backgroundColor: '#e6f4f4' }]}>
                  <Text style={[styles.alertTagText, { color: color.teal }]}>
                    🛡️ Dell Work Email & Texas DL Verification
                  </Text>
                </View>
                <Text style={styles.modTitle}>
                  Pooja Varma • Senior Software Engineer at Dell Round Rock
                </Text>
                <Text style={styles.modMeta}>
                  Passport / DL Front + Work Email confirmed (@dell.com OTP passed) • Facial Match
                  99.4%
                </Text>
                <View style={styles.modActions}>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: color.primary }]}
                    onPress={() => handleAction('verify-1', 'Approve Verified Bandhu')}
                  >
                    <Text style={styles.actionBtnText}>Approve Verified Bandhu ✓</Text>
                  </Pressable>
                  <Pressable
                    style={styles.outlineActionBtn}
                    onPress={() => handleAction('verify-1', 'Request Re-upload')}
                  >
                    <Text style={styles.outlineActionText}>Request Re-upload</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Queue Item 3: Marketplace Scam */}
            {!resolvedCards.has('scam-1') && (
              <View style={styles.modItem}>
                <View style={[styles.alertTag, { backgroundColor: '#fef3c7' }]}>
                  <Text style={[styles.alertTagText, { color: '#b45309' }]}>
                    ⚠️ Duplicate Listing / Suspicious Pricing Flag
                  </Text>
                </View>
                <Text style={styles.modTitle}>Brand New iPhone 16 Pro Max 256GB - $450</Text>
                <Text style={styles.modMeta}>
                  Reported by 2 Verified Bandhus: Refuses Patel Brothers daylight pickup, asks for
                  wire transfer in WhatsApp
                </Text>
                <View style={styles.modActions}>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: '#dc2626' }]}
                    onPress={() => handleAction('scam-1', 'Block & Delist')}
                  >
                    <Text style={styles.actionBtnText}>Block & Delist</Text>
                  </Pressable>
                  <Pressable
                    style={styles.outlineActionBtn}
                    onPress={() => handleAction('scam-1', 'Dismiss Flag')}
                  >
                    <Text style={styles.outlineActionText}>Dismiss Flag</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Module Admin Links */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Administrative Modules</Text>
            <View style={styles.adminRoutesGrid}>
              {adminRoutes.map((item) => (
                <Pressable
                  key={item.route}
                  style={styles.moduleBtn}
                  onPress={() => router.push(item.route as any)}
                >
                  <Text style={styles.moduleBtnText}>{item.label}</Text>
                  <AppIcon name="chevron-right" size={16} color={color.muted} />
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: color.background },
  page: { flexGrow: 1, padding: space.x4 },
  container: { gap: space.x4, maxWidth: 1200, width: '100%', alignSelf: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: color.surface,
    padding: space.x4,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
  },
  headerLeft: { flex: 1, gap: 4 },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: color.primarySoft,
    paddingHorizontal: space.x2,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  adminBadgeText: { ...typography.caption, color: color.primary, fontWeight: '800', fontSize: 10 },
  pageTitle: { ...typography.h2, color: color.ink, fontWeight: '800' },
  pageSubtitle: { ...typography.body, color: color.muted, fontSize: 13 },
  auditIconBtn: {
    padding: space.x2,
    borderRadius: radius.pill,
    backgroundColor: color.background,
    borderWidth: 1,
    borderColor: color.border,
  },

  kpiRow: { flexDirection: 'row', gap: space.x2, flexWrap: 'wrap' },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    padding: space.x3,
    borderRadius: radius.control,
    borderWidth: 1,
    gap: 2,
  },
  kpiValue: { fontSize: 24, fontWeight: '800' },
  kpiLabel: { ...typography.caption, color: color.ink, fontWeight: '700' },
  kpiSub: { ...typography.caption, color: color.muted, fontSize: 10 },

  sectionCard: {
    backgroundColor: color.surface,
    padding: space.x4,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    gap: space.x3,
  },
  sectionTitle: { ...typography.h3, color: color.ink, fontWeight: '800' },

  tabsRow: { flexDirection: 'row', gap: space.x2 },
  tabPill: {
    paddingHorizontal: space.x3,
    paddingVertical: space.x2,
    borderRadius: radius.pill,
    backgroundColor: color.background,
    borderWidth: 1,
    borderColor: color.border,
  },
  tabPillActive: { backgroundColor: color.primary, borderColor: color.primary },
  tabText: { ...typography.caption, color: color.ink, fontWeight: '600' },
  tabTextActive: { color: '#ffffff', fontWeight: '800' },

  modItem: {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.control,
    padding: space.x3,
    backgroundColor: color.surface,
    gap: space.x2,
  },
  alertTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.x2,
    paddingVertical: 3,
    borderRadius: 4,
  },
  alertTagText: { ...typography.caption, fontWeight: '700', fontSize: 11 },
  modTitle: { ...typography.bodyStrong, color: color.ink, fontSize: 14 },
  modMeta: { ...typography.caption, color: color.muted, fontSize: 12 },
  modActions: { flexDirection: 'row', gap: space.x2, flexWrap: 'wrap', marginTop: 4 },
  actionBtn: {
    paddingHorizontal: space.x3,
    paddingVertical: space.x2,
    borderRadius: radius.control,
    alignItems: 'center',
  },
  actionBtnText: { ...typography.caption, color: '#ffffff', fontWeight: '800' },
  outlineActionBtn: {
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: space.x3,
    paddingVertical: space.x2,
    borderRadius: radius.control,
    alignItems: 'center',
  },
  outlineActionText: { ...typography.caption, color: color.ink, fontWeight: '600' },

  adminRoutesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2 },
  moduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 180,
    flex: 1,
    paddingHorizontal: space.x3,
    paddingVertical: space.x2,
    borderRadius: radius.control,
    backgroundColor: color.background,
    borderWidth: 1,
    borderColor: color.border,
  },
  moduleBtnText: { ...typography.bodyStrong, color: color.ink, fontSize: 13 },
});
