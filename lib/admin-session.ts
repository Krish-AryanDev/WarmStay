import "server-only";
import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "admin_session";

function getPasscode(): string {
  const pass = process.env.ADMIN_PASSCODE;
  // if (!pass || pass.length < 8) {
  //   throw new Error("ADMIN_PASSCODE is not set or is too short (min 8 chars).");
  // }

  if (!pass){
    throw new Error("ADMIN_PASSCODE is not set.");
  }
  else if (pass.length < 8) {
    throw new Error("ADMIN_PASSCODE is too short (min 8 chars).");
  }
  return pass;
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function isAdminAuthed(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return safeEqual(token, getPasscode());
}

export function checkPasscode(input: string): boolean {
  return safeEqual(input, getPasscode());
}
