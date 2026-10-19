import { useState } from "react";
import { ScrollView, Text, TextInput } from "react-native";
import { clock, type Client } from "../api";
import { colors, s } from "../theme";
import { Button, Muted } from "../ui";

export function AskScreen({ api }: { api: Client }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<Client["ask"]>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    setBusy(true);
    setError(null);
    try {
      setResult(await api.ask(q.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <Text style={s.h1}>Ask your meetings</Text>
      <Muted>Answers come only from your recorded meetings, with the meeting and moment they came from.</Muted>
      <TextInput style={[s.input, { minHeight: 80 }]} multiline value={q} onChangeText={setQ} placeholder="What did I commit to this week?" accessibilityLabel="Question" />
      <Button title={busy ? "Searching…" : "Ask"} primary onPress={ask} disabled={busy || !q.trim()} />
      {error && <Text style={s.error}>{error}</Text>}
      {result && (
        <>
          <Text style={[s.body, { fontSize: 18 }]}>{result.answer}</Text>
          {!result.grounded && <Text style={{ color: colors.warn }}>Check the sources: this answer mentions details they don't contain.</Text>}
          {result.sources.map((src) => (
            <Muted key={src.n}>
              [{src.n}] {src.meeting_title}
              {src.started_at ? `, ${new Date(src.started_at).toLocaleDateString()}` : ""}
              {src.start != null ? ` at ${clock(src.start)}` : ""}
            </Muted>
          ))}
        </>
      )}
    </ScrollView>
  );
}
