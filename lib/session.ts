import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    id: (session.user as any).id as string,
    name: session.user.name as string,
    email: session.user.email as string,
    isAdmin: (session.user as any).isAdmin as boolean,
  };
}
