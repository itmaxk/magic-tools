import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Code2, Database, FileJson, Activity, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-purple-950/20">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      
      <main className="relative z-10 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-2 text-sm text-purple-400 border border-purple-500/20">
              <Zap className="h-4 w-4" />
              <span>AI-Powered Tools</span>
            </div>
            <h1 className="mb-6 text-6xl font-bold gradient-text">
              Magic Tools
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-zinc-400">
              Advanced web tools for modern development teams with AI capabilities
            </p>
          </div>

          <div className="mb-16 grid gap-6 md:grid-cols-3">
            <div className="bento-card group">
              <Database className="mb-4 h-10 w-10 text-purple-400 group-hover:scale-110 transition-transform" />
              <h3 className="mb-2 text-xl font-semibold">SQL Mapper</h3>
              <p className="text-zinc-400">
                Visual SQL query builder with AI-powered optimization suggestions
              </p>
            </div>

            <div className="bento-card group">
              <FileJson className="mb-4 h-10 w-10 text-purple-400 group-hover:scale-110 transition-transform" />
              <h3 className="mb-2 text-xl font-semibold">JSON Mapper</h3>
              <p className="text-zinc-400">
                Transform and validate JSON data with advanced mapping capabilities
              </p>
            </div>

            <div className="bento-card group">
              <Activity className="mb-4 h-10 w-10 text-purple-400 group-hover:scale-110 transition-transform" />
              <h3 className="mb-2 text-xl font-semibold">Sonar Logs</h3>
              <p className="text-zinc-400">
                Analyze and visualize code quality reports with AI insights
              </p>
            </div>
          </div>

          <div className="bento-card mx-auto max-w-md">
            <div className="mb-8 text-center">
              <Code2 className="mx-auto mb-4 h-16 w-16 text-purple-400" />
              <h2 className="mb-2 text-2xl font-bold">Get Started</h2>
              <p className="text-zinc-400">
                Sign in to access all tools and features
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/login" className="flex-1">
                <Button className="w-full glass-button text-white hover:opacity-90 transition-opacity">
                  Login
                </Button>
              </Link>
              <Link href="/register" className="flex-1">
                <Button 
                  variant="outline" 
                  className="w-full border-zinc-700 bg-transparent text-white hover:bg-zinc-800 transition-colors"
                >
                  Register
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
