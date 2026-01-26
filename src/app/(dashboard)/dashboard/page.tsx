import { currentUser } from '@/utils/currentUser'
import { Database, FileJson, Activity, Settings, Users, Zap, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await currentUser()

  const tools = [
    {
      title: 'SQL Mapper',
      description: 'Parse SQL queries and generate mapping files',
      icon: Database,
      href: '/dashboard/sql-mapper',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'JSON Mapper',
      description: 'Transform and validate JSON data structures',
      icon: FileJson,
      href: '/dashboard/json-mapper',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Sonar Logs',
      description: 'Analyze code quality reports with AI insights',
      icon: Activity,
      href: '/dashboard/sonar-logs',
      gradient: 'from-orange-500 to-red-500',
    },
  ]

  if (user?.role === 'ADMIN') {
    tools.push({
      title: 'Admin Panel',
      description: 'Manage users and system settings',
      icon: Settings,
      href: '/dashboard/admin',
      gradient: 'from-green-500 to-emerald-500',
    })
  }

  const stats = [
    {
      label: 'Active Tools',
      value: tools.length,
      icon: Zap,
    },
    {
      label: 'User Role',
      value: user?.role || 'USER',
      icon: Users,
    },
    {
      label: 'Status',
      value: 'Active',
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bento-card relative overflow-hidden group"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.icon === Zap ? 'from-purple-500/10 to-transparent' : stat.icon === Users ? 'from-blue-500/10 to-transparent' : 'from-green-500/10 to-transparent'} opacity-50 group-hover:opacity-100 transition-opacity`} />
            <div className="relative z-10">
              <stat.icon className="mb-2 h-5 w-5 text-zinc-400 light:text-slate-500" />
              <p className="text-sm text-zinc-400 light:text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-white light:text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white light:text-slate-800 mb-2">Available Tools</h2>
        <p className="text-zinc-400 light:text-slate-500">Select a tool to get started</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="bento-card group"
          >
            <div className={`mb-4 inline-flex rounded-lg bg-gradient-to-br ${tool.gradient} p-3 text-white shadow-lg group-hover:scale-110 transition-transform`}>
              <tool.icon className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white light:text-slate-800">{tool.title}</h3>
            <p className="text-zinc-400 light:text-slate-500">{tool.description}</p>
            <div className="mt-4 flex items-center text-sm text-purple-400 light:text-purple-600 group-hover:translate-x-2 transition-transform">
              Open Tool
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
