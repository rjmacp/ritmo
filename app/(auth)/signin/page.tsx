import { sendSignInLink } from "./actions";

/** Sign-in page: sends a magic link to the allow-listed email, or confirms one was sent. */
export default async function SignIn({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  return (
    <main className="min-h-dvh flex flex-col justify-center px-6 gap-6">
      <div className="hero p-6 flex flex-col gap-2">
        <span className="text-xs font-bold opacity-85">RITMO</span>
        <span className="num text-3xl">Your running, planned and explained.</span>
      </div>
      {sent ? (
        <p className="card p-4">If that address is registered, a sign-in link is on its way.</p>
      ) : (
        <form className="card p-4 flex flex-col gap-3" action={sendSignInLink}>
          <label className="k" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required className="border border-line rounded-lg px-3 h-11" />
          <button className="h-11 rounded-lg bg-ink text-white font-extrabold">Send sign-in link</button>
        </form>
      )}
    </main>
  );
}
