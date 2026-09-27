import Feather from '@expo/vector-icons/Feather';
import type { Tag } from '@nudge/shared-types';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { EventRow } from '@/components/event-row';
import { Screen } from '@/components/screen';
import { useRecentEvents } from '@/hooks/use-events';
import { useTasks } from '@/hooks/use-tasks';
import { ApiError, apiFetch } from '@/lib/api';
import { NfcNotSupportedError, readTagToken } from '@/lib/nfc';

type ScanState =
  | { status: 'idle' }
  | { status: 'scanning' }
  | { status: 'logged'; taskName: string }
  | { status: 'unregistered'; uid: string | null };

const SUCCESS_VISIBLE_MS = 2000;

export default function HomeScreen() {
  const router = useRouter();
  const recentEvents = useRecentEvents(5);
  const tasks = useTasks();
  const [scan, setScan] = useState<ScanState>({ status: 'idle' });

  // Success confirmation clears itself; anything else waits for the user.
  useEffect(() => {
    if (scan.status !== 'logged') return;
    const timer = setTimeout(() => setScan({ status: 'idle' }), SUCCESS_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [scan]);

  async function handleScan() {
    setScan({ status: 'scanning' });
    try {
      const uid = await readTagToken();
      if (!uid) {
        // Blank tag — nothing written to it yet, so there's no uid to carry over.
        setScan({ status: 'unregistered', uid: null });
        return;
      }

      let tag: Tag;
      try {
        tag = await apiFetch<Tag>(`/tags/uid/${encodeURIComponent(uid)}`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setScan({ status: 'unregistered', uid });
          return;
        }
        throw err;
      }

      await apiFetch('/events', { method: 'POST', body: JSON.stringify({ tagId: tag.id }) });
      void recentEvents.refetch();

      const taskName = tasks.data?.find((task) => task.id === tag.taskId)?.name;
      setScan({ status: 'logged', taskName: taskName ?? tag.label });
    } catch (err) {
      setScan({ status: 'idle' });
      if (err instanceof NfcNotSupportedError) {
        Alert.alert('NFC not supported', err.message);
      } else if (err instanceof Error) {
        Alert.alert('Scan failed', err.message);
      }
    }
  }

  const events = recentEvents.data ?? [];

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-8 p-4">
        <View className="items-center gap-5 pt-10">
          <Pressable
            onPress={handleScan}
            disabled={scan.status === 'scanning'}
            className="h-44 w-44 items-center justify-center rounded-full bg-blue-600 active:bg-blue-700 disabled:opacity-60">
            {scan.status === 'scanning' ? (
              <ActivityIndicator color="white" size="large" />
            ) : (
              <Text className="text-2xl font-semibold text-white">Scan</Text>
            )}
          </Pressable>

          {scan.status === 'logged' ? (
            <View className="w-full flex-row items-center justify-center gap-2 rounded-xl bg-green-50 p-4 dark:bg-green-950">
              <Feather name="check-circle" size={20} color="#16a34a" />
              <Text className="text-base font-medium text-green-700 dark:text-green-400">
                Logged {scan.taskName}
              </Text>
            </View>
          ) : null}

          {scan.status === 'unregistered' ? (
            <View className="w-full gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <Text className="text-center text-base text-black dark:text-white">
                This tag isn&apos;t registered yet
              </Text>
              <Button
                title="Register it"
                onPress={() =>
                  router.push({
                    pathname: '/library',
                    params: scan.uid ? { view: 'Tags', uid: scan.uid } : { view: 'Tags' },
                  })
                }
              />
            </View>
          ) : null}
        </View>

        <View>
          <Text className="mb-2 px-4 text-lg font-semibold text-black dark:text-white">Recent</Text>

          {recentEvents.isLoading ? (
            <ActivityIndicator />
          ) : events.length > 0 ? (
            <>
              <View className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
                {events.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </View>
              <Pressable
                onPress={() => router.push({ pathname: '/library', params: { view: 'Logs' } })}
                className="mt-3 items-center">
                <Text className="font-medium text-blue-600">See all</Text>
              </Pressable>
            </>
          ) : (
            <Text className="px-4 text-gray-500 dark:text-gray-400">
              No scans yet. Tap the button to scan your first tag.
            </Text>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
