import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/lib/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  return await authenticator.logout(request, { redirectTo: "/login" });
}
