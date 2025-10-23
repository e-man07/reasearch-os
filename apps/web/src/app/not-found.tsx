'use client'

import Link from 'next/link'
import { FileQuestion, Home, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'

export default function NotFound() {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as const // easeOut bezier curve
      }
    }
  }

  return (
    <div className="flex items-center justify-center px-4 py-16 min-h-[80vh]">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-muted rounded-full">
                <FileQuestion className="w-10 h-10 text-muted-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">Page not found</CardTitle>
            <CardDescription>
              The page you're looking for doesn't exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-6xl font-bold text-foreground mb-2">404</p>
              <p className="text-sm text-muted-foreground">
                Error code: Not Found
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="flex-1 gap-2"
                variant="default"
              >
                <Link href="/">
                  <Home className="w-4 h-4" />
                  Go Home
                </Link>
              </Button>
              <Button
                asChild
                className="flex-1 gap-2"
                variant="outline"
              >
                <Link href="/search">
                  <Search className="w-4 h-4" />
                  Search Papers
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
