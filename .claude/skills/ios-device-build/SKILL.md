---
name: ios-device-build
description: Build, sign, install and launch the nudge app on a physical iPhone. Use when the user wants to test on a real device, test NFC (which cannot work in a simulator or Expo Go), rebuild after adding a native module or config plugin, or when they hit signing, provisioning, or "could not connect to development server" errors.
---

# Building nudge onto a physical iPhone

NFC needs real hardware — there is no software NFC radio in any simulator, and Expo Go can't carry custom native modules. So every NFC change requires this loop.

Each step below encodes a failure we actually hit. Don't shortcut them.

## Preconditions (check before building)

```bash
xcode-select -p          # must be /Applications/Xcode.app/Contents/Developer
xcrun devicectl list devices   # the iPhone must be listed and paired
security find-identity -v -p codesigning
```

- If `xcode-select -p` shows `/Library/Developer/CommandLineTools`, building fails with "Xcode must be fully installed". Fix: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` (needs the user's password — ask them to run it).
- **The iPhone must be unlocked** while building. Otherwise xcodebuild eventually fails with `Jo's iPhone may need to be unlocked to recover from previously reported preparation errors`.
- The iOS platform matching the device's OS version must be installed in Xcode (Settings → Components), or the destination won't resolve. CLI equivalent: `xcodebuild -downloadPlatform iOS` (multi-GB, slow).
- **NFC requires the paid Apple Developer Program.** A free personal team fails at provisioning with "Personal development teams … do not support the NFC Tag Reading capability". `apps/mobile/app.json` pins `ios.appleTeamId`; confirm it matches a team with `isFreeProvisioningTeam = false`:
  `plutil -p ~/Library/Preferences/com.apple.dt.Xcode.plist | grep -A6 IDEProvisioningTeamByIdentifier`

## 1. Regenerate the native project

**Always run this from `apps/mobile`, never the repo root.** Running it at the root generates a stray `ios/` and `app.json` there, named from the root `package.json`, and pollutes the repo.

```bash
cd apps/mobile
npx expo prebuild --platform ios     # add --clean, or rm -rf ios, after native changes
```

Only needed after changing `app.json`, adding/removing a native module, or changing a config plugin. Pure JS/TS changes don't need it — Metro hot-reloads those.

## 2. Build and sign

Do **not** use `npx expo run:ios` for this. It does not pass `-allowProvisioningUpdates`, so signing fails with "No profiles for … were found" even when the team is correct.

```bash
xcodebuild -workspace ios/nudge.xcworkspace -scheme nudge -configuration Debug \
  -destination "id=<DEVICE_UDID>" -allowProvisioningUpdates \
  -derivedDataPath ios/build build
```

Get `<DEVICE_UDID>` from `xcrun devicectl list devices`. Note the identifier column there is a CoreDevice UUID; xcodebuild's `-destination id=` wants the hardware UDID (looks like `00008101-001E59210180001E`). If the UUID is rejected, run `npx expo run:ios --device "<device name>"` once — it prints `Using --device <hardware-udid>` — then use that.

This is slow (minutes) on a clean build. Run it in the background and watch for a terminal state rather than polling:

```bash
xcodebuild … > /tmp/build.log 2>&1 &
until grep -qiE "BUILD SUCCEEDED|BUILD FAILED|error:" /tmp/build.log; do sleep 5; done
```

### Verify the NFC entitlement made it in

```bash
codesign -d --entitlements - --xml ios/build/Build/Products/Debug-iphoneos/nudge.app \
  | plutil -p - | grep -A3 nfc
```

Expect `com.apple.developer.nfc.readersession.formats` = `[NDEF, TAG]`. If it's missing, the build signed with the wrong team.

## 3. Install and launch

```bash
xcrun devicectl device install app --device <COREDEVICE_UUID> \
  ios/build/Build/Products/Debug-iphoneos/nudge.app

xcrun devicectl device process launch --device <COREDEVICE_UUID> com.jovanatesovic.nudge
```

`install`/`launch` take the **CoreDevice UUID** from `devicectl list devices`, not the hardware UDID used by xcodebuild. Two different identifiers for the same phone — easy to mix up.

To see native logs (Core NFC errors, crashes), add `--console`, which attaches stdout and waits:

```bash
xcrun devicectl device process launch --console --device <UUID> com.jovanatesovic.nudge
```

devicectl parses `--terminate-existing` as `-t <seconds>`. If you need to pass arguments to the app itself, separate them with `--`.

## 4. Connect it to Metro

A Debug build resolves its bundle URL via `RCTBundleURLProvider`, which defaults to `localhost:8081` — on the phone that means *the phone itself*, so it can never reach your machine. `expo-dev-client` is what fixes this, and it's already a dependency. If it ever gets removed, the app will launch to "Could not connect to development server".

Start Metro in dev-client mode, then pick the server on the phone's launcher screen:

```bash
npx expo start --dev-client
```

See the `run-local` skill for the API side and LAN checks.

## Known-good values for this repo

- Bundle identifier: `com.jovanatesovic.nudge`
- Apple team: `99F877S57Q` (Individual, paid — NFC-capable)
- Scheme / workspace: `nudge` / `ios/nudge.xcworkspace`
- `ios/` is gitignored — it's generated, never commit or hand-edit it
