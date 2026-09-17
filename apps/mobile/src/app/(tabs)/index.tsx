import type { Tag } from '@nudge/shared-types';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { EventRow } from '@/components/event-row';
import { Screen } from '@/components/screen';
import { useRecentEvents } from '@/hooks/use-events';
import { ApiError, apiFetch } from '@/lib/api';
import { NfcNotSupportedError, readTagToken } from '@/lib/nfc';

export default function HomeScreen() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const recentEvents = useRecentEvents(5);

  async function handleScan() {
    setScanning(true);
    try {
      const token = await readTagToken();
      if (!token) {
        // Blank tag — never registered with nudge.
        router.push('/tags/register');
        return;
      }

      try {
        const tag = await apiFetch<Tag>(`/tags/uid/${encodeURIComponent(token)}`);
        await apiFetch('/events', { method: 'POST', body: JSON.stringify({ tagId: tag.id }) });
        router.push(`/tags/${tag.id}`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          router.push('/tags/register');
          return;
        }
        throw err;
      }
    } catch (err) {
      if (err instanceof NfcNotSupportedError) {
        Alert.alert('NFC not supported', err.message);
      } else if (err instanceof Error) {
        Alert.alert('Scan failed', err.message);
      }
    } finally {
      setScanning(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-6 p-4" keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <Text className="text-3xl font-bold text-black dark:text-white">nudge</Text>
          <Text className="text-base text-gray-500 dark:text-gray-400">Tap a tag to log it.</Text>
        </View>

        <View className="gap-2">
          <Button title={scanning ? 'Scanning…' : 'Scan Tag'} onPress={handleScan} disabled={scanning} />
          {scanning ? (
            <View className="items-center">
              <ActivityIndicator />
            </View>
          ) : null}
        </View>

        <View>
          <Text className="mb-2 text-lg font-semibold text-black dark:text-white">Recent</Text>
          {recentEvents.isLoading ? (
            <ActivityIndicator />
          ) : recentEvents.data && recentEvents.data.length > 0 ? (
            <View className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
              {recentEvents.data.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </View>
          ) : (
            <Text className="text-gray-500 dark:text-gray-400">
              No events yet — tap a tag to get started.
            </Text>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
