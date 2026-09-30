import { useRef, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RoomPage, RoomTabBar } from '@/components/room-tab-bar';
import { ROOMS } from '@/constants/rooms';

/**
 * Web build of RoomsPager. react-native-pager-view is native-only, so this
 * gets the same behaviour from a paging ScrollView.
 */
export function RoomsPager() {
  const scroller = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-white dark:bg-black">
        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) =>
            setIndex(Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1)))
          }
          style={{ flex: 1 }}>
          {ROOMS.map((room) => (
            <View key={room.key} style={{ width }}>
              <RoomPage label={room.label} />
            </View>
          ))}
        </ScrollView>

        <RoomTabBar
          index={index}
          onSelect={(next) => {
            setIndex(next);
            scroller.current?.scrollTo({ x: next * width, animated: true });
          }}
        />
      </View>
    </SafeAreaView>
  );
}
