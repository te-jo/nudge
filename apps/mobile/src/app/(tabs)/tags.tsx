import { Ionicons } from '@expo/vector-icons';
import type { Tag } from '@nudge/shared-types';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { useTags } from '@/hooks/use-tags';
import { useTasks } from '@/hooks/use-tasks';

export default function TagsScreen() {
  const router = useRouter();
  const tags = useTags();
  const tasks = useTasks();

  const taskNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const task of tasks.data ?? []) map.set(task.id, task.name);
    return map;
  }, [tasks.data]);

  function renderTag({ item }: { item: Tag }) {
    const taskName = item.taskId ? taskNameById.get(item.taskId) : null;
    return (
      <Pressable
        onPress={() => router.push(`/tags/${item.id}`)}
        className="m-1.5 flex-1 gap-1 rounded-xl border border-gray-100 bg-gray-50 p-4 active:opacity-70 dark:border-gray-800 dark:bg-gray-900">
        <Text className="text-base font-semibold text-black dark:text-white" numberOfLines={1}>
          {item.label}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400" numberOfLines={1}>
          {taskName ?? 'Unassigned'}
        </Text>
      </Pressable>
    );
  }

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-4 pt-4">
        <Text className="text-2xl font-bold text-black dark:text-white">Tags</Text>
        <Pressable
          onPress={() => router.push('/tags/register')}
          className="flex-row items-center gap-1 rounded-full bg-blue-600 px-3 py-2 active:bg-blue-700">
          <Ionicons name="add" color="white" size={18} />
          <Text className="font-semibold text-white">New Tag</Text>
        </Pressable>
      </View>

      {tags.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={tags.data ?? []}
          key="grid-2"
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={renderTag}
          contentContainerClassName="p-2.5"
          ListEmptyComponent={
            <Text className="mt-8 text-center text-gray-500 dark:text-gray-400">
              No tags yet — tap &ldquo;New Tag&rdquo; to register one.
            </Text>
          }
        />
      )}
    </Screen>
  );
}
