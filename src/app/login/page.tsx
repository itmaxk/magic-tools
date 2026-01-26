import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-950 to-purple-950/20 light:bg-gradient-to-br light:from-[#f8fafc] light:via-white light:to-[#faf5ff] p-4">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 light:opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent light:from-[#faf5ff] light:via-transparent light:to-transparent" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold gradient-text">Welcome Back</h1>
          <p className="text-zinc-400 light:text-zinc-600">Sign in to your Magic Tools account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
