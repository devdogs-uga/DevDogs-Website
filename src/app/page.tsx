import signIn from "~/server/actions/signIn";
import signOut from "~/server/actions/signOut";
import { getSessionUser } from "~/server/auth";

export default async function HomePage() {
  const session = await getSessionUser();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-6">
      {session ? (
        <form action={signOut} className="contents">
          <p>Hi, {session.user.name}!</p>
          <button type="submit">
            Sign Out
          </button>
        </form>
      ) : (
        
        <form action={signIn} className="contents">
          <button type="submit">
            Sign In
          </button>
        </form>
      )}
    </div>
  );
}
