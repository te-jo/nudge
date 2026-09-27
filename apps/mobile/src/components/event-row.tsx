import type { EventWithRelations } from '@nudge/shared-types';
import { Text, View } from 'react-native';

import { relativeTime } from '@/lib/relative-time';

export function EventRow({ event }: { event: EventWithRelations }) {
  const subtitle = [event.folderName, event.tagLabel, event.note].filter(Boolean).join(' · ');

  return (
    <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
      <View className="flex-1 pr-3">
        <Text className="text-base font-medium text-black dark:text-white" numberOfLines={1}>
          {event.taskName ?? 'No task'}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-sm text-gray-500 dark:text-gray-400" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Text className="text-sm text-gray-500 dark:text-gray-400">
        {relativeTime(event.createdAt)}
      </Text>
    </View>
  );
}
