import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { YStack } from 'tamagui';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import {
  type ConfirmOptions,
  platformConfirm,
  registerConfirmHandler,
} from '@/modules/shared/ui/notify';

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

type ConfirmSheetProps = ConfirmOptions & {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Confirmation in a bottom sheet: the body, a primary (or `danger`) confirm button, and a cancel button. */
export function ConfirmSheet({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  return (
    <BottomSheet onClose={onCancel} scrollable title={title} visible={visible}>
      <YStack gap="$x3" paddingBottom="$x2">
        <AppText tone="muted">{body}</AppText>
        <AppButton
          fullWidth
          label={confirmLabel}
          onPress={onConfirm}
          variant={destructive ? 'danger' : 'primary'}
        />
        <AppButton fullWidth label={cancelLabel} onPress={onCancel} variant="ghost" />
      </YStack>
    </BottomSheet>
  );
}

type Pending = { options: ConfirmOptions; resolve: (ok: boolean) => void };

/**
 * Mounted once in `app/_layout.tsx`. Serves `useConfirm()` and the module `confirmAction` helpers with one
 * themed sheet. A new request while one is open declines the earlier one.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [visible, setVisible] = useState(false);
  const pendingRef = useRef<Pending | null>(null);

  const settle = useCallback((ok: boolean) => {
    const current = pendingRef.current;
    pendingRef.current = null;
    setVisible(false);
    current?.resolve(ok);
  }, []);

  const confirm = useCallback<ConfirmFn>(
    (options) =>
      new Promise<boolean>((resolve) => {
        pendingRef.current?.resolve(false);
        const next = { options, resolve };
        pendingRef.current = next;
        setPending(next);
        setVisible(true);
      }),
    [],
  );

  useEffect(() => {
    registerConfirmHandler(confirm);
    return () => {
      registerConfirmHandler(null);
      pendingRef.current?.resolve(false);
    };
  }, [confirm]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending ? (
        <ConfirmSheet
          {...pending.options}
          onCancel={() => settle(false)}
          onConfirm={() => settle(true)}
          visible={visible}
        />
      ) : null}
    </ConfirmContext.Provider>
  );
}

/** `const confirm = useConfirm(); if (await confirm({ title, body, confirmLabel, destructive: true })) …` */
export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext) ?? platformConfirm;
}
