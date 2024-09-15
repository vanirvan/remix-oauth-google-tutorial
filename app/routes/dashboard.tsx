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
