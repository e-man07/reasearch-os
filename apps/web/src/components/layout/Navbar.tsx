'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Search, User, LogOut, LayoutDashboard, MessageSquare, Sparkles } from 'lucide-react'

export function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Research<span className="text-blue-600">OS</span>
            </h1>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {status === 'authenticated' ? (
              <>
                <Link
                  href="/search"
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <Search className="w-5 h-5" />
                  <span className="font-medium">Search</span>
                </Link>

                <Link
                  href="/workflows"
                  className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="font-medium">Workflows</span>
                </Link>

                <Link
                  href="/rag"
                  className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium">Q&A</span>
                </Link>

                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="font-medium">Dashboard</span>
                </Link>

                {/* User Menu */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">{session.user?.name}</span>
                  </div>

                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/auth/signin"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
