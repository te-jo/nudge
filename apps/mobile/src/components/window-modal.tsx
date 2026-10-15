import Feather from '@expo/vector-icons/Feather';
import { createContext, useContext, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';

const OnCreamContext = createContext(false);

/**
 * True inside a window card. The card is cream in both colour schemes, so
 * shared components that also appear on plain screens (Button, TaskPicker,
 * NewTaskField) use it
 * to skip their `dark:` styles.
 */
export function useOnCream() {
  return useContext(OnCreamContext);
}

/**
 * The app's one modal look: a cream "window" with Mac-style red, yellow and
 * green buttons in its title bar, centred over a dimmed backdrop. The red
 * button and a tap on the backdrop both close it.
 *
 * Content inside is always on cream, so write it without `dark:` variants.
 * `scroll` wraps the body in a ScrollView for content that can outgrow the
 * screen; short dialogs leave it off so they size to fit.
 *
 * Use WindowModal from a component. Use WindowCard directly as the whole body
 * of a route presented as a `transparentModal` (see tags/register).
 */
export function WindowCard({
  onClose,
  scroll = false,
  children,
}: {
  onClose: () => void;
  scroll?: boolean;
  children: ReactNode;
}) {
  return (
    <OnCreamContext.Provider value>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <Pressable
          onPress={onClose}
          style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          {/* A plain Pressable here swallows taps so they don't reach the backdrop. */}
          <Pressable
            onPress={() => {}}
            className="mx-6 overflow-hidden rounded-[22px] bg-cream"
            style={{ maxHeight: '85%' }}>
            <View className="h-12 flex-row items-center gap-2 border-b-4 border-white px-4">
              <Pressable
                onPress={onClose}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="h-[17px] w-[17px] items-center justify-center rounded-full bg-[#FF5F57]">
                <Feather name="x" size={11} color="#7A1D14" />
              </Pressable>
              <View className="h-[17px] w-[17px] rounded-full bg-[#FEBC2E]" />
              <View className="h-[17px] w-[17px] rounded-full bg-[#28C840]" />
            </View>
            {scroll ? (
              <ScrollView contentContainerClassName="gap-4 p-4" keyboardShouldPersistTaps="handled">
                {children}
              </ScrollView>
            ) : (
              <View className="gap-4 p-4">{children}</View>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </OnCreamContext.Provider>
  );
}

export function WindowModal({
  visible,
  onClose,
  scroll,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  scroll?: boolean;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <WindowCard onClose={onClose} scroll={scroll}>
        {children}
      </WindowCard>
    </Modal>
  );
}
