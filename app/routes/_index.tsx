import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticator } from "~/lib/services/auth.server";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const isAuthenticated = await authenticator.isAuthenticated(request);

  return json({ isAuthenticated });
}

export default function Index() {
  const { isAuthenticated } = useLoaderData<typeof loader>();

  return (
    <main className="relative w-full min-h-svh flex flex-col items-center justify-center">
      <h1 className="font-bold text-2xl">Remix Auth with Google method DEMO</h1>
      {isAuthenticated ? (
        <a
          href="/logout"
          className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-400"
        >
          Logout
        </a>
      ) : (
        <a
          href="/login"
          className="px-4 py-2 rounded-md bg-neutral-500 hover:bg-neutral-400"
        >
          Login
        </a>
      )}
    </main>
  );
}
