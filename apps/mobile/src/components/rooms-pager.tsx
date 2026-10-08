import { useRef, useState } from 'react';
import { View } from 'react-native';
import PagerView from 'react-native-pager-view';

import { RoomPage, RoomTabBar } from '@/components/room-tab-bar';
import { ROOMS } from '@/constants/rooms';

/**
 * Pages run edge to edge, under the status bar and the tab bar, because the
 * room backgrounds are drawn at full-screen size.
 *
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
    <View className="flex-1 bg-white dark:bg-black">
      <PagerView
        ref={pager}
        style={{ flex: 1 }}
        initialPage={0}
        // onPageSelected only fires once the page settles. Tracking the
        // scroll too makes the bar follow the swipe as it crosses halfway.
        onPageScroll={(event) => {
          const { position, offset } = event.nativeEvent;
          const next = offset > 0.5 ? position + 1 : position;
          if (next !== index && next >= 0 && next < ROOMS.length) setIndex(next);
        }}
        onPageSelected={(event) => setIndex(event.nativeEvent.position)}>
        {ROOMS.map((room) => (
          <RoomPage key={room.key} label={room.label} background={room.background} spots={room.spots} />
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
  );
}
