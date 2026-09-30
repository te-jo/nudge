import { useRef, useState } from 'react';
import { View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RoomPage, RoomTabBar } from '@/components/room-tab-bar';
import { ROOMS } from '@/constants/rooms';

/**
 * Rooms are pages in one pager rather than separate routes: swiping keeps
 * every page mounted, so React Query data stays cached instead of refetching
 * on each switch.
 *
 * There's a `.web.tsx` sibling — react-native-pager-view is native-only and
 * won't bundle for web.
 */
export function RoomsPager() {
  const pager = useRef<PagerView>(null);
  const [index, setIndex] = useState(0);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-white dark:bg-black">
        <PagerView
          ref={pager}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={(event) => setIndex(event.nativeEvent.position)}>
          {ROOMS.map((room) => (
            <RoomPage key={room.key} label={room.label} />
          ))}
        </PagerView>

        <RoomTabBar
          index={index}
          onSelect={(next) => {
            setIndex(next);
            pager.current?.setPage(next);
          }}
        />
      </View>
    </SafeAreaView>
  );
}
