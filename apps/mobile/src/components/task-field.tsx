import type { Task } from '@nudge/shared-types';
import { useCallback } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useOnCream } from '@/components/window-modal';
import { useCreateTask, useTasks } from '@/hooks/use-tasks';

const MAX_SUGGESTIONS = 5;

/** The existing task with this name, ignoring case and surrounding spaces. */
export function findTaskByName(tasks: Task[], name: string): Task | undefined {
  const wanted = name.trim().toLowerCase();
  return wanted ? tasks.find((task) => task.name.trim().toLowerCase() === wanted) : undefined;
}

/**
 * Turns what was typed into a TaskField into a task id, creating the task if
 * nothing matches. Call it on save, not while typing, so cancelling never
 * leaves a stray task behind. Empty text means no task (null).
 */
export function useResolveTask() {
  const tasks = useTasks();
  const createTask = useCreateTask();
  const { mutateAsync } = createTask;

  return useCallback(
    async (name: string): Promise<string | null> => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const existing = findTaskByName(tasks.data ?? [], trimmed);
      if (existing) return existing.id;
      const created = await mutateAsync({ name: trimmed });
      return created.id;
    },
    [tasks.data, mutateAsync],
  );
}

/**
 * Free-text task input. Tags usually each get their own task, so typing a
 * name beats scrolling chips; existing tasks still show up as suggestions.
 */
export function TaskField({
  value,
  onChangeText,
  tasks,
}: {
  value: string;
  onChangeText: (text: string) => void;
  tasks: Task[];
}) {
  const onCream = useOnCream();
  const query = value.trim().toLowerCase();
  const exact = findTaskByName(tasks, value);
  const suggestions = query
    ? tasks
        .filter((task) => task !== exact && task.name.toLowerCase().includes(query))
        .slice(0, MAX_SUGGESTIONS)
    : [];

  const hint = !query
    ? 'No task — tapping this tag won’t log anything yet.'
    : exact
      ? 'Uses your existing task.'
      : `Creates a new task “${value.trim()}”.`;

  return (
    <View className="gap-2">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="e.g. Water the plants"
        placeholderTextColor="#9ca3af"
        autoCorrect={false}
        className={`rounded-xl border px-4 py-3 text-[16px] text-ink ${
          onCream ? 'border-gray-300 bg-white' : 'border-gray-200 dark:border-gray-700 dark:text-white'
        }`}
      />
      {suggestions.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {suggestions.map((task) => (
            <Pressable
              key={task.id}
              onPress={() => onChangeText(task.name)}
              className={`rounded-full border-2 px-3 py-1.5 active:bg-ink/10 ${
                onCream ? 'border-ink' : 'border-ink dark:border-white'
              }`}>
              <Text className={onCream ? 'text-ink' : 'text-ink dark:text-white'}>{task.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Text className={`text-sm ${onCream ? 'text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>
        {hint}
      </Text>
    </View>
  );
}
