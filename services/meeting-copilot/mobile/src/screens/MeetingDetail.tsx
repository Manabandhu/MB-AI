import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { clock, type Client, type MeetingDetail } from "../api";
import { colors, s } from "../theme";
import { Button, Muted } from "../ui";

export function MeetingDetailScreen({ api, id, onBack }: { api: Client; id: string; onBack: () => void }) {
  const [m, setM] = useState<MeetingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const d = await api.meeting(id);
        setM(d);
        if (["queued", "processing", "live"].includes(d.status)) timer = setTimeout(load, 4000);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    };
    load();
    return () => clearTimeout(timer);
  }, [api, id]);

  const names = Object.fromEntries((m?.speakers ?? []).map((sp) => [sp.label, sp.display_name]));
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad}>
      <Button title="‹ Meetings" onPress={onBack} />
      {error && <Text style={s.error}>{error}</Text>}
      {!m ? (
        <Muted>Loading…</Muted>
      ) : (
        <>
          <Text style={s.h1}>{m.title}</Text>
          {m.status !== "done" && <Muted>{m.status === "failed" ? `Failed: ${m.error}` : `${m.stage ?? m.status}…`}</Muted>}
          {m.summary && (
            <View style={{ gap: 8 }}>
              <Text style={s.body}>{m.summary.overview}</Text>
              {m.summary.people.map((p) => (
                <View key={p.name} style={s.row}>
                  <Text style={[s.body, { fontWeight: "700" }]}>{p.name}</Text>
                  {p.yesterday.length > 0 && <Text style={s.body}>Yesterday: {p.yesterday.join("; ")}</Text>}
                  {p.today.length > 0 && <Text style={s.body}>Today: {p.today.join("; ")}</Text>}
                  {p.blockers.length > 0 && <Text style={[s.body, { color: colors.danger }]}>Blocked: {p.blockers.join("; ")}</Text>}
                </View>
              ))}
              {(m.summary.fields_meta ?? []).map((f) => {
                const v = m.summary?.fields?.[f.key];
                if (!v || (Array.isArray(v) && !v.length)) return null;
                return (
                  <View key={f.key}>
                    <Text style={s.h2}>{f.label}</Text>
                    <Text style={s.body}>{Array.isArray(v) ? v.map((x) => `• ${x}`).join("\n") : v}</Text>
                  </View>
                );
              })}
              {m.summary.decisions.length > 0 && (
                <View>
                  <Text style={s.h2}>Decisions</Text>
                  {m.summary.decisions.map((d, i) => (
                    <Text key={i} style={s.body}>
                      • {typeof d === "string" ? d : d.text}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
          {m.action_items.length > 0 && (
            <View style={{ gap: 6 }}>
              <Text style={s.h2}>Action items</Text>
              {m.action_items.map((a) => (
                <Pressable
                  key={a.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: a.done }}
                  onPress={async () => {
                    setM({ ...m, action_items: m.action_items.map((x) => (x.id === a.id ? { ...x, done: !x.done } : x)) });
                    await api.setActionItem(a.id, !a.done).catch(() => undefined);
                  }}
                  style={[s.row, { flexDirection: "row", gap: 10 }]}
                >
                  <Text style={s.body}>{a.done ? "☑" : "☐"}</Text>
                  <Text style={[s.body, { flex: 1, textDecorationLine: a.done ? "line-through" : "none" }]}>
                    {a.owner ? `${a.owner}: ` : ""}
                    {a.text}
                    {a.due ? ` (due ${a.due})` : ""}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          {m.segments.length > 0 && (
            <View style={{ gap: 6 }}>
              <Text style={s.h2}>Transcript</Text>
              {m.segments.map((seg) => (
                <View key={seg.id} style={{ flexDirection: "row", gap: 10 }}>
                  <Text style={[s.muted, { width: 44 }]}>{clock(seg.start)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.muted, { fontWeight: "700" }]}>{names[seg.speaker_label] ?? seg.speaker_label}</Text>
                    <Text style={s.body}>{seg.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
