import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import type { Card, Client, MeetingRow } from "../api";
import { colors, s } from "../theme";
import { Button, Muted } from "../ui";

/**
 * The phone as a second screen: answer cards from a meeting that's live on your laptop (or with a bot),
 * delivered as a buzz plus the card. The phone itself doesn't capture audio here.
 */
export function LiveCardsScreen({ api }: { api: Client }) {
  const [live, setLive] = useState<MeetingRow[]>([]);
  const [watching, setWatching] = useState<MeetingRow | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [status, setStatus] = useState("");
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    api.meetings().then((ms) => setLive(ms.filter((m) => m.status === "live"))).catch(() => undefined);
  }, [api]);

  useEffect(() => {
    if (!watching) return;
    const sock = new WebSocket(api.liveUrl(watching.id));
    ws.current = sock;
    setStatus("Connecting…");
    sock.onopen = () => setStatus("Watching");
    sock.onclose = () => setStatus("Ended");
    sock.onmessage = (msg) => {
      const e = JSON.parse(String(msg.data));
      if (e.type === "card") {
        setCards((cs) => [e.card as Card, ...cs.filter((c) => c.id !== e.card.id)]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      }
      if (e.type === "stopped") setStatus("Ended");
    };
    return () => sock.close();
  }, [api, watching]);

  const feedback = (card: Card, value: number) =>
    card.id != null && ws.current?.send(JSON.stringify({ type: "feedback", card_id: card.id, value }));

  if (!watching) {
    return (
      <View style={[s.screen, s.pad]}>
        <Text style={s.h1}>Live cards</Text>
        <Muted>Meetings that are live right now. Pick one to get its answer cards on this phone.</Muted>
        {live.length === 0 && <Muted>Nothing is live. Start live assist on your computer, or send a bot to a call.</Muted>}
        {live.map((m) => (
          <Button key={m.id} title={m.title} onPress={() => setWatching(m)} />
        ))}
      </View>
    );
  }
  return (
    <FlatList
      style={s.screen}
      contentContainerStyle={s.pad}
      data={cards}
      keyExtractor={(c, i) => String(c.id ?? i)}
      ListHeaderComponent={
        <View style={{ gap: 6 }}>
          <Text style={s.h1}>{watching.title}</Text>
          <Muted>{status}</Muted>
          <Button title="Stop watching" onPress={() => setWatching(null)} />
        </View>
      }
      renderItem={({ item }) => (
        <View style={[s.card, !item.grounded && { borderLeftColor: colors.rule }]}>
          {item.trigger_text ? <Muted>{item.trigger_text}</Muted> : null}
          <Text style={[s.body, { fontSize: 18 }]}>{item.answer}</Text>
          {item.facts.map((f, i) => (
            <Text key={i} style={s.body}>
              • {f}
            </Text>
          ))}
          {item.sources.map((src) => (
            <Muted key={src.n}>{src.meeting_title}</Muted>
          ))}
          <View style={{ flexDirection: "row", gap: 16 }}>
            <Pressable accessibilityLabel="Useful" onPress={() => feedback(item, 1)}>
              <Text style={{ fontSize: 22 }}>👍</Text>
            </Pressable>
            <Pressable accessibilityLabel="Not useful" onPress={() => feedback(item, -1)}>
              <Text style={{ fontSize: 22 }}>👎</Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}
