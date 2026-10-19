import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { client, saveSession, type Session } from "../api";
import { s } from "../theme";
import { Button, Muted } from "../ui";

export function SignInScreen({ onSignedIn }: { onSignedIn: (session: Session) => void }) {
  const [server, setServer] = useState("https://");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    const session = { server: server.trim(), token: token.trim() };
    try {
      await client(session).check();
      await saveSession(session);
      onSignedIn(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[s.screen, s.pad, { justifyContent: "center" }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text style={s.h1}>Meeting Copilot</Text>
      <Muted>Your server's address, and a personal access token from Settings → Account on the web app.</Muted>
      <View style={{ gap: 8 }}>
        <TextInput style={s.input} value={server} onChangeText={setServer} autoCapitalize="none" autoCorrect={false} keyboardType="url" accessibilityLabel="Server address" />
        <TextInput style={s.input} value={token} onChangeText={setToken} autoCapitalize="none" secureTextEntry placeholder="mc_…" accessibilityLabel="Access token" />
      </View>
      {error && <Text style={s.error}>{error}</Text>}
      <Button title={busy ? "Checking…" : "Sign in"} primary onPress={submit} disabled={busy || !token.trim() || server.length < 10} />
    </KeyboardAvoidingView>
  );
}
