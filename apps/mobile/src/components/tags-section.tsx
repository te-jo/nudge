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
  const [menuFor, setMenuFor] = useState<Tag | null>(null);
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

  // A custom sheet rather than Alert.alert: Android caps alerts at three
  // buttons and silently drops the rest, which would hide Delete and Cancel.
  function openMenu(tag: Tag) {
    setMenuFor(tag);
  }

  if (tags.isLoading) {
    return (
      <View className="py-10">
        <ActivityIndicator />
      </View>
    );
  }

  const rows = tags.data ?? [];
  // Once the scanned tag has been registered, the uid param is stale — don't
  // keep offering to register it (that would hit the unique constraint).
  const pendingUid = uid && !rows.some((tag) => tag.uid === uid) ? uid : undefined;

  return (
    <View className="gap-4">
      {pendingUid ? (
        <View className="gap-1 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <Text className="text-sm text-gray-500 dark:text-gray-400">Scanned tag, not registered</Text>
          <Text className="text-base text-black dark:text-white" numberOfLines={1}>
            {pendingUid}
          </Text>
        </View>
      ) : null}

      <Button
        title={pendingUid ? 'Register This Tag' : 'Register a Tag'}
        onPress={() =>
          router.push(
            pendingUid
              ? { pathname: '/tags/register', params: { uid: pendingUid } }
              : '/tags/register',
          )
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
        visible={!!menuFor}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuFor(null)}>
        <Pressable
          onPress={() => setMenuFor(null)}
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View className="m-4 overflow-hidden rounded-xl bg-white dark:bg-gray-900">
            {menuFor
              ? (
                  [
                    {
                      label: menuFor.taskId ? 'Change task' : 'Assign task',
                      onPress: () => setAssigning(menuFor),
                    },
                    ...(menuFor.taskId
                      ? [
                          {
                            label: 'Unassign task',
                            onPress: () =>
                              setTagTask.mutate(
                                { tagId: menuFor.id, taskId: null },
                                { onError: (err) => alertError("Couldn't unassign task", err) },
                              ),
                          },
                        ]
                      : []),
                    { label: 'Open details', onPress: () => router.push(`/tags/${menuFor.id}`) },
                    { label: 'Wipe chip', destructive: true, onPress: () => confirmWipe(menuFor) },
                    { label: 'Delete tag', destructive: true, onPress: () => confirmDelete(menuFor) },
                  ] as { label: string; destructive?: boolean; onPress: () => void }[]
                ).map((action) => (
                  <Pressable
                    key={action.label}
                    onPress={() => {
                      setMenuFor(null);
                      action.onPress();
                    }}
                    className="border-b border-gray-100 px-4 py-4 active:bg-gray-50 dark:border-gray-800 dark:active:bg-gray-800">
                    <Text
                      className={
                        action.destructive ? 'text-red-600' : 'text-black dark:text-white'
                      }>
                      {action.label}
                    </Text>
                  </Pressable>
                ))
              : null}
            <Pressable onPress={() => setMenuFor(null)} className="px-4 py-4">
              <Text className="text-gray-500 dark:text-gray-400">Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

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
