import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import type { Client, MeetingRow } from "../api";
import { s } from "../theme";
import { Muted } from "../ui";

const STATUS: Record<string, string> = {
  created: "Waiting for audio",
  live: "Live now",
  queued: "Waiting for the worker",
  processing: "Processing",
  failed: "Failed",
};

export function MeetingsScreen({ api, onOpen }: { api: Client; onOpen: (id: string) => void }) {
  const [items, setItems] = useState<MeetingRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await api.meetings());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <FlatList
      style={s.screen}
      contentContainerStyle={s.pad}
      data={items ?? []}
      keyExtractor={(m) => m.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
      ListHeaderComponent={
        <View style={{ gap: 6 }}>
          <Text style={s.h1}>Meetings</Text>
          {error && <Text style={s.error}>{error}</Text>}
          {items?.length === 0 && <Muted>No meetings yet. Record your next in-person meeting from the Record tab.</Muted>}
        </View>
      }
      renderItem={({ item }) => (
        <Pressable accessibilityRole="button" onPress={() => onOpen(item.id)} style={s.row}>
          <Text style={[s.body, { fontWeight: "700" }]}>{item.title}</Text>
          <Muted>
            {new Date(item.started_at).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            {item.open_action_items ? ` · ${item.open_action_items} open` : ""}
          </Muted>
          <Text style={s.body} numberOfLines={2}>
            {item.overview ?? STATUS[item.status] ?? ""}
          </Text>
        </Pressable>
      )}
    />
  );
}
