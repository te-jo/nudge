import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { TaskField, useResolveTask } from '@/components/task-field';
import { WindowCard } from '@/components/window-modal';
import { useCreateTag } from '@/hooks/use-tags';
import { useTasks } from '@/hooks/use-tasks';
import { generateTagToken, writeTagToken } from '@/lib/nfc';

/** Presented as a transparent modal (see app/_layout.tsx), so it's just the window card. */
export default function RegisterTagScreen() {
  const router = useRouter();
  const tasks = useTasks();
  const createTag = useCreateTag();
  const resolveTask = useResolveTask();

  // A uid arrives when the user scanned a tag that already carries a token but
  // isn't registered. Reuse it rather than overwriting the chip.
  // A spot arrives when registering from an empty spot in a room.
  const { uid: scannedUid, spot } = useLocalSearchParams<{ uid?: string; spot?: string }>();

  const [label, setLabel] = useState('');
  const [taskName, setTaskName] = useState('');
  const [writing, setWriting] = useState(false);

  async function handleSave() {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      Alert.alert('Label required', 'Give this tag a short name.');
      return;
    }

    setWriting(true);
    try {
      let token = scannedUid;
      if (!token) {
        token = generateTagToken();
        await writeTagToken(token);
      }

      // After the chip write, so a failed write doesn't leave a new task behind.
      const taskId = await resolveTask(taskName);
      const tag = await createTag.mutateAsync({
        uid: token,
        label: trimmedLabel,
        taskId,
        spot: spot ?? null,
      });
      router.replace(`/tags/${tag.id}`);
    } catch (err) {
      if (err instanceof Error) Alert.alert("Couldn't save tag", err.message);
    } finally {
      setWriting(false);
    }
  }

  return (
    <WindowCard onClose={() => router.back()} scroll>
      <Text className="text-xl font-bold text-ink">New Tag</Text>

      <View className="gap-2">
        <Text className="text-base font-semibold text-ink">Label</Text>
        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder="e.g. Desk"
          placeholderTextColor="#9ca3af"
          className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-[16px] text-ink"
        />
      </View>

      <View className="gap-2">
        <Text className="text-base font-semibold text-ink">Task</Text>
        <TaskField value={taskName} onChangeText={setTaskName} tasks={tasks.data ?? []} />
      </View>

      <View className="gap-2">
        <Button
          title={
            writing && !scannedUid ? 'Hold tag to phone…' : scannedUid ? 'Save Tag' : 'Write & Save'
          }
          onPress={handleSave}
          disabled={writing}
        />
        {writing ? (
          <View className="items-center">
            <ActivityIndicator />
          </View>
        ) : null}
      </View>
    </WindowCard>
  );
}
