import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { NewTaskField } from '@/components/new-task-field';
import { Screen } from '@/components/screen';
import { TaskPicker } from '@/components/task-picker';
import { useCreateTag } from '@/hooks/use-tags';
import { useTasks } from '@/hooks/use-tasks';
import { generateTagToken, writeTagToken } from '@/lib/nfc';

export default function RegisterTagScreen() {
  const router = useRouter();
  const tasks = useTasks();
  const createTag = useCreateTag();

  const [label, setLabel] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);

  async function handleSave() {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      Alert.alert('Label required', 'Give this tag a short name.');
      return;
    }

    setWriting(true);
    try {
      const token = generateTagToken();
      await writeTagToken(token);
      const tag = await createTag.mutateAsync({
        uid: token,
        label: trimmedLabel,
        taskId: selectedTaskId,
      });
      router.replace(`/tags/${tag.id}`);
    } catch (err) {
      if (err instanceof Error) Alert.alert("Couldn't save tag", err.message);
    } finally {
      setWriting(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-6 p-4" keyboardShouldPersistTaps="handled">
        <View className="gap-2">
          <Text className="text-base font-semibold text-black dark:text-white">Label</Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Desk"
            placeholderTextColor="#9ca3af"
            className="rounded-xl border border-gray-200 px-4 py-3 text-base text-black dark:border-gray-700 dark:text-white"
          />
        </View>

        <View className="gap-2">
          <Text className="text-base font-semibold text-black dark:text-white">Task</Text>
          <TaskPicker tasks={tasks.data ?? []} selectedTaskId={selectedTaskId} onSelect={setSelectedTaskId} />
          <NewTaskField onCreated={setSelectedTaskId} />
        </View>

        <View className="gap-2">
          <Button
            title={writing ? 'Hold tag to phone…' : 'Write & Save'}
            onPress={handleSave}
            disabled={writing}
          />
          {writing ? (
            <View className="items-center">
              <ActivityIndicator />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
