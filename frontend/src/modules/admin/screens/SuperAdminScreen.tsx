import { color as colors } from '@manabandhu/design-system';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type AutomationOperation,
  executeAutomation,
  listAutomationOperations,
} from '@/modules/admin/api';
import { useAdaptiveLayout } from '@/platform/adaptive';

export default function SuperAdminScreen() {
  const layout = useAdaptiveLayout();
  const operations = useQuery({
    queryKey: ['super-admin', 'automations'],
    queryFn: listAutomationOperations,
    retry: false,
  });
  const [selectedId, setSelectedId] = useState('quality-review');
  const [environment, setEnvironment] = useState('staging');
  const [ref, setRef] = useState('main');
  const [reason, setReason] = useState(
    'Run an operator-approved automation from the control plane.',
  );
  const [confirmed, setConfirmed] = useState(false);
  const selected = useMemo(
    () => operations.data?.find((operation) => operation.id === selectedId),
    [operations.data, selectedId],
  );
  const execution = useMutation({
    mutationFn: () => executeAutomation(selectedId, { environment, ref, reason, confirmed }),
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Temporary public access</Text>
              <Text style={styles.title}>Operations control plane</Text>
              <Text style={styles.body}>
                Dispatch audited workflows. Infrastructure credentials remain on the backend and CI.
              </Text>
            </View>
            <Link href="/" style={styles.link}>
              Home
            </Link>
          </View>

          {operations.isError ? (
            <View style={styles.errorPanel}>
              <Text style={styles.errorText}>
                Control plane unavailable. Check that the backend is running and public admin access
                is enabled.
              </Text>
            </View>
          ) : (
            <View style={[styles.grid, layout.windowClass !== 'compact' && styles.gridExpanded]}>
              <View style={styles.panel}>
                <Text style={styles.sectionTitle}>Automations</Text>
                {operations.data?.map((operation) => (
                  <OperationCard
                    key={operation.id}
                    operation={operation}
                    selected={selectedId === operation.id}
                    onPress={() => {
                      setSelectedId(operation.id);
                      setConfirmed(false);
                      execution.reset();
                    }}
                  />
                ))}
              </View>

              <View style={styles.panel}>
                <Text style={styles.sectionTitle}>Execution request</Text>
                <Text style={styles.label}>Environment</Text>
                <View style={styles.segmented}>
                  {['development', 'staging', 'production'].map((value) => (
                    <Pressable
                      key={value}
                      onPress={() => setEnvironment(value)}
                      style={[styles.segment, environment === value && styles.segmentSelected]}
                    >
                      <Text
                        style={
                          environment === value ? styles.segmentTextSelected : styles.segmentText
                        }
                      >
                        {value}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.label}>Git ref</Text>
                <TextInput
                  value={ref}
                  onChangeText={setRef}
                  style={styles.input}
                  autoCapitalize="none"
                />
                <Text style={styles.label}>Reason</Text>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  style={[styles.input, styles.reasonInput]}
                  multiline
                  maxLength={500}
                />
                {selected?.requiresConfirmation && (
                  <Pressable
                    style={styles.confirmRow}
                    onPress={() => setConfirmed((value) => !value)}
                  >
                    <View style={[styles.checkbox, confirmed && styles.checkboxSelected]} />
                    <Text style={styles.confirmText}>
                      I understand this {selected.risk}-risk operation.
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  accessibilityRole="button"
                  disabled={
                    !selected?.configured || execution.isPending || reason.trim().length < 10
                  }
                  onPress={() => execution.mutate()}
                  style={({ pressed }) => [
                    styles.runButton,
                    (!selected?.configured || execution.isPending) && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.runButtonText}>
                    {execution.isPending ? 'Dispatching…' : 'Run selected automation'}
                  </Text>
                </Pressable>
                {!selected?.configured && (
                  <Text style={styles.hint}>GitHub dispatch is not configured.</Text>
                )}
                {execution.isError && (
                  <Text style={styles.errorText}>{execution.error.message}</Text>
                )}
                {execution.data && (
                  <View style={styles.successPanel}>
                    <Text style={styles.successTitle}>Accepted</Text>
                    <Text style={styles.resultText}>Execution {execution.data.executionId}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function OperationCard({
  operation,
  selected,
  onPress,
}: {
  operation: AutomationOperation;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.operation, selected && styles.operationSelected]}>
      <View style={styles.operationHeading}>
        <Text style={styles.operationLabel}>{operation.label}</Text>
        <Text style={styles.risk}>{operation.risk}</Text>
      </View>
      <Text style={styles.operationDescription}>{operation.description}</Text>
      <Text style={operation.configured ? styles.configured : styles.notConfigured}>
        {operation.configured ? 'Ready' : 'Needs configuration'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { flexGrow: 1, padding: 24 },
  container: { alignSelf: 'center', width: '100%', gap: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 24 },
  eyebrow: { color: colors.teal, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', marginTop: 8 },
  body: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 8, maxWidth: 720 },
  link: { color: colors.primary, fontWeight: '700', padding: 8 },
  grid: { gap: 20 },
  gridExpanded: { flexDirection: 'row', alignItems: 'flex-start' },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    gap: 12,
    padding: 20,
  },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  operation: { borderColor: colors.border, borderRadius: 14, borderWidth: 1, gap: 6, padding: 14 },
  operationSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  operationHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  operationLabel: { color: colors.ink, flex: 1, fontSize: 15, fontWeight: '700' },
  operationDescription: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  risk: { color: colors.teal, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  configured: { color: colors.success, fontSize: 12, fontWeight: '700' },
  notConfigured: { color: colors.error, fontSize: 12, fontWeight: '700' },
  label: { color: colors.ink, fontSize: 13, fontWeight: '700', marginTop: 4 },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segment: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  segmentSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentText: { color: colors.ink, fontSize: 12 },
  segmentTextSelected: { color: '#fff', fontSize: 12, fontWeight: '700' },
  input: {
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reasonInput: { minHeight: 96, textAlignVertical: 'top' },
  confirmRow: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingVertical: 6 },
  checkbox: { borderColor: colors.muted, borderRadius: 4, borderWidth: 2, height: 20, width: 20 },
  checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  confirmText: { color: colors.ink, flex: 1, fontSize: 13 },
  runButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 50,
  },
  runButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
  hint: { color: colors.muted, fontSize: 12 },
  errorPanel: { backgroundColor: '#ffdad6', borderRadius: 16, padding: 18 },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 20 },
  successPanel: { backgroundColor: '#d7f8df', borderRadius: 12, gap: 4, padding: 12 },
  successTitle: { color: colors.success, fontWeight: '800' },
  resultText: { color: colors.ink, fontSize: 12 },
});
