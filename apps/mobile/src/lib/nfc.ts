import * as Crypto from "expo-crypto";
import NfcManager, { Ndef, NfcTech } from "react-native-nfc-manager";

let started = false;

async function ensureStarted() {
  if (started) return;
  await NfcManager.start();
  started = true;
}

export class NfcNotSupportedError extends Error {
  constructor() {
    super("This device doesn't support NFC.");
  }
}

async function withNdefSession<T>(run: () => Promise<T>): Promise<T> {
  await ensureStarted();
  if (!(await NfcManager.isSupported())) throw new NfcNotSupportedError();

  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    return await run();
  } finally {
    await NfcManager.cancelTechnologyRequest().catch(() => {});
  }
}

/**
 * Reads the token nudge previously wrote to a tag. Returns null if the tag
 * has no NDEF data yet — i.e. it's never been registered with nudge.
 */
export async function readTagToken(): Promise<string | null> {
  return withNdefSession(async () => {
    const tag = await NfcManager.getTag();
    const record = tag?.ndefMessage?.[0];
    if (!record) return null;
    return Ndef.text.decodePayload(new Uint8Array(record.payload));
  });
}

/** Writes a fresh token onto a tag, overwriting any existing NDEF data. */
export async function writeTagToken(token: string): Promise<void> {
  await withNdefSession(async () => {
    const bytes = Ndef.encodeMessage([Ndef.textRecord(token)]);
    await NfcManager.ndefHandler.writeNdefMessage(bytes);
  });
}

/** A short random id to write onto a newly registered tag. */
export function generateTagToken(): string {
  return Crypto.randomUUID();
}
