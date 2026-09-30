import { useRef, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';

import { RoomPage, RoomTabBar } from '@/components/room-tab-bar';
import { ROOMS } from '@/constants/rooms';

/**
 * Web build of RoomsPager. react-native-pager-view is native-only, so this
 * gets the same behaviour from a paging ScrollView. Pages run edge to edge,
 * as on native.
 */
export function RoomsPager() {
  const scroller = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        // onMomentumScrollEnd alone isn't enough: on web, trackpad and mouse
        // scrolling produce no momentum event, so the bar never updated.
        scrollEventThrottle={16}
        onScroll={(event) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1));
          if (next !== index) setIndex(next);
        }}
        onMomentumScrollEnd={(event) =>
          setIndex(Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1)))
        }
        style={{ flex: 1 }}>
        {ROOMS.map((room) => (
          <View key={room.key} style={{ width }}>
            <RoomPage label={room.label} background={room.background} />
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
  );
}
