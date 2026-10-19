import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import type { Client, Commitment } from "../api";
import { colors, s } from "../theme";
import { Muted } from "../ui";

export function CommitmentsScreen({ api }: { api: Client }) {
  const [items, setItems] = useState<Commitment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api.commitments().then(setItems).catch((e) => setError(String(e.message ?? e)));
  }, [api]);
  return (
    <FlatList
      style={s.screen}
      contentContainerStyle={s.pad}
      data={items ?? []}
      keyExtractor={(c) => String(c.id)}
      ListHeaderComponent={
        <View style={{ gap: 6 }}>
          <Text style={s.h1}>What you owe</Text>
          {error && <Text style={s.error}>{error}</Text>}
          {items?.length === 0 && <Muted>Nothing open. Every “I'll do X by Y” you say in a meeting is tracked here.</Muted>}
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Marks it done"
          onLongPress={async () => {
            await api.closeCommitment(item.id).catch(() => undefined);
            setItems((xs) => xs?.filter((x) => x.id !== item.id) ?? null);
          }}
          style={s.row}
        >
          <Text style={s.body}>{item.text}</Text>
          <Muted>
            {item.due ? `due ${item.due}` : "no date"}
            {item.overdue ? " · overdue" : ""}
          </Muted>
          {item.stuck && <Text style={{ color: colors.warn }}>Stuck: carried over three days or more</Text>}
        </Pressable>
      )}
      ListFooterComponent={items?.length ? <Muted>Long-press an item to mark it done.</Muted> : null}
    />
  );
}
