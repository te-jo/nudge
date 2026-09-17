# nudge

Tap an NFC tag, log an event, see history. The mobile app is a thin client for a small Node/Postgres API.

See [AGENTS.md](./AGENTS.md) for the full project playbook (stack, layout, conventions).

## Layout

```txt
apps/
  api/            Express + Drizzle + Postgres, deployed on Fly.io
  mobile/         Expo app (React Native + react-native-nfc-manager)
packages/
  shared-types/   Tag, Task, Event types shared by api and mobile
```

## Status

Project scaffolding in progress — see AGENTS.md and recent commits for what's live.
