import { createCookieSessionStorage } from "@remix-run/node";

if (!process.env.AUTH_SECRET) {
  throw new Error("SECRET KEY is required");
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session", // name of the session, check the Developer console -> Application -> Cookies
    sameSite: "lax", // this helps with CSRF
    path: "/", // remember to add this so the cookie will work in all routes
    httpOnly: true, // for security reasons, set to true so javascript can't access this in the client
    secrets: [process.env.AUTH_SECRET], // replace this with an actual secret
    secure: process.env.NODE_ENV === "production", // secure in the production, it's fine in development
  },
});

export const { commitSession, destroySession, getSession } = sessionStorage;
