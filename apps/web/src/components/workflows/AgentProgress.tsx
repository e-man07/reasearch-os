'use client'

import { Check, Loader2, Brain, Search, Lightbulb, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AgentStep {
  agent: 'planner' | 'search' | 'synthesis' | 'report'
  status: 'pending' | 'running' | 'completed' | 'error'
  message?: string
  startTime?: number
  endTime?: number
}

interface AgentProgressProps {
  steps: AgentStep[]
}

const agentConfig = {
  planner: {
    icon: Brain,
    name: 'Planner Agent',
    color: 'purple',
    description: 'Creating research strategy',
  },
  search: {
    icon: Search,
    name: 'Search Agent',
    color: 'blue',
    description: 'Finding relevant papers',
  },
  synthesis: {
    icon: Lightbulb,
    name: 'Synthesis Agent',
    color: 'yellow',
    description: 'Analyzing findings',
  },
  report: {
    icon: FileText,
    name: 'Report Agent',
    color: 'green',
    description: 'Generating report',
  },
}

export function AgentProgress({ steps }: AgentProgressProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const config = agentConfig[step.agent]
        const Icon = config.icon
        const isLast = index === steps.length - 1

        const duration = step.startTime && step.endTime
          ? ((step.endTime - step.startTime) / 1000).toFixed(1)
          : null

        return (
          <div key={step.agent} className="relative">
            {/* Connecting Line */}
            {!isLast && (
              <div
                className={cn(
                  'absolute left-6 top-14 w-0.5 h-8',
                  step.status === 'completed' ? 'bg-foreground' : 'bg-border'
                )}
              />
            )}

            {/* Agent Card */}
            <div className={cn(
              'flex items-start gap-4 p-4 rounded-lg border transition-all',
              step.status === 'running' && 'border-foreground bg-accent shadow-sm',
              step.status === 'completed' && 'border-border bg-card',
              step.status === 'error' && 'border-destructive bg-card',
              step.status === 'pending' && 'border-border bg-card opacity-50'
            )}>
              {/* Icon */}
              <div className={cn(
                'flex items-center justify-center w-12 h-12 rounded-full transition-all',
                step.status === 'completed' && 'bg-foreground',
                step.status === 'running' && 'bg-foreground',
                step.status === 'error' && 'bg-destructive',
                step.status === 'pending' && 'bg-muted'
              )}>
                {step.status === 'completed' ? (
                  <Check className="w-6 h-6 text-background" />
                ) : step.status === 'running' ? (
                  <Loader2 className="w-6 h-6 text-background animate-spin" />
                ) : step.status === 'error' ? (
                  <Icon className="w-6 h-6 text-destructive-foreground" />
                ) : (
                  <Icon className="w-6 h-6 text-muted-foreground" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-semibold text-foreground">
                    {config.name}
                  </h3>
                  {duration && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {duration}s
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-2">
                  {step.message || config.description}
                </p>

                {/* Progress Bar for Running */}
                {step.status === 'running' && (
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-foreground animate-pulse" style={{ width: '60%' }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
