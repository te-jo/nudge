import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { SegmentedControl } from '@/components/segmented-control';
import { TasksSection } from '@/components/tasks-section';

const SEGMENTS = ['Tags', 'Tasks'] as const;
type Segment = (typeof SEGMENTS)[number];

export default function AddScreen() {
  const router = useRouter();
  const { uid } = useLocalSearchParams<{ uid?: string }>();

  const [segment, setSegment] = useState<Segment>('Tags');

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-6 p-4" keyboardShouldPersistTaps="handled">
        <Text className="text-3xl font-bold text-black dark:text-white">Add</Text>

        <SegmentedControl segments={SEGMENTS} value={segment} onChange={setSegment} />

        {segment === 'Tags' ? (
          <View className="gap-4">
            {uid ? (
              <View className="gap-1 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <Text className="text-sm text-gray-500 dark:text-gray-400">Scanned tag</Text>
                <Text className="text-base text-black dark:text-white" numberOfLines={1}>
                  {uid}
                </Text>
              </View>
            ) : null}

            <View className="gap-3">
              <Button
                title={uid ? 'Register This Tag' : 'Register a Tag'}
                onPress={() =>
                  router.push(uid ? { pathname: '/tags/register', params: { uid } } : '/tags/register')
                }
              />
              <Button
                title="View All Tags"
                variant="secondary"
                onPress={() => router.push('/tags')}
              />
            </View>
          </View>
        ) : (
          <TasksSection />
        )}
      </ScrollView>
    </Screen>
  );
}
