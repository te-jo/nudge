import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { EventRow } from '@/components/event-row';
import { Screen } from '@/components/screen';
import { TaskPicker } from '@/components/task-picker';
import { useLogEvent, useTagEvents } from '@/hooks/use-events';
import { useDeleteTag, useTag, useUpdateTag } from '@/hooks/use-tags';
import { useTasks } from '@/hooks/use-tasks';

export default function TagDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const tagQuery = useTag(id);
  const tasksQuery = useTasks();
  const eventsQuery = useTagEvents(id);
  const updateTag = useUpdateTag(id);
  const deleteTag = useDeleteTag(id);
  const logEvent = useLogEvent();

  const [label, setLabel] = useState('');
  // Adjust local state during render (React's recommended pattern for
  // syncing from a prop/query) rather than in an effect, so switching to a
  // different tag resets the field without an extra render pass.
  const [loadedTagId, setLoadedTagId] = useState<string | null>(null);
  if (tagQuery.data && loadedTagId !== tagQuery.data.id) {
    setLabel(tagQuery.data.label);
    setLoadedTagId(tagQuery.data.id);
  }

  if (tagQuery.isLoading || !tagQuery.data) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  const tag = tagQuery.data;
  const trimmedLabel = label.trim();
  const labelChanged = trimmedLabel !== '' && trimmedLabel !== tag.label;

  function handleDelete() {
    Alert.alert('Delete tag', `Delete "${tag.label}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTag.mutateAsync();
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: tag.label }} />
      <ScrollView contentContainerClassName="gap-6 p-4" keyboardShouldPersistTaps="handled">
        <View className="gap-2">
          <Text className="text-base font-semibold text-black dark:text-white">Label</Text>
          <View className="flex-row items-center gap-2">
            <TextInput
              value={label}
              onChangeText={setLabel}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-base text-black dark:border-gray-700 dark:text-white"
            />
            {labelChanged ? (
              <Button title="Save" variant="secondary" onPress={() => updateTag.mutate({ label: trimmedLabel })} />
            ) : null}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-base font-semibold text-black dark:text-white">Task</Text>
          <TaskPicker
            tasks={tasksQuery.data ?? []}
            selectedTaskId={tag.taskId}
            onSelect={(taskId) => updateTag.mutate({ taskId })}
          />
        </View>

        <Button
          title="Log Event Now"
          onPress={() => logEvent.mutate({ tagId: tag.id })}
          disabled={logEvent.isPending}
        />

        <View>
          <Text className="mb-2 text-lg font-semibold text-black dark:text-white">Recent events</Text>
          {eventsQuery.isLoading ? (
            <ActivityIndicator />
          ) : eventsQuery.data && eventsQuery.data.length > 0 ? (
            <View className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
              {eventsQuery.data.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </View>
          ) : (
            <Text className="text-gray-500 dark:text-gray-400">No events logged for this tag yet.</Text>
          )}
        </View>

        <Button title="Delete Tag" variant="destructive" onPress={handleDelete} />
      </ScrollView>
    </Screen>
  );
}
