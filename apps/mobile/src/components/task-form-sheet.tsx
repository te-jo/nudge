import type { Folder, Tag, Task } from '@nudge/shared-types';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { useCreateFolder, useFolders } from '@/hooks/use-folders';
import { useSetTagTask, useTags } from '@/hooks/use-tags';
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks';

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-2 ${
        selected ? 'border-blue-600 bg-blue-600' : 'border-gray-200 dark:border-gray-700'
      }`}>
      <Text className={selected ? 'text-white' : 'text-black dark:text-white'}>{label}</Text>
    </Pressable>
  );
}

/** Create a task, or edit an existing one when `task` is supplied. */
export function TaskFormSheet({
  visible,
  task,
  onClose,
}: {
  visible: boolean;
  task?: Task | null;
  onClose: () => void;
}) {
  const folders = useFolders();
  const tags = useTags();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const createFolder = useCreateFolder();
  const setTagTask = useSetTagTask();

  const editing = !!task;
  const linkedTag = tags.data?.find((tag) => tag.taskId === task?.id) ?? null;

  const [name, setName] = useState(task?.name ?? '');
  const [folderId, setFolderId] = useState<string | null>(task?.folderId ?? null);
  const [newFolderName, setNewFolderName] = useState('');
  const [tagId, setTagId] = useState<string | null>(linkedTag?.id ?? null);
  const [saving, setSaving] = useState(false);

  // Remount via `key` on the caller resets these, so no effect syncing needed.

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Give this task a name.');
      return;
    }

    setSaving(true);
    try {
      let resolvedFolderId = folderId;
      const newFolder = newFolderName.trim();
      if (newFolder) {
        const folder = await createFolder.mutateAsync({ name: newFolder });
        resolvedFolderId = folder.id;
      }

      const saved = editing
        ? await updateTask.mutateAsync({
            id: task.id,
            input: { name: trimmed, folderId: resolvedFolderId },
          })
        : await createTask.mutateAsync({ name: trimmed, folderId: resolvedFolderId });

      // The FK lives on the tag, so linking means patching the tag.
      if (tagId !== (linkedTag?.id ?? null)) {
        if (linkedTag) await setTagTask.mutateAsync({ tagId: linkedTag.id, taskId: null });
        if (tagId) await setTagTask.mutateAsync({ tagId, taskId: saved.id });
      }

      onClose();
    } catch (err) {
      Alert.alert(
        editing ? "Couldn't save task" : "Couldn't create task",
        err instanceof Error ? err.message : 'Something went wrong.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1 }} className="bg-white dark:bg-black">
        <View className="flex-row items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
          <Pressable onPress={onClose}>
            <Text className="text-blue-600">Cancel</Text>
          </Pressable>
          <Text className="text-base font-semibold text-black dark:text-white">
            {editing ? 'Edit Task' : 'New Task'}
          </Text>
          <View style={{ width: 52 }} />
        </View>

        <ScrollView contentContainerClassName="gap-6 p-4" keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            <Text className="text-base font-semibold text-black dark:text-white">Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Take vitamins"
              placeholderTextColor="#9ca3af"
              autoFocus={!editing}
              className="rounded-xl border border-gray-200 px-4 py-3 text-base text-black dark:border-gray-700 dark:text-white"
            />
          </View>

          <View className="gap-2">
            <Text className="text-base font-semibold text-black dark:text-white">Folder</Text>
            <View className="flex-row flex-wrap gap-2">
              <Chip
                label="Other"
                selected={folderId === null && !newFolderName.trim()}
                onPress={() => {
                  setFolderId(null);
                  setNewFolderName('');
                }}
              />
              {(folders.data ?? []).map((folder: Folder) => (
                <Chip
                  key={folder.id}
                  label={folder.name}
                  selected={folderId === folder.id && !newFolderName.trim()}
                  onPress={() => {
                    setFolderId(folder.id);
                    setNewFolderName('');
                  }}
                />
              ))}
            </View>
            <TextInput
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="…or type a new folder name"
              placeholderTextColor="#9ca3af"
              className="rounded-xl border border-gray-200 px-4 py-3 text-base text-black dark:border-gray-700 dark:text-white"
            />
          </View>

          <View className="gap-2">
            <Text className="text-base font-semibold text-black dark:text-white">Tag</Text>
            <View className="flex-row flex-wrap gap-2">
              <Chip label="No tag" selected={tagId === null} onPress={() => setTagId(null)} />
              {(tags.data ?? [])
                .filter((tag: Tag) => !tag.taskId || tag.taskId === task?.id)
                .map((tag: Tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.label}
                    selected={tagId === tag.id}
                    onPress={() => setTagId(tag.id)}
                  />
                ))}
            </View>
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              Only unassigned tags are listed — a tag points at one task at a time.
            </Text>
          </View>

          <Button title={saving ? 'Saving…' : 'Save'} onPress={handleSave} disabled={saving} />
        </ScrollView>
      </View>
    </Modal>
  );
}
