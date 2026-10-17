import Ionicons from '@expo/vector-icons/Ionicons';
import type { Tag } from '@nudge/shared-types';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { WindowModal } from '@/components/window-modal';
import { useLogEvent } from '@/hooks/use-events';
import { useTasks } from '@/hooks/use-tasks';
import { ApiError, apiFetch } from '@/lib/api';
import { NfcNotSupportedError, readTagToken } from '@/lib/nfc';

// scan.svg is split into a static base and its three sparkles so only the
// sparkles move. Boxes are in the original 164×194 design space.
const DESIGN = { width: 164, height: 194 };
const WIDTH = 144;
const MARGIN = 16;
const SCALE = WIDTH / DESIGN.width;

const SPARKLES = [
  { source: require('@/assets/images/scan/sparkle-pink.svg'), x: 73, y: 0, w: 33, h: 44, delay: 0 },
  { source: require('@/assets/images/scan/sparkle-orange.svg'), x: 0, y: 44, w: 19.1, h: 25, delay: 500 },
  { source: require('@/assets/images/scan/sparkle-olive.svg'), x: 127, y: 52, w: 32.1, h: 44, delay: 1000 },
];

const LOGGED_VISIBLE_MS = 3500;
// Sits just above the floating tab bar.
const TOAST_ABOVE_TAB_BAR = 64;

type ScanState =
  | { status: 'idle' }
  | { status: 'scanning' }
  | { status: 'logged'; taskName: string }
  | { status: 'unregistered'; uid: string | null };

/** One sparkle that twinkles (grows, tilts, brightens) on a loop. */
function Sparkle({ sparkle }: { sparkle: (typeof SPARKLES)[number] }) {
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    const ease = Easing.inOut(Easing.quad);
    t.value = withDelay(
      sparkle.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: ease }),
          withTiming(0, { duration: 600, easing: ease }),
          // A pause, so the three take turns rather than pulsing constantly.
          withTiming(0, { duration: 900 }),
        ),
        -1,
      ),
    );
  }, [reduceMotion, sparkle.delay, t]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.7 + 0.3 * t.value,
    transform: [{ scale: 1 + 0.3 * t.value }, { rotate: `${t.value * 20}deg` }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: sparkle.x * SCALE,
          top: sparkle.y * SCALE,
          width: sparkle.w * SCALE,
          height: sparkle.h * SCALE,
        },
        style,
      ]}>
      <Image source={sparkle.source} style={{ width: '100%', height: '100%' }} />
    </Animated.View>
  );
}

/**
 * The scan illustration, floating top-right over the rooms. Tapping it reads
 * a chip: a registered tag logs an event, anything else offers to register it.
 */
export function ScanButton() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tasks = useTasks();
  const logEvent = useLogEvent();
  const [scan, setScan] = useState<ScanState>({ status: 'idle' });

  // The success toast clears itself; the unregistered window waits for the user.
  useEffect(() => {
    if (scan.status !== 'logged') return;
    const timer = setTimeout(() => setScan({ status: 'idle' }), LOGGED_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [scan]);

  async function handleScan() {
    setScan({ status: 'scanning' });
    try {
      const uid = await readTagToken();
      if (!uid) {
        // Blank chip — nothing written yet, so registering will write a token.
        setScan({ status: 'unregistered', uid: null });
        return;
      }

      let tag: Tag;
      try {
        tag = await apiFetch<Tag>(`/tags/uid/${encodeURIComponent(uid)}`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setScan({ status: 'unregistered', uid });
          return;
        }
        throw err;
      }

      // Via the hook so every events query gets invalidated.
      await logEvent.mutateAsync({ tagId: tag.id });
      const taskName = tasks.data?.find((task) => task.id === tag.taskId)?.name;
      setScan({ status: 'logged', taskName: taskName ?? tag.label });
    } catch (err) {
      setScan({ status: 'idle' });
      if (err instanceof NfcNotSupportedError) {
        Alert.alert('NFC not supported', err.message);
      } else if (err instanceof Error) {
        Alert.alert('Scan failed', err.message);
      }
    }
  }

  const close = () => setScan({ status: 'idle' });

  return (
    <>
      <Pressable
        onPress={() => void handleScan()}
        disabled={scan.status === 'scanning'}
        accessibilityRole="button"
        accessibilityLabel="Scan a tag"
        className="absolute active:scale-95"
        style={{
          top: insets.top + MARGIN,
          right: MARGIN,
          width: WIDTH,
          height: DESIGN.height * SCALE,
          opacity: scan.status === 'scanning' ? 0.6 : 1,
        }}>
        <Image
          source={require('@/assets/images/scan/base.svg')}
          style={{ width: '100%', height: '100%' }}
        />
        {SPARKLES.map((sparkle) => (
          <Sparkle key={sparkle.x} sparkle={sparkle} />
        ))}
      </Pressable>

      {scan.status === 'logged' ? (
        // A toast, not a window: nothing to decide, so it shouldn't block the screen.
        <Animated.View
          entering={FadeInDown.duration(200)}
          exiting={FadeOutDown.duration(200)}
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          className="absolute inset-x-0 items-center px-6"
          style={{ bottom: insets.bottom + TOAST_ABOVE_TAB_BAR }}>
          <View className="flex-row items-center gap-2 rounded-full bg-cream px-4 py-2.5 shadow">
            <Ionicons name="checkmark-circle" size={20} color="#5E804F" />
            <Text numberOfLines={1} className="shrink font-semibold text-ink">
              Logged {scan.taskName}
            </Text>
          </View>
        </Animated.View>
      ) : null}

      <WindowModal visible={scan.status === 'unregistered'} onClose={close}>
        <Text className="text-lg font-semibold text-ink">This tag isn’t registered yet</Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button title="Cancel" variant="secondary" onPress={close} />
          </View>
          <View className="flex-1">
            <Button
              title="Register it"
              onPress={() => {
                const uid = scan.status === 'unregistered' ? scan.uid : null;
                close();
                router.push({ pathname: '/tags/register', params: uid ? { uid } : {} });
              }}
            />
          </View>
        </View>
      </WindowModal>
    </>
  );
}
