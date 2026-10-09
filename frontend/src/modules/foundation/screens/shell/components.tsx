import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { getNotificationsInbox } from '@/modules/notifications/api';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';

import { colors, s } from './theme';

export function UnreadNotificationDot() {
  const { data } = useQuery({
    queryKey: ['notifications', 'inbox'],
    queryFn: getNotificationsInbox,
  });
  const hasUnread = (data?.items ?? []).some((item) => !item.read);
  return hasUnread ? <View style={s.notifDot} /> : null;
}

export function PostCard({
  post,
}: {
  post: {
    initials: string;
    name: string;
    time: string;
    group: string;
    body: string;
    likes: number;
    comments: number;
  };
}) {
  return (
    <View style={s.postCard}>
      <View style={s.postHeader}>
        <View style={s.postAvatar}>
          <Text style={s.postAvatarText}>{post.initials}</Text>
        </View>
        <View style={s.postMeta}>
          <Text style={s.postName}>{post.name}</Text>
          <Text style={s.postTime}>
            {post.time} · {post.group}
          </Text>
        </View>
      </View>
      <Text style={s.postBody}>{post.body}</Text>
      <View style={s.postActions}>
        <Pressable style={s.postAction}>
          <AppIcon color={colors.muted} name="star" size={15} />
          <Text style={s.postActionText}>{post.likes}</Text>
        </Pressable>
        <Pressable style={s.postAction}>
          <AppIcon color={colors.muted} name="message" size={15} />
          <Text style={s.postActionText}>{post.comments}</Text>
        </Pressable>
        <Pressable style={s.postAction}>
          <AppIcon color={colors.muted} name="globe" size={15} />
          <Text style={s.postActionText}>Share</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function SectionTitle({ title }: { title: string }) {
  return <Text style={s.sectionTitle}>{title}</Text>;
}
export type ServiceItem = { icon: AppIconName; label: string; route: string };
export function FeedItem({
  icon,
  title,
  body,
  meta,
}: {
  icon?: AppIconName;
  title: string;
  body: string;
  meta?: string;
}) {
  return (
    <View style={s.feedItem}>
      {icon ? (
        <View style={s.feedIcon}>
          <AppIcon color={colors.appPrimary} name={icon} size={20} />
        </View>
      ) : null}
      <View style={s.feedCopy}>
        <View style={s.feedTop}>
          <Text style={s.feedTitle}>{title}</Text>
          {meta ? <Text style={s.feedMeta}>{meta}</Text> : null}
        </View>
        <Text style={s.feedBody}>{body}</Text>
      </View>
    </View>
  );
}
export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel2}>{label}</Text>
    </View>
  );
}
export function ServiceGroup({ title, items }: { title: string; items: ServiceItem[] }) {
  return (
    <View style={s.serviceGroup}>
      <View style={s.serviceGroupHeader}>
        <Text style={s.serviceGroupTitle}>{title}</Text>
      </View>
      <View style={s.serviceGrid}>
        {items.map((item) => (
          <Link key={`${title}-${item.label}`} href={item.route as Href} asChild>
            <Pressable style={s.superTile} accessibilityRole="button">
              <View style={s.superIcon}>
                <AppIcon color={colors.appPrimary} name={item.icon} size={22} />
              </View>
              <Text style={s.superLabel}>{item.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}
export function SuperTile({ icon, label, route }: ServiceItem & { featured?: boolean }) {
  return (
    <Link href={route as Href} asChild>
      <Pressable
        style={s.superTile}
        accessibilityRole="button"
        accessibilityLabel={`${label} service`}
      >
        <View style={s.superIcon}>
          <AppIcon color={colors.appPrimary} name={icon} size={22} />
        </View>
        <Text style={s.superLabel}>{label}</Text>
      </Pressable>
    </Link>
  );
}
export function MiniAction({
  icon,
  label,
  route,
}: {
  icon: AppIconName;
  label: string;
  route: string;
}) {
  return (
    <Link href={route as Href} asChild>
      <Pressable style={s.miniAction}>
        <AppIcon color={colors.appPrimary} name={icon} size={20} />
        <Text style={s.miniLabel}>{label}</Text>
      </Pressable>
    </Link>
  );
}
export function ImageCard({ title, meta }: { image: string; title: string; meta: string }) {
  return (
    <View style={s.imageCard}>
      <View style={s.imageCardThumb} />
      <Text style={s.cardTitle}>{title}</Text>
      <Text style={s.cardMeta}>{meta}</Text>
    </View>
  );
}
export function InfoCard({
  title,
  body,
  meta,
}: {
  title: string;
  body: string;
  meta: string;
  accent?: boolean;
}) {
  return (
    <View style={s.infoCard}>
      <Text style={s.cardMeta}>{meta}</Text>
      <Text style={s.cardTitle}>{title}</Text>
      <Text style={s.feedBody}>{body}</Text>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
