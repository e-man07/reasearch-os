/**
 * General Research Workflow
 * Flexible multi-agent workflow for ANY research query
 */

import { createPlannerAgent } from '../agents/planner'
import { createSearchAgent } from '../agents/search'
import { createSynthesisAgent } from '../agents/synthesis'
import { createReportAgent } from '../agents/report'

export interface ResearchWorkflowRequest {
  query: string
  workflowType?: 'search' | 'analysis' | 'synthesis' | 'report' | 'full'
  options?: {
    yearRange?: { from: number; to: number }
    maxPapers?: number
    sources?: ('arxiv' | 'semantic_scholar')[]
    outputFormat?: 'summary' | 'detailed' | 'technical' | 'slides'
    includeCode?: boolean
    includeTrends?: boolean
  }
}

export interface ResearchWorkflowResult {
  query: string
  workflowType: string
  plan?: string
  papers?: any[]
  analysis?: string
  report?: string
  metadata: {
    totalPapers: number
    sources: string[]
    dateGenerated: Date
    executionTimeMs: number
    agentsUsed: string[]
  }
}

/**
 * Execute a flexible research workflow based on user query
 */
export async function executeResearchWorkflow(
  request: ResearchWorkflowRequest
): Promise<ResearchWorkflowResult> {
  const startTime = Date.now()
  const agentsUsed: string[] = []
  
  console.log('🚀 Starting research workflow...')
  console.log('📋 Query:', request.query)
  console.log('🔧 Type:', request.workflowType || 'full')
  
  const workflowType = request.workflowType || 'full'
  const options = request.options || {}
  
  let plan: string | undefined
  let papers: any[] = []
  let analysis: string | undefined
  let report: string | undefined
  
  // Step 1: Planning (for complex workflows)
  if (workflowType === 'full' || workflowType === 'analysis' || workflowType === 'report') {
    console.log('\n📝 Step 1: Planning research strategy...')
    const { runner: planner } = await createPlannerAgent()
    agentsUsed.push('Planner')
    
    const planPrompt = `
Analyze this research query and create an execution plan:

Query: "${request.query}"

Workflow Type: ${workflowType}
Options: ${JSON.stringify(options, null, 2)}

Create a strategic plan for:
- What information to search for
- Which sources to prioritize
- What analysis to perform
- What deliverables to produce

Be concise but thorough.
    `
    
    plan = await planner.ask(planPrompt)
    console.log('✅ Plan created')
  }
  
  // Step 2: Search for papers (unless it's analysis-only of existing data)
  if (workflowType !== 'analysis') {
    console.log('\n🔍 Step 2: Searching for papers...')
    const { runner: searcher } = await createSearchAgent()
    agentsUsed.push('Search')
    
    const sources = options.sources || ['arxiv', 'semantic_scholar']
    const maxPapers = options.maxPapers || 20
    const yearRange = options.yearRange || { 
      from: new Date().getFullYear() - 5, 
      to: new Date().getFullYear() 
    }
    
    const searchPrompt = `
Search for research papers related to: "${request.query}"

Requirements:
- Sources: ${sources.join(', ')}
- Year range: ${yearRange.from}-${yearRange.to}
- Maximum papers: ${maxPapers}
- Prioritize: relevance and citations

${options.includeCode ? '- Include papers with code/implementations' : ''}
${options.includeTrends ? '- Focus on recent trends and developments' : ''}

Return a structured list with:
- Paper titles and abstracts
- Authors and year
- Citation counts
- URLs

Deduplicate and rank by relevance.
    `
    
    const searchResponseText = await searcher.ask(searchPrompt)
    console.log('✅ Papers found')
    console.log('Search response:', searchResponseText)
    
    // Parse papers from response (simplified)
    papers = [] // Will be populated from searchResponseText
  }
  
  // Step 3: Analysis & Synthesis (if requested)
  if (workflowType === 'analysis' || workflowType === 'synthesis' || workflowType === 'full') {
    console.log('\n🧠 Step 3: Analyzing findings...')
    const { runner: synthesizer } = await createSynthesisAgent()
    agentsUsed.push('Synthesis')
    
    const synthesisPrompt = `
Analyze the research on: "${request.query}"

${papers.length > 0 ? `Papers found: ${papers.length}` : 'Use your knowledge base'}

Provide:
1. **Key Findings**: Main discoveries and contributions
2. **Trends**: What's emerging vs declining
3. **Methodologies**: Common approaches and techniques
4. **Gaps**: What's missing or unexplored
5. **Contradictions**: Debates or conflicting results

${options.includeTrends ? 'Focus heavily on recent trends and future directions.' : ''}
${options.includeCode ? 'Highlight papers with open-source implementations.' : ''}

Be specific and cite evidence.
    `
    
    analysis = await synthesizer.ask(synthesisPrompt)
    console.log('✅ Analysis complete')
  }
  
  // Step 4: Generate Report (if requested)
  if (workflowType === 'report' || workflowType === 'full') {
    console.log('\n📄 Step 4: Generating report...')
    const { runner: reporter } = await createReportAgent()
    agentsUsed.push('Report')
    
    const outputFormat = options.outputFormat || 'detailed'
    
    const reportPrompt = `
Generate a ${outputFormat} report on: "${request.query}"

${plan ? `Research Plan:\n${plan}\n` : ''}
${papers.length > 0 ? `Papers Analyzed: ${papers.length}\n` : ''}
${analysis ? `Analysis:\n${analysis}\n` : ''}

Report Format: ${outputFormat}
- summary: 1-2 page executive summary
- detailed: 5-10 page comprehensive report
- technical: 10-20 page deep dive with methodology
- slides: 10-15 slide presentation outline

Include:
- Clear structure with headings
- Key findings and insights
- Proper citations
- Actionable recommendations
- Future directions

${options.includeCode ? 'Include section on available implementations and code.' : ''}
${options.includeTrends ? 'Emphasize trends and predictions.' : ''}

Make it professional and well-formatted.
    `
    
    report = await reporter.ask(reportPrompt)
    console.log('✅ Report generated')
  }
  
  const executionTime = Date.now() - startTime
  
  console.log(`\n🎉 Research workflow complete! (${executionTime}ms)`)
  console.log(`📊 Agents used: ${agentsUsed.join(', ')}`)
  
  return {
    query: request.query,
    workflowType,
    plan,
    papers,
    analysis,
    report,
    metadata: {
      totalPapers: papers.length,
      sources: options.sources || ['arxiv', 'semantic_scholar'],
      dateGenerated: new Date(),
      executionTimeMs: executionTime,
      agentsUsed,
    },
  }
}
