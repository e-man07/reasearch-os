'use client'

import Link from 'next/link'
import { Search, Sparkles, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'

export default function Home() {
  const features = [
    {
      icon: Search,
      title: 'Smart Search',
      description: 'Search across arXiv and Semantic Scholar with advanced filtering capabilities',
    },
    {
      icon: Sparkles,
      title: 'AI Synthesis',
      description: 'Multi-agent workflows analyze papers and generate comprehensive insights',
    },
    {
      icon: FileText,
      title: 'Auto Reports',
      description: 'Generate research reports automatically with proper citations and analysis',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
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

  const featureVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: 0.6 + i * 0.1,
        ease: [0.4, 0, 0.2, 1] as const // easeOut bezier curve
      }
    })
  }

  return (
    <main>
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-6 py-16">
        <motion.div
          className="max-w-4xl text-center space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Title */}
          <motion.div className="space-y-4" variants={itemVariants}>
            <h1 className="text-5xl font-bold text-foreground">
              ResearchOS
            </h1>
            <p className="text-xl text-muted-foreground">
              Autonomous Research Copilot
            </p>
          </motion.div>

          {/* Description */}
          <motion.p
            className="text-base text-muted-foreground max-w-2xl mx-auto"
            variants={itemVariants}
          >
            Discover, analyze, and synthesize research papers using advanced AI agents.
            Search across multiple sources, generate insights with RAG, and create
            comprehensive research reports automatically.
          </motion.p>

          {/* CTA Button */}
          <motion.div className="pt-4" variants={itemVariants}>
            <Link href="/search">
              <Button size="lg" className="gap-2">
                <Search className="w-5 h-5" />
                Start Searching
              </Button>
            </Link>
          </motion.div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  custom={i}
                  variants={featureVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Card className="border-border h-full">
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        <Icon className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-center">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </main>
  )
}
