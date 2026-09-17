import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { queryClient } from '@/lib/query-client';

import '../global.css';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="tags/[id]" options={{ title: 'Tag' }} />
          <Stack.Screen name="tags/register" options={{ title: 'New Tag' }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
