import type { Task } from '@nudge/shared-types';
import { Pressable, Text, View } from 'react-native';

import { useOnCream } from '@/components/window-modal';

/** Task chips: dark gray outline, and filled light gray for the selected one. */
export function TaskPicker({
  tasks,
  selectedTaskId,
  onSelect,
}: {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelect: (taskId: string | null) => void;
}) {
  // Outlined chips show what's behind them: cream in a window, else the screen.
  const onCream = useOnCream();
  const chip = (selected: boolean) =>
    `rounded-full border-2 px-3 py-2 ${
      selected ? 'border-mist bg-mist' : onCream ? 'border-ink' : 'border-ink dark:border-white'
    }`;
  const label = (selected: boolean) =>
    selected ? 'font-semibold text-ink' : onCream ? 'text-ink' : 'text-ink dark:text-white';

  return (
    <View className="flex-row flex-wrap gap-2">
      <Pressable
        onPress={() => onSelect(null)}
        className={chip(selectedTaskId === null)}>
        <Text className={label(selectedTaskId === null)}>
          Unassigned
        </Text>
      </Pressable>
      {tasks.map((task) => (
        <Pressable
          key={task.id}
          onPress={() => onSelect(task.id)}
          className={chip(selectedTaskId === task.id)}>
          <Text className={label(selectedTaskId === task.id)}>
            {task.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
