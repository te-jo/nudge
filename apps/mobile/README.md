# nudge mobile

Expo app for nudge — tap an NFC tag, log an event, see history. See the root
[AGENTS.md](../../AGENTS.md) for the full project playbook (stack, layout,
conventions) and the NFC design notes.

## Get started

From the repo root:

```bash
npm install
npm run dev:mobile
```

This starts the Expo dev server. From the output you can open the app in a
development build, the iOS simulator, an Android emulator, or Expo Go
(NFC screens require a development build — see AGENTS.md).

## Other setup steps

- ESLint: `npm run lint -w apps/mobile`
- TypeScript: `npm run typecheck -w apps/mobile`
