import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";
import { client, loadSession, saveSession, type Session } from "./src/api";
import { AskScreen } from "./src/screens/Ask";
import { CommitmentsScreen } from "./src/screens/Commitments";
import { LiveCardsScreen } from "./src/screens/LiveCards";
import { MeetingDetailScreen } from "./src/screens/MeetingDetail";
import { MeetingsScreen } from "./src/screens/Meetings";
import { RecordScreen } from "./src/screens/Record";
import { SignInScreen } from "./src/screens/SignIn";
import { colors, s } from "./src/theme";

type Tab = "meetings" | "record" | "ask" | "commitments" | "live";
const TABS: { key: Tab; label: string }[] = [
  { key: "meetings", label: "Meetings" },
  { key: "record", label: "Record" },
  { key: "ask", label: "Ask" },
  { key: "commitments", label: "Owe" },
  { key: "live", label: "Live" },
];

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("meetings");
  const [openMeeting, setOpenMeeting] = useState<string | null>(null);

  useEffect(() => {
    loadSession().then(setSession);
  }, []);
  const api = useMemo(() => (session ? client(session) : null), [session]);

  if (session === undefined) return <View style={s.screen} />;
  if (!session || !api) return <SignInScreen onSignedIn={setSession} />;

  let body;
  if (openMeeting) body = <MeetingDetailScreen api={api} id={openMeeting} onBack={() => setOpenMeeting(null)} />;
  else if (tab === "meetings") body = <MeetingsScreen api={api} onOpen={setOpenMeeting} />;
  else if (tab === "record") body = <RecordScreen api={api} onDone={(id) => setOpenMeeting(id)} />;
  else if (tab === "ask") body = <AskScreen api={api} />;
  else if (tab === "commitments") body = <CommitmentsScreen api={api} />;
  else body = <LiveCardsScreen api={api} />;

  return (
    <SafeAreaView style={s.screen}>
      <StatusBar style="auto" />
      <View style={{ flex: 1 }}>{body}</View>
      <View
        accessibilityRole="tablist"
        style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.rule, backgroundColor: colors.surface }}
      >
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.key && !openMeeting }}
            onPress={() => {
              setOpenMeeting(null);
              setTab(t.key);
            }}
            style={{ flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: tab === t.key && !openMeeting ? colors.ink : colors.muted, fontWeight: tab === t.key ? "700" : "400" }}>
              {t.label}
            </Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={async () => {
            await saveSession(null);
            setSession(null);
          }}
          style={{ minHeight: 52, paddingHorizontal: 12, justifyContent: "center" }}
        >
          <Text style={{ color: colors.muted }}>⎋</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
