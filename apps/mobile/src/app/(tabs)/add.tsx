import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';

export default function AddScreen() {
  const router = useRouter();
  const { uid } = useLocalSearchParams<{ uid?: string }>();


  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-6 p-4">
        <View className="gap-1">
          <Text className="text-3xl font-bold text-black dark:text-white">Add</Text>
          <Text className="text-base text-gray-500 dark:text-gray-400">
            Register a new tag, or manage the ones you have.
          </Text>
        </View>

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
          <Button title="View All Tags" variant="secondary" onPress={() => router.push('/tags')} />
        </View>
      </ScrollView>
    </Screen>
  );
}
