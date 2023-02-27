import { createCookieSessionStorage, redirect } from "@remix-run/node";
import invariant from "tiny-invariant";

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

const NOSTR_PUBLIC_KEY = "nostrPublicKey";

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getNostrPublicKey(
  request: Request
): Promise<string | undefined> {
  const session = await getSession(request);
  return session.get(NOSTR_PUBLIC_KEY);
}

export async function requirePublicKey(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const publicKey = await getNostrPublicKey(request);
  if (!publicKey) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/?${searchParams}`);
  }
  return publicKey;
}

export async function createUserSession({
  request,
  nostrPublicKey,
  remember,
}: {
  request: Request;
  nostrPublicKey: string;
  remember: boolean;
}) {
  const session = await getSession(request);
  session.set(NOSTR_PUBLIC_KEY, nostrPublicKey);
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session, {
        maxAge: remember
          ? 60 * 60 * 24 * 7 // 7 days
          : undefined,
      }),
    },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}