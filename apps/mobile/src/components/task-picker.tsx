import type { Task } from '@nudge/shared-types';
import { Pressable, Text, View } from 'react-native';

import { useOnCream } from '@/components/window-modal';

export function TaskPicker({
  tasks,
  selectedTaskId,
  onSelect,
}: {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelect: (taskId: string | null) => void;
}) {
  const onCream = useOnCream();
  const idleBorder = onCream ? 'border-gray-300' : 'border-gray-200 dark:border-gray-700';
  const idleText = onCream ? 'text-black' : 'text-black dark:text-white';

  return (
    <View className="flex-row flex-wrap gap-2">
      <Pressable
        onPress={() => onSelect(null)}
        className={`rounded-full border px-3 py-2 ${
          selectedTaskId === null ? 'border-blue-600 bg-blue-600' : idleBorder
        }`}>
        <Text className={selectedTaskId === null ? 'text-white' : idleText}>
          Unassigned
        </Text>
      </Pressable>
      {tasks.map((task) => (
        <Pressable
          key={task.id}
          onPress={() => onSelect(task.id)}
          className={`rounded-full border px-3 py-2 ${
            selectedTaskId === task.id ? 'border-blue-600 bg-blue-600' : idleBorder
          }`}>
          <Text className={selectedTaskId === task.id ? 'text-white' : idleText}>
            {task.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
