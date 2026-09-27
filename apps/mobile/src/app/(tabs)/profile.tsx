import { ScrollView, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { API_URL } from '@/lib/api';

export default function ProfileScreen() {
  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-6 p-4">
        <Text className="text-3xl font-bold text-black dark:text-white">Profile</Text>

        <View className="gap-1 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
          <Text className="text-sm text-gray-500 dark:text-gray-400">Connected to</Text>
          <Text className="text-base text-black dark:text-white">{API_URL}</Text>
        </View>

        <Text className="text-gray-500 dark:text-gray-400">
          There are no accounts yet — nudge has no users table and no sign-in, so there&apos;s
          nothing to show here beyond which API this build is talking to.
        </Text>
      </ScrollView>
    </Screen>
  );
}
