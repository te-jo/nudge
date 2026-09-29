import Feather from '@expo/vector-icons/Feather';
import type { Folder, Tag, Task } from '@nudge/shared-types';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { TaskFormSheet } from '@/components/task-form-sheet';
import { type TaskStats, useTaskStats } from '@/hooks/use-events';
import { useDeleteFolder, useFolders, useUpdateFolder } from '@/hooks/use-folders';
import { useTags } from '@/hooks/use-tags';
import { useDeleteTask, useTasks } from '@/hooks/use-tasks';
import { relativeTime } from '@/lib/relative-time';

const OTHER = '__other__';

type Group = { id: string; name: string; folder: Folder | null; tasks: Task[] };

function alertError(title: string, err: unknown) {
  Alert.alert(title, err instanceof Error ? err.message : 'Something went wrong.');
}

export function TasksSection() {
  const tasks = useTasks();
  const folders = useFolders();
  const tags = useTags();
  const stats = useTaskStats();
  const deleteTask = useDeleteTask();

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);

  const tagsByTask = useMemo(() => {
    const map = new Map<string, Tag[]>();
    for (const tag of tags.data ?? []) {
      if (!tag.taskId) continue;
      map.set(tag.taskId, [...(map.get(tag.taskId) ?? []), tag]);
    }
    return map;
  }, [tags.data]);

  // Folders in their own order, with uncategorised tasks last under "Other".
  const groups = useMemo<Group[]>(() => {
    const allTasks = tasks.data ?? [];
    const named = (folders.data ?? []).map((folder) => ({
      id: folder.id,
      name: folder.name,
      folder,
      tasks: allTasks.filter((task) => task.folderId === folder.id),
    }));
    const orphans = allTasks.filter((task) => !task.folderId);
    return orphans.length > 0
      ? [...named, { id: OTHER, name: 'Other', folder: null, tasks: orphans }]
      : named;
  }, [tasks.data, folders.data]);

  function confirmDeleteTask(task: Task) {
    // events.task_id is ON DELETE SET NULL, so past logs survive — say so
    // rather than promising a cascade that doesn't happen.
    Alert.alert('Delete task', 'Delete this task? Its past logs stay, but lose the task name.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTask.mutate(task.id, {
            onError: (err) => alertError("Couldn't delete task", err),
          });
        },
      },
    ]);
  }

  function openTaskMenu(task: Task) {
    Alert.alert(task.name, undefined, [
      { text: 'Edit', onPress: () => setEditing(task) },
      { text: 'Delete', style: 'destructive', onPress: () => confirmDeleteTask(task) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  if (tasks.isLoading || folders.isLoading) {
    return (
      <View className="py-10">
        <ActivityIndicator />
      </View>
    );
  }

  const hasTasks = (tasks.data ?? []).length > 0;

  return (
    <View className="gap-4">
      <Button title="Create Task" onPress={() => setCreating(true)} />

      {!hasTasks ? (
        <Text className="py-6 text-center text-gray-500 dark:text-gray-400">
          No tasks yet. Create one to start tracking.
        </Text>
      ) : null}

      {/* Rendered even with no tasks, so empty folders stay manageable. */}
      {groups.map((group) => (
        <FolderGroup
          key={group.id}
          group={group}
          collapsed={!!collapsed[group.id]}
          onToggle={() => setCollapsed((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
          tagsByTask={tagsByTask}
          stats={stats.data}
          onTaskMenu={openTaskMenu}
        />
      ))}

      {creating ? (
        <TaskFormSheet key="create" visible onClose={() => setCreating(false)} />
      ) : null}
      {editing ? (
        <TaskFormSheet key={editing.id} visible task={editing} onClose={() => setEditing(null)} />
      ) : null}
    </View>
  );
}

function FolderGroup({
  group,
  collapsed,
  onToggle,
  tagsByTask,
  stats,
  onTaskMenu,
}: {
  group: Group;
  collapsed: boolean;
  onToggle: () => void;
  tagsByTask: Map<string, Tag[]>;
  stats: Map<string, TaskStats> | undefined;
  onTaskMenu: (task: Task) => void;
}) {
  const updateFolder = useUpdateFolder(group.folder?.id ?? '');
  const deleteFolder = useDeleteFolder(group.folder?.id ?? '');
  const deleteTask = useDeleteTask();

  // Alert.prompt is iOS-only, so renaming gets its own small modal instead.
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');

  function startRename() {
    if (!group.folder) return;
    setDraftName(group.folder.name);
    setRenaming(true);
  }

  function saveRename() {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    updateFolder.mutate(
      { name: trimmed },
      {
        onSuccess: () => setRenaming(false),
        onError: (err) => alertError("Couldn't rename folder", err),
      },
    );
  }

  function removeFolder() {
    if (!group.folder) return;
    Alert.alert(
      `Delete "${group.folder.name}"`,
      group.tasks.length > 0
        ? 'Move tasks to Other or delete them too?'
        : 'Delete this folder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          // The FK is ON DELETE SET NULL, so removing the folder alone already
          // leaves its tasks behind as uncategorised.
          text: group.tasks.length > 0 ? 'Move to Other' : 'Delete',
          onPress: () =>
            deleteFolder.mutate(undefined, {
              onError: (err) => alertError("Couldn't delete folder", err),
            }),
        },
        ...(group.tasks.length > 0
          ? [
              {
                text: 'Delete tasks too',
                style: 'destructive' as const,
                onPress: async () => {
                  try {
                    for (const task of group.tasks) await deleteTask.mutateAsync(task.id);
                    await deleteFolder.mutateAsync();
                  } catch (err) {
                    alertError("Couldn't delete folder", err);
                  }
                },
              },
            ]
          : []),
      ],
    );
  }

  return (
    <View className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
      <Pressable
        onPress={onToggle}
        onLongPress={group.folder ? removeFolder : undefined}
        className="flex-row items-center justify-between bg-gray-50 px-4 py-3 dark:bg-gray-900">
        <View className="flex-row items-center gap-2">
          <Feather name={collapsed ? 'chevron-right' : 'chevron-down'} size={16} color="#6b7280" />
          <Text className="text-base font-semibold text-black dark:text-white">{group.name}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">{group.tasks.length}</Text>
        </View>

        {group.folder ? (
          <Pressable onPress={startRename} onLongPress={removeFolder} hitSlop={8}>
            <Feather name="edit-2" size={16} color="#6b7280" />
          </Pressable>
        ) : null}
      </Pressable>

      <Modal visible={renaming} transparent animationType="fade" onRequestClose={() => setRenaming(false)}>
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View className="mx-6 gap-4 rounded-xl bg-white p-4 dark:bg-gray-900">
            <Text className="text-base font-semibold text-black dark:text-white">Rename folder</Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              autoFocus
              onSubmitEditing={saveRename}
              className="rounded-xl border border-gray-200 px-4 py-3 text-base text-black dark:border-gray-700 dark:text-white"
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button title="Cancel" variant="secondary" onPress={() => setRenaming(false)} />
              </View>
              <View className="flex-1">
                <Button title="Save" onPress={saveRename} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {collapsed ? null : group.tasks.length === 0 ? (
        <Text className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No tasks here.</Text>
      ) : (
        group.tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            tags={tagsByTask.get(task.id) ?? []}
            stats={stats?.get(task.id)}
            onMenu={() => onTaskMenu(task)}
          />
        ))
      )}
    </View>
  );
}

function TaskRow({
  task,
  tags,
  stats,
  onMenu,
}: {
  task: Task;
  tags: Tag[];
  stats: TaskStats | undefined;
  onMenu: () => void;
}) {
  return (
    <Pressable
      onPress={onMenu}
      onLongPress={onMenu}
      className="flex-row items-center justify-between border-t border-gray-100 px-4 py-3 active:bg-gray-50 dark:border-gray-800 dark:active:bg-gray-900">
      <View className="flex-1 pr-3">
        <Text className="text-base text-black dark:text-white" numberOfLines={1}>
          {task.name}
        </Text>
        {tags.length > 0 ? (
          <Text className="mt-0.5 text-sm text-gray-500 dark:text-gray-400" numberOfLines={1}>
            {tags.map((tag) => tag.label).join(', ')}
          </Text>
        ) : (
          <Text className="mt-0.5 text-sm text-gray-400 dark:text-gray-600">No tag</Text>
        )}
      </View>

      <Text className="text-sm text-gray-500 dark:text-gray-400">
        {stats ? `${stats.count} · ${relativeTime(stats.lastAt)}` : 'Never'}
      </Text>
    </Pressable>
  );
}
