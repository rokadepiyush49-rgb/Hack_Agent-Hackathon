import Link from "next/link";
import { login } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8">
        <h1 className="text-2xl font-bold">Log in to BoardroomAI</h1>

        {error && (
          <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>
        )}
        {message && (
          <p className="rounded bg-green-50 p-3 text-sm text-green-700">
            {message}
          </p>
        )}

        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <button
            formAction={login}
            className="w-full rounded bg-black py-2 text-white hover:bg-gray-800"
          >
            Log in
          </button>
        </form>

        <p className="text-sm text-gray-500">
          No account?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
