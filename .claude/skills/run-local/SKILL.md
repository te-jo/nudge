---
name: run-local
description: Start the nudge API and Metro bundler for local development, including the LAN setup a physical iPhone needs, and find the logs. Use when the user wants to run the app, test against a device, or is debugging "network request failed", an app that won't load, or wants to see request/JS/native logs.
---

# Running nudge locally

Two servers. The mobile app talks to the API over HTTP — never to Postgres directly.

```bash
npm run dev:api      # Express on :3000, reads apps/api/.env for DATABASE_URL
npm run dev:mobile   # Metro on :8081  (add -- --dev-client for a device build)
```

Run each in its own terminal so you can read their logs.

## How the app finds the API

`apps/mobile/src/lib/api.ts` derives the API host from Expo's own packager host:

```
Constants.expoConfig.hostUri  →  "192.168.1.116:8081"
API_URL                       →  "http://192.168.1.116:3000"
```

That's why a physical device works without hardcoding anything — but it also means **the phone and the laptop must be on the same network**, and Metro must be serving on the LAN IP rather than localhost. `EXPO_PUBLIC_API_URL` overrides the whole thing if you need to point somewhere else.

Verify both are reachable on the LAN (not just loopback) before blaming the app:

```bash
ipconfig getifaddr en0                         # your LAN IP
curl -m 5 http://<LAN_IP>:3000/health          # expect {"ok":true}
curl -m 5 -o /dev/null -w "%{http_code}\n" http://<LAN_IP>:8081/status
```

If `/health` works on `localhost` but not on the LAN IP, that's a firewall or network-isolation problem (guest Wi-Fi often blocks client-to-client traffic), not an app bug.

## Logs

**API requests** — every request logs method, path, status and duration, from middleware in `apps/api/src/index.ts`:
```
POST /events 201 654ms
```
This is the fastest way to tell where a flow breaks. For an NFC scan you should see `GET /tags/uid/<token>` and then `POST /events`. If the lookup never appears, the failure was on the phone (NFC read) and never reached the network.

**App / JS logs** (`console.log`, JS errors) — appear in the Metro terminal.

**Native device logs** (Core NFC errors, crashes):
```bash
xcrun devicectl device process launch --console \
  --device <COREDEVICE_UUID> com.jovanatesovic.nudge
```
Or Console.app with the iPhone picked in the sidebar. Note `log stream --device-name` is not supported on this machine's macOS, and zsh's built-in `log` shadows `/usr/bin/log`.

## Gotchas

- **Orphaned dev servers.** `npm run dev` spawns a child; killing the npm wrapper PID leaves `tsx`/Metro holding the port, and then a stale server answers your requests while your new code appears to do nothing. Kill by port instead:
  ```bash
  lsof -ti:3000,8081 | xargs -r kill -9
  ```
- **nvm in non-interactive shells.** Scripted/hook contexts often lack node on PATH. Source it first:
  ```bash
  export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
  ```
- **Expo-generated types.** If typecheck complains about routes or `@/global.css` that plainly exist, `expo-env.d.ts` / `.expo/types/router.d.ts` are stale — start Metro once, let it bundle, stop it.
- The dev database is a real Neon instance shared with whatever else you're doing. Delete test rows when you're finished.
