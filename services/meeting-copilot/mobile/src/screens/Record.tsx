import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { useState } from "react";
import { ScrollView, Switch, Text, TextInput, View } from "react-native";
import { clock, type Client } from "../api";
import { colors, s } from "../theme";
import { Button, Muted } from "../ui";

/**
 * In-person and speakerphone meetings only: phones don't let apps record another app's call audio.
 * Explicit start, never always-on. Pausing is "off the record": nothing is captured while paused.
 */
export function RecordScreen({ api, onDone }: { api: Client; onDone: (meetingId: string) => void }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder, 500);
  const [title, setTitle] = useState("");
  const [attendees, setAttendees] = useState("");
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<"setup" | "recording" | "paused" | "uploading">("setup");
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) {
      setError("Microphone access is needed to record. Allow it in Settings.");
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setPhase("recording");
  }

  function togglePause() {
    if (phase === "recording") {
      recorder.pause();
      setPhase("paused");
    } else {
      recorder.record();
      setPhase("recording");
    }
  }

  async function stop() {
    setPhase("uploading");
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error("The recording couldn't be saved.");
      const day = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      const list = attendees.split(",").map((a) => a.trim()).filter(Boolean);
      const m = await api.createMeeting(title.trim() || `In-person, ${day}`, "auto", list);
      await api.upload(m.id, uri);
      setPhase("setup");
      setTitle("");
      setConsent(false);
      onDone(m.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("paused");
    }
  }

  if (phase !== "setup") {
    return (
      <View style={[s.screen, s.pad, { justifyContent: "center", alignItems: "stretch" }]}>
        <Text style={[s.h2, { color: phase === "recording" ? colors.rec : colors.muted, textAlign: "center" }]}>
          {phase === "recording" ? "● Recording" : phase === "paused" ? "Off the record (paused)" : "Uploading…"}
        </Text>
        <Text style={{ fontSize: 56, fontWeight: "300", textAlign: "center", color: colors.ink }} accessibilityLabel="Elapsed time">
          {clock((state.durationMillis ?? 0) / 1000)}
        </Text>
        {error && <Text style={s.error}>{error}</Text>}
        {phase !== "uploading" && (
          <View style={{ gap: 10 }}>
            <Button title={phase === "paused" ? "Back on the record" : "Off the record"} onPress={togglePause} />
            <Button title="Stop and process" primary onPress={stop} />
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad}>
      <Text style={s.h1}>Record in person</Text>
      <Muted>Uses this phone's microphone. Speakers are told apart by voice after the meeting; anyone with an opt-in voiceprint is named.</Muted>
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Title (optional)" accessibilityLabel="Title" />
      <TextInput style={s.input} value={attendees} onChangeText={setAttendees} placeholder="Who's here, separated by commas" accessibilityLabel="Attendees" />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Switch value={consent} onValueChange={setConsent} accessibilityLabel="Everyone agreed to be recorded" />
        <Text style={[s.body, { flex: 1 }]}>Everyone here knows this is being recorded and agreed</Text>
      </View>
      {error && <Text style={s.error}>{error}</Text>}
      <Button title="Start recording" primary onPress={start} disabled={!consent} />
    </ScrollView>
  );
}
