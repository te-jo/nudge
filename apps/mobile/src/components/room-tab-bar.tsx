import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import { useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoomSpots } from '@/components/room-spots';
import { ROOMS, type RoomSpot } from '@/constants/rooms';

// The orange from the room illustrations.
const ACTIVE = '#FF7234';
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
        <Ionicons name={icon} size={22} color={active ? ACTIVE : INACTIVE} />
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

/** A room: its background and its tag spots. */
export function RoomPage({
  label,
  background,
  spots,
}: {
  label: string;
  background: ImageSource;
  spots: RoomSpot[];
}) {
  const { width, height } = useWindowDimensions();

  return (
    // No visible title: the background says which room it is. The label stays
    // for screen readers.
    <View className="flex-1 bg-white" accessibilityLabel={label}>
      {/* Sized to the window, not the page, so it's always full screen height. */}
      <Image
        source={background}
        contentFit="cover"
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
      />
      <RoomSpots spots={spots} width={width} height={height} />
    </View>
  );
}
