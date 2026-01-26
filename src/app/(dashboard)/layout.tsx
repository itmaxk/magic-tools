import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Database, FileJson, Activity, Settings, LogOut } from 'lucide-react'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-purple-950/20 light:bg-gradient-to-br light:from-[#f8fafc] light:via-white light:to-[#faf5ff]">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 light:opacity-10" />
      
      <div className="relative z-10 flex min-h-screen">
        <aside className="glass w-64 border-r border-zinc-800 light:border-zinc-200 p-4">
          <div className="mb-8 px-4">
            <h2 className="text-xl font-bold gradient-text">Magic Tools</h2>
            <p className="text-sm text-zinc-400 light:text-zinc-600">AI-Powered Suite</p>
          </div>
          
          <nav className="space-y-2 px-2">
            <a
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-zinc-300 light:text-zinc-700 transition-all hover:bg-purple-500/10 hover:text-purple-400"
            >
              <Activity className="h-5 w-5" />
              Dashboard
            </a>
            <a
              href="/dashboard/sql-mapper"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-zinc-300 light:text-zinc-700 transition-all hover:bg-purple-500/10 hover:text-purple-400"
            >
              <Database className="h-5 w-5" />
              SQL Mapper
            </a>
            <a
              href="/dashboard/json-mapper"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-zinc-300 light:text-zinc-700 transition-all hover:bg-purple-500/10 hover:text-purple-400"
            >
              <FileJson className="h-5 w-5" />
              JSON Mapper
            </a>
            <a
              href="/dashboard/sonar-logs"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-zinc-300 light:text-zinc-700 transition-all hover:bg-purple-500/10 hover:text-purple-400"
            >
              <Activity className="h-5 w-5" />
              Sonar Logs
            </a>
            {session.user.role === 'ADMIN' && (
              <a
                href="/dashboard/admin"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-zinc-300 light:text-zinc-700 transition-all hover:bg-purple-500/10 hover:text-purple-400"
              >
                <Settings className="h-5 w-5" />
                Admin Panel
              </a>
            )}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <header className="mb-8 flex items-center justify-between glass-card rounded-xl p-4">
            <div>
              <h1 className="text-2xl font-bold text-white light:text-zinc-900">Dashboard</h1>
              <p className="text-zinc-400 light:text-zinc-600">Welcome back, {session.user.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              <a
                href="/settings"
                className="flex items-center gap-2 text-sm text-zinc-400 light:text-zinc-600 hover:text-purple-400 transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </a>
              <form action="/api/auth/signout" method="POST">
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-zinc-400 light:text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </form>
            </div>
          </header>
          
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
