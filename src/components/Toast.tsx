/**
 * Undo toast. Every tick or delete calls `showUndo(message, undoFn)`; the toast
 * stays for 10 seconds with a big "Undo" button (design rule §6).
 */
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';

const UNDO_MS = 10_000;

type ToastState = { message: string; onUndo?: () => void } | null;
type Ctx = { showUndo: (message: string, onUndo?: () => void) => void };
const ToastCtx = createContext<Ctx>({ showUndo: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showUndo = useCallback((message: string, onUndo?: () => void) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, onUndo });
    timer.current = setTimeout(() => setToast(null), UNDO_MS);
  }, []);

  return (
    <ToastCtx.Provider value={{ showUndo }}>
      {children}
      {toast ? (
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', left: 12, right: 12, bottom: insets.bottom + 100 }}
        >
          <View
            accessibilityLiveRegion="polite"
            className="bg-ink rounded-card px-4 py-2 flex-row items-center justify-between"
          >
            <AppText className="text-bg flex-1 pr-2">{toast.message}</AppText>
            {toast.onUndo ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.undo')}
                onPress={() => {
                  toast.onUndo?.();
                  setToast(null);
                }}
                className="min-h-tap min-w-tap px-4 items-center justify-center rounded-xl bg-bg"
              >
                <AppText bold className="text-primary">
                  {t('common.undo')}
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
