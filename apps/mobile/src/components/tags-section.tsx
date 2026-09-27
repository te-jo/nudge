import type { Tag, Task } from '@nudge/shared-types';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { TaskPicker } from '@/components/task-picker';
import { useDeleteTagById, useSetTagTask, useTags } from '@/hooks/use-tags';
import { useTasks } from '@/hooks/use-tasks';
import { wipeTagChip } from '@/lib/nfc';

function alertError(title: string, err: unknown) {
  Alert.alert(title, err instanceof Error ? err.message : 'Something went wrong.');
}

export function TagsSection({ uid }: { uid?: string }) {
  const router = useRouter();
  const tags = useTags();
  const tasks = useTasks();
  const setTagTask = useSetTagTask();
  const deleteTag = useDeleteTagById();

  const [assigning, setAssigning] = useState<Tag | null>(null);
  const [wiping, setWiping] = useState(false);

  const taskById = useMemo(() => {
    const map = new Map<string, Task>();
    for (const task of tasks.data ?? []) map.set(task.id, task);
    return map;
  }, [tasks.data]);

  function confirmDelete(tag: Tag) {
    Alert.alert('Delete tag', `Delete "${tag.label}" and its logs?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteTag.mutate(tag.id, { onError: (err) => alertError("Couldn't delete tag", err) }),
      },
    ]);
  }

  async function runWipe() {
    setWiping(true);
    try {
      await wipeTagChip();
      Alert.alert('Chip wiped', 'That tag now reads as blank.');
    } catch (err) {
      alertError("Couldn't wipe chip", err);
    } finally {
      setWiping(false);
    }
  }

  function confirmWipe(tag: Tag) {
    Alert.alert(
      'Wipe chip',
      `Blank the physical chip for "${tag.label}"? You'll need to hold the tag to your phone. The tag stays registered here.`,
      [
        { text: 'Cancel', style: 'cancel' },
        // Alert wants a sync handler; runWipe handles its own errors.
        { text: 'Wipe', style: 'destructive', onPress: () => void runWipe() },
      ],
    );
  }

  function openMenu(tag: Tag) {
    const linked = tag.taskId ? taskById.get(tag.taskId) : null;
    Alert.alert(tag.label, linked ? `Logs "${linked.name}"` : 'No task assigned', [
      { text: linked ? 'Change task' : 'Assign task', onPress: () => setAssigning(tag) },
      ...(tag.taskId
        ? [
            {
              text: 'Unassign task',
              onPress: () =>
                setTagTask.mutate(
                  { tagId: tag.id, taskId: null },
                  { onError: (err) => alertError("Couldn't unassign task", err) },
                ),
            },
          ]
        : []),
      { text: 'Open details', onPress: () => router.push(`/tags/${tag.id}`) },
      { text: 'Wipe chip', style: 'destructive', onPress: () => confirmWipe(tag) },
      { text: 'Delete tag', style: 'destructive', onPress: () => confirmDelete(tag) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  if (tags.isLoading) {
    return (
      <View className="py-10">
        <ActivityIndicator />
      </View>
    );
  }

  const rows = tags.data ?? [];

  return (
    <View className="gap-4">
      {uid ? (
        <View className="gap-1 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <Text className="text-sm text-gray-500 dark:text-gray-400">Scanned tag, not registered</Text>
          <Text className="text-base text-black dark:text-white" numberOfLines={1}>
            {uid}
          </Text>
        </View>
      ) : null}

      <Button
        title={uid ? 'Register This Tag' : 'Register a Tag'}
        onPress={() =>
          router.push(uid ? { pathname: '/tags/register', params: { uid } } : '/tags/register')
        }
      />

      {wiping ? (
        <View className="flex-row items-center justify-center gap-2 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
          <ActivityIndicator />
          <Text className="text-black dark:text-white">Hold the tag to your phone…</Text>
        </View>
      ) : null}

      {rows.length === 0 ? (
        <Text className="py-6 text-center text-gray-500 dark:text-gray-400">
          No tags registered yet. Register one to start scanning.
        </Text>
      ) : (
        <View className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
          {rows.map((tag) => {
            const linked = tag.taskId ? taskById.get(tag.taskId) : null;
            return (
              <Pressable
                key={tag.id}
                onPress={() => openMenu(tag)}
                onLongPress={() => openMenu(tag)}
                className="border-b border-gray-100 px-4 py-3 active:bg-gray-50 dark:border-gray-800 dark:active:bg-gray-900">
                <Text className="text-base text-black dark:text-white" numberOfLines={1}>
                  {tag.label}
                </Text>
                {linked ? (
                  <Text className="mt-0.5 text-sm text-gray-500 dark:text-gray-400" numberOfLines={1}>
                    {linked.name}
                  </Text>
                ) : (
                  <Text className="mt-0.5 text-sm text-gray-400 dark:text-gray-600">No task</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      <Modal
        visible={!!assigning}
        transparent
        animationType="fade"
        onRequestClose={() => setAssigning(null)}>
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View className="mx-6 gap-4 rounded-xl bg-white p-4 dark:bg-gray-900">
            <Text className="text-base font-semibold text-black dark:text-white">
              Task for {assigning?.label}
            </Text>
            <TaskPicker
              tasks={tasks.data ?? []}
              selectedTaskId={assigning?.taskId ?? null}
              onSelect={(taskId) => {
                if (!assigning) return;
                setTagTask.mutate(
                  { tagId: assigning.id, taskId },
                  {
                    onSuccess: () => setAssigning(null),
                    onError: (err) => alertError("Couldn't assign task", err),
                  },
                );
              }}
            />
            <Button title="Close" variant="secondary" onPress={() => setAssigning(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
