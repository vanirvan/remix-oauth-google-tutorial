# remix-auth-oauth2 example repo

Example repo for using [`remix-auth`](https://github.com/sergiodxa/remix-auth) and [`remix-auth-oauth2`](https://github.com/sergiodxa/remix-auth-oauth2) package to do authentication in Remix.js.

# Installation

follow these steps bellow

1. initialize new Remix.js app.

```bash
npx create-remix@latest

// or

pnpm dlx create-remix@latest
```

2. install remix-auth and remix-auth-oauth2 package.

```bash
npm i remix-auth remix-auth-oauth2

// or

pnpm add remix-auth remix-auth-oauth2
```

3. Get your Google Oauth credentials and put it in the `.env` file

4. Run the app

```bash
npm run dev

// or

pnpm run dev
```

# Usage & How it works

Remix Auth needs a session storage object to store the user session. It can be any object that implements the [SessionStorage interface from Remix](https://remix.run/docs/en/main/utils/sessions#createsessionstorage).

This example using the [createCookieSessionStorage](https://remix.run/docs/en/main/utils/sessions#createcookiesessionstorage) function.

```ts
// ./app/lib/services/session.server.ts | can be place anywhere
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
```

In the Remix Auth configuration file, import the `Authenticator` class and your `sessionStorage` object.

```ts
// ./app/lib/services/auth.server.ts
import { Authenticator } from "remix-auth";
import { sessionStorage } from "./session.server";

export const authenticator = new Authenticator(sessionStorage);
```

`authenticator` object can also have a generic type parameter

```ts
// ./app/lib/services/auth.server.ts
// interface or type can be from anywhere, your database model for example
interface User {
  name: string;
  email: string;
  image: string;
}

export const authenticator = new Authenticator<User>(sessionStorage);

// different file somewhere in the project
const authData = authenticator.isAuthenticated(request);
```

> if `authenticator` object has a generic type parameter in it, you'll get type hint when using `authenticator` object,
>
> ```ts
> // session.server.ts
> export const authenticator = new Authenticator<User>(sessionStorage);
>
> // login.tsx | can be anywhere
> import { LoaderFunctionArgs } from "@remix-run/node";
> import { authenticator } from "~/lib/services/auth.server.ts";
>
> export async function loader({ request }: LoaderFunctionArgs) {
>   const authData = authenticator.isAuthenticated(request);
>   //    ^^^^^^^^ authData now has type of User instead of unknown
> }
> ```

Now, add the google strategy from `remix-auth-oauth2` package, you can do it in the same `auth.server.ts` file or do it in separate files. This repo use different files called `strategies.server.ts`

```ts
// ./app/lib/services/auth.server.ts - or - ./app/lib/services/strategies.server.ts
import { OAuth2Strategy } from "remix-auth-oauth2";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE KEY is required");
}

if (!process.env.GOOGLE_CALLBACK_URL) {
  throw new Error("CALLBACK URL is required");
}

export const googleStrategy = new OAuth2Strategy(
  {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    redirectURI: process.env.GOOGLE_CALLBACK_URL,
    scopes: ["openid", "email", "profile"],
  },
  async ({ tokens, profile, context, request }) => {
    const user = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo"
    ).then((response) => response.json());

    return user;
  }
);
```

> Note that if your `authenticator` object in the `auth.server.ts` has generic type parameters, the strategy must return the same type of data.
>
> ```ts
> // ./app/lib/services/auth.server.ts
>
> // ...
> interface User {
>  name: string;
>  email: string;
>  image: string;
> }
>
> export const authenticator = new Authenticator<User>(sessionStorage);
>
> // strategies
> const googleStrategy = new OAuth2Strategy(
>  {...},
>  async({ tokens, profile, context, request }) => {
>    const user = await fetch(
>      "https://www.googleapis.com/oauth2/v3/userinfo"
>    ).then((response) => response.json());
>
>    return {
>      name: user.name,
>      email: user.email,
>      image: user.picture
>    }
>  }
> )
> ```

Now, use the google strategy

```ts
// ./app/lib/services/auth.server.ts
// ...

authenticator.use(googleStrategy, "google");
```

Server side work has done, now let's move on to client side work.

Create a new file under `routes` folder called `login.tsx`

```ts
// ./app/routes/login.tsx
import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/lib/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // if authenticated, redirected to `successRedirect` url.
  return await authenticator.isAuthenticated(request, {
    successRedirect: "/dashboard",
  });
}

export default function LoginPage() {
  return (
    <main className="relative w-full min-h-svh flex flex-col items-center justify-center gap-4">
      <h1 className="font-bold text-2xl">Login Page</h1>
      <span>
        This page is protected, and can only be accessed if users not
        authenticated
      </span>
      <a
        href="/auth/google"
        className="rounded-md bg-neutral-500 hover:bg-neutral-400 px-4 py-2"
      >
        Login with Google
      </a>
    </main>
  );
}
```

In this file, user can signin to google by clicking the "Login with Google" Button, also the `authenticator.isAuthenticated()` inside the loader function makes the page can't be accessed if user is authenticated.

Create a new file under `routes` folder called `auth.google.tsx` and `api.auth.google.callback.tsx`

```ts
// ./app/routes/auth.google.tsx  - and - ./app/routes/api.auth.google.callback.tsx.tsx
import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/lib/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  authenticator.isAuthenticated(request, {
    successRedirect: "/dashboard",
  });

  return authenticator.authenticate("google", request, {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  });
}
```

Here, when user accessing these page, user will be redirected to usual google sign-in page, however if user already authenticated but trying to access these page, they will be redirected to `/dashboard` page, if autenticate process success, they will be redirected to `/dashboard`, meanwhile if autenticate process failed, they will be redirected to `/ login`.

> Why we need to make two file with the same code?
>
> Because the user would login with google by acccessing `/auth/google` page, meanwhile the `/api/auth/google/callback` is for the google redirect url that set in your [Google Console Credentials](https://console.cloud.google.com/apis/credentials).
>
> Or you can just set the google redirect url to `http://localhost:5173/auth/google`, and then you don't need the `api.auth.google.callback.tsx` file.

Now, create a `dashboard.tsx` file

```ts
// ./app/routes/dashboard.tsx
import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/lib/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  return await authenticator.isAuthenticated(request, {
    failureRedirect: "/login",
  });
}

export default function DashboardPage() {
  return (
    <main className="relative w-full min-h-svh flex flex-col gap-4 items-center justify-center">
      <h1 className="font-bold text-2xl">Dashboard Page</h1>
      <span>
        This page is protected, and can only be accessed if users is
        authenticated
      </span>
      <a
        href="/logout"
        className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-400"
      >
        Logout
      </a>
    </main>
  );
}
```

Loader function inside `dashboard.tsx` file will redirecting unathenticated users to `/login`, and also user can logout by clicking the Logout Button that will redirecting them to `/logout`.

Create a `logout.tsx` file

```ts
// ./app/routes/logout.tsx
import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/lib/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  return await authenticator.logout(request, { redirectTo: "/login" });
}
```

Whenever user accessing this page, user will automatically sign out from this app and required to sign in again in `/login` page if they want to access the protected pages, however the same behavior will also occured for unauthenticated users as well.

Thats it, the basic of signin and signout using `remix-auth-oaut2` is completed.

## Using the data returned from the authenticator strategy

You can use the data returned from the authenticator strategy inside the loader function on every page file.

```ts
// auth.server.ts | strategies.server.ts

export const googleOauth2Strategy = new OAuth2Strategy(..., async() => {
  // ...

  // we can use any data returned from this
  return {
    name: 'google name',
    email: 'google@gmail.com',
    image: 'https://googleimage.com/user',
  }
})

// ./app/routes/any.page.tsx
export async function loader({ request }: LoaderFunctionArgs){
  const authData = await authenticator.isAuthenticated(request);

  // if user is authenticated, authData will contain return value, if not, it will be null.
  return { authData };
}

export default function AnyPage(){
  const { authData } = useLoaderData<typeof loader>();

  return (
    <span>My name is: {authData.name}</span>
  )
}
```
