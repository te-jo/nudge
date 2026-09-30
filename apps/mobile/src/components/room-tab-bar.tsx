import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

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
  return (
    <View className="flex-row border-t border-gray-100 dark:border-gray-800">
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
export function RoomPage({ label }: { label: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-2 p-6">
      <Text className="text-2xl font-bold text-black dark:text-white">{label}</Text>
      <Text className="text-center text-gray-500 dark:text-gray-400">
        Nothing here yet — swipe left or right to move between rooms.
      </Text>
    </View>
  );
}
