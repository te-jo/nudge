import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { useOnCream } from '@/components/window-modal';
import { useCreateTask } from '@/hooks/use-tasks';

export function NewTaskField({ onCreated }: { onCreated: (taskId: string) => void }) {
  const createTask = useCreateTask();
  const onCream = useOnCream();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const task = await createTask.mutateAsync({ name: trimmed });
      onCreated(task.id);
      setName('');
      setAdding(false);
    } catch (err) {
      Alert.alert("Couldn't create task", err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  if (!adding) {
    return (
      <Pressable
        onPress={() => setAdding(true)}
        className={`self-start rounded-full border border-dashed px-3 py-2 active:bg-ink/10 ${
          onCream ? 'border-ink' : 'border-ink dark:border-white'
        }`}>
        <Text className={`font-medium text-ink ${onCream ? '' : 'dark:text-white'}`}>+ New task</Text>
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
        className={`flex-1 rounded-xl border px-4 py-3 text-base text-ink ${
          onCream ? 'border-gray-300 bg-white' : 'border-gray-200 dark:border-gray-700 dark:text-white'
        }`}
      />
      <Button title="Add" variant="secondary" onPress={handleCreate} disabled={createTask.isPending} />
    </View>
  );
}
