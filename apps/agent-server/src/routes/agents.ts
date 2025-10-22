/**
 * Individual Agent Routes
 */

import { Router } from 'express'
import {
  createPlannerAgent,
  createSearchAgent,
  createSynthesisAgent,
  createReportAgent,
  createQAAgent,
} from '@research-os/agents'

export const agentRouter = Router()

/**
 * POST /api/agents/planner
 * Use the Planner agent
 */
agentRouter.post('/planner', async (req, res, next) => {
  try {
    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    console.log('🧠 Planner agent:', prompt)

    const { runner } = await createPlannerAgent()
    const response = await runner.ask(prompt)

    res.json({
      success: true,
      response,
      agent: 'planner',
    })
  } catch (error) {
    console.error('Planner error:', error)
    return next(error)
  }
})

/**
 * POST /api/agents/search
 * Use the Search agent
 */
agentRouter.post('/search', async (req, res, next) => {
  try {
    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    console.log('🔍 Search agent:', prompt)

    const { runner } = await createSearchAgent()
    const response = await runner.ask(prompt)

    res.json({
      success: true,
      response,
      agent: 'search',
    })
  } catch (error) {
    console.error('Researcher error:', error)
    return next(error)
  }
})

/**
 * POST /api/agents/synthesis
 * Use the Synthesis agent
 */
agentRouter.post('/synthesis', async (req, res, next) => {
  try {
    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    console.log(' Synthesis agent:', prompt)

    const { runner } = await createSynthesisAgent()
    const response = await runner.ask(prompt)

    res.json({
      success: true,
      response,
      agent: 'synthesis',
    })
  } catch (error) {
    console.error('Synthesizer error:', error)
    return next(error)
  }
})

/**
 * POST /api/agents/report
 * Use the Report agent
 */
agentRouter.post('/report', async (req, res, next) => {
  try {
    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    console.log(' Report agent:', prompt)

    const { runner } = await createReportAgent()
    const response = await runner.ask(prompt)

    res.json({
      success: true,
      response,
      agent: 'report',
    })
  } catch (error) {
    console.error('Reviewer error:', error)
    return next(error)
  }
})

/**
 * POST /api/agents/qa
 * Use the Q&A agent
 */
agentRouter.post('/qa', async (req, res, next) => {
  try {
    const { question } = req.body

    if (!question) {
      return res.status(400).json({ error: 'Question is required' })
    }

    console.log('💬 Q&A agent:', question)

    const { runner } = await createQAAgent()
    const response = await runner.ask(question)

    res.json({
      success: true,
      response,
      agent: 'qa',
    })
  } catch (error) {
    console.error('Q&A error:', error)
    return next(error)
  }
})
