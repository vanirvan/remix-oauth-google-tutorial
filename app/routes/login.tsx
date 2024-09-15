import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/lib/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // if authenticated, redirected to `successRedirect` url.
  return await authenticator.isAuthenticated(request, {
    successRedirect: "/",
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
