import * as Crypto from "expo-crypto";
import NfcManager, { Ndef, NfcTech } from "react-native-nfc-manager";

/**
 * Simulate scans instead of touching the NFC radio, so the flow can be
 * exercised in a simulator, on web, or without a physical tag.
 *
 * The real implementation below is verified working on device — flip this
 * back to `false` before testing anything NFC for real.
 */
export const USE_NFC_STUB = false;

/** Set this to a registered tag's uid to exercise the "known tag" path. */
const STUB_TAG_UID = "stub-tag-uid";

const STUB_DELAY_MS = 1000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  if (USE_NFC_STUB) {
    await wait(STUB_DELAY_MS);
    return STUB_TAG_UID;
  }

  return withNdefSession(async () => {
    const tag = await NfcManager.getTag();
    const record = tag?.ndefMessage?.[0];
    if (!record) return null;
    return Ndef.text.decodePayload(new Uint8Array(record.payload));
  });
}

/** Writes a fresh token onto a tag, overwriting any existing NDEF data. */
export async function writeTagToken(token: string): Promise<void> {
  if (USE_NFC_STUB) {
    await wait(STUB_DELAY_MS);
    return;
  }

  await withNdefSession(async () => {
    const bytes = Ndef.encodeMessage([Ndef.textRecord(token)]);
    await NfcManager.ndefHandler.writeNdefMessage(bytes);
  });
}

/**
 * Blanks a tag's NDEF data by writing a single empty record, so the chip
 * reads back as unregistered and can be handed to a new task.
 */
export async function wipeTagChip(): Promise<void> {
  if (USE_NFC_STUB) {
    await wait(STUB_DELAY_MS);
    return;
  }

  await withNdefSession(async () => {
    const bytes = Ndef.encodeMessage([Ndef.record(Ndef.TNF_EMPTY, "", "", [])]);
    await NfcManager.ndefHandler.writeNdefMessage(bytes);
  });
}

/** A short random id to write onto a newly registered tag. */
export function generateTagToken(): string {
  return Crypto.randomUUID();
}
