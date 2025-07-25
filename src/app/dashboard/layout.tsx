import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Get session cookie from request (server-side)
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    redirect("/login");
  }
  let user;
  try {
    // Validate and decode JWT
    const payload = jwt.verify(sessionCookie.value, process.env.JWT_SECRET || "your_jwt_secret");
    if (typeof payload === "object" && payload !== null) {
      user = {
        id: (payload as any).id,
        email: (payload as any).email,
        user_metadata: { username: (payload as any).username },
        app_metadata: {},
        aud: "authenticated",
        created_at: "",
      };
    } else {
      redirect("/login");
    }
  } catch (err) {
    redirect("/login");
  }

  // Pass user as prop to children via context
  return (
    <UserContextProvider user={user}>
      {children}
    </UserContextProvider>
  );
}

// Context provider for user
import { UserContextProvider } from "./user-context";
