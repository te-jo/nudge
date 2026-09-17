import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import { EventRow } from '@/components/event-row';
import { Screen } from '@/components/screen';
import { useEventHistory } from '@/hooks/use-events';

export default function HistoryScreen() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useEventHistory();
  const events = data?.pages.flat() ?? [];

  return (
    <Screen>
      <View className="px-4 pb-2 pt-4">
        <Text className="text-2xl font-bold text-black dark:text-white">History</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventRow event={item} />}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="my-4 items-center">
                <ActivityIndicator />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <Text className="mt-8 text-center text-gray-500 dark:text-gray-400">
              No events logged yet.
            </Text>
          }
        />
      )}
    </Screen>
  );
}
