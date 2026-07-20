import Link from "next/link";
import { signup } from "@/app/auth/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8">
        <h1 className="text-2xl font-bold">Create your account</h1>

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
            <label htmlFor="full_name" className="block text-sm font-medium">
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
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
              Password (min 6 characters)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <button
            formAction={signup}
            className="w-full rounded bg-black py-2 text-white hover:bg-gray-800"
          >
            Sign up
          </button>
        </form>

        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
