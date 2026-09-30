import Feather from '@expo/vector-icons/Feather';
import { Image, type ImageSource } from 'expo-image';
import { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROOMS } from '@/constants/rooms';

const ACTIVE = '#2563eb';
const INACTIVE = '#9ca3af';

function TabIcon({
  icon,
  active,
  onPress,
}: {
  icon: (typeof ROOMS)[number]['icon'];
  active: boolean;
  onPress: () => void;
}) {
  const [held, setHeld] = useState(false);

  // Grows a little when active, a little more while held down.
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(held ? 1.35 : active ? 1.15 : 1, { damping: 14 }) }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setHeld(true)}
      onPressOut={() => setHeld(false)}
      hitSlop={8}
      className="flex-1 items-center justify-center py-3">
      <Animated.View style={style}>
        <Feather name={icon} size={22} color={active ? ACTIVE : INACTIVE} />
      </Animated.View>
    </Pressable>
  );
}

export function RoomTabBar({
  index,
  onSelect,
}: {
  index: number;
  onSelect: (index: number) => void;
}) {
  const insets = useSafeAreaInsets();

  // Floats over the page so the room background runs to the bottom edge.
  return (
    <View
      className="absolute inset-x-0 bottom-0 flex-row"
      style={{ paddingBottom: insets.bottom }}>
      {ROOMS.map((room, i) => (
        <TabIcon
          key={room.key}
          icon={room.icon}
          active={i === index}
          onPress={() => onSelect(i)}
        />
      ))}
    </View>
  );
}

/** Placeholder page body, until each room gets real content. */
export function RoomPage({ label, background }: { label: string; background: ImageSource }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  return (
    <View className="flex-1 items-center justify-center gap-2 p-6" style={{ paddingTop: insets.top }}>
      {/* Sized to the window, not the page, so it's always full screen height. */}
      <Image
        source={background}
        contentFit="cover"
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
      />
      <Text className="text-2xl font-bold text-black dark:text-white">{label}</Text>
      <Text className="text-center text-gray-500 dark:text-gray-400">
        Nothing here yet — swipe left or right to move between rooms.
      </Text>
    </View>
  );
}
