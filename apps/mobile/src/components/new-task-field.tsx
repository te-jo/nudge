import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { useCreateTask } from '@/hooks/use-tasks';

export function NewTaskField({ onCreated }: { onCreated: (taskId: string) => void }) {
  const createTask = useCreateTask();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const task = await createTask.mutateAsync({ name: trimmed });
    onCreated(task.id);
    setName('');
    setAdding(false);
  }

  if (!adding) {
    return (
      <Pressable onPress={() => setAdding(true)}>
        <Text className="font-medium text-blue-600">+ New task</Text>
      </Pressable>
    );
  }

  return (
    <View className="flex-row items-center gap-2">
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="New task name"
        placeholderTextColor="#9ca3af"
        autoFocus
        onSubmitEditing={handleCreate}
        className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-base text-black dark:border-gray-700 dark:text-white"
      />
      <Button title="Add" variant="secondary" onPress={handleCreate} disabled={createTask.isPending} />
    </View>
  );
}
