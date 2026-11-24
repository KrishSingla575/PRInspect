import { AuthOverlay } from 'deepspace'

export default function Login() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <AuthOverlay providers={['github', 'google']} />
    </main>
  )
}
