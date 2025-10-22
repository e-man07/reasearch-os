/**
 * General Research Workflow
 * Flexible multi-agent workflow for ANY research query
 */

import { createPlannerAgent } from '../agents/planner'
import { createSearchAgent } from '../agents/search'
import { createSynthesisAgent } from '../agents/synthesis'
import { createReportAgent } from '../agents/report'
import { ArxivMCPServer, SemanticScholarMCPServer } from '@research-os/mcp-connectors'

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
    
    // Let the ADK-TS search agent analyze the query
    const searchResponse = await searcher.ask(searchPrompt)
    console.log('✅ Search agent analysis completed')
    console.log('Search agent insights:', searchResponse.substring(0, 200) + '...')
    
    // Now fetch real papers using MCP connectors based on the agent's analysis
    const allPapers: any[] = []
    
    // Fetch from arXiv
    if (sources.includes('arxiv')) {
      try {
        console.log('📚 Fetching papers from arXiv via MCP...')
        const arxiv = new ArxivMCPServer()
        const arxivResults = await arxiv.search({
          query: request.query,
          max_results: Math.floor(maxPapers / sources.length),
          start: 0,
          sort_by: 'relevance',
          sort_order: 'descending',
        })
        console.log(`✅ Found ${arxivResults.length} papers from arXiv`)
        allPapers.push(...arxivResults)
      } catch (error) {
        console.error('❌ arXiv error:', error)
      }
    }
    
    // Fetch from Semantic Scholar
    if (sources.includes('semantic_scholar')) {
      try {
        console.log('📚 Fetching papers from Semantic Scholar via MCP...')
        const semanticScholar = new SemanticScholarMCPServer()
        const ssResults = await semanticScholar.search({
          query: request.query,
          limit: Math.floor(maxPapers / sources.length),
          offset: 0,
          year: yearRange ? `${yearRange.from}-${yearRange.to}` : undefined,
        })
        console.log(`✅ Found ${ssResults.length} papers from Semantic Scholar`)
        allPapers.push(...ssResults)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        if (errorMsg.includes('429') || errorMsg.includes('Rate limit')) {
          console.warn('⚠️  Semantic Scholar rate limit reached - continuing with arXiv papers only')
        } else {
          console.error('❌ Semantic Scholar error:', errorMsg)
        }
      }
    }
    
    console.log(`📊 Total papers fetched from all sources: ${allPapers.length}`)
    
    // Transform papers to consistent format
    papers = allPapers.map((paper) => ({
      id: paper.arxiv_id || paper.id || `paper-${Date.now()}-${Math.random()}`,
      title: paper.title,
      abstract: paper.abstract || '',
      authors: paper.authors || [],
      year: paper.year || new Date().getFullYear(),
      month: paper.month,
      venue: paper.venue,
      pdfUrl: paper.pdf_url,
      htmlUrl: paper.html_url,
      arxivId: paper.arxiv_id,
      doi: paper.doi,
      topics: paper.topics || [],
      keywords: paper.keywords || [],
      categories: paper.categories || [],
      citations: paper.citationCount || 0,
      source: paper.source || 'arxiv',
      url: paper.pdf_url || paper.html_url || '',
    }))
    
    console.log(`📄 Fetched ${papers.length} real papers from MCP connectors`)
    console.log(`🤖 ADK-TS Search Agent provided strategic insights for the search`)
  }
  
  // Step 3: Analysis & Synthesis (if requested)
  if (workflowType === 'analysis' || workflowType === 'synthesis' || workflowType === 'full') {
    console.log('\n🧠 Step 3: Analyzing findings...')
    const { runner: synthesizer } = await createSynthesisAgent()
    agentsUsed.push('Synthesis')
    
    // Prepare paper summaries for synthesis
    const paperSummaries = papers.map((paper, idx) => `
${idx + 1}. "${paper.title}" (${paper.year})
   Authors: ${Array.isArray(paper.authors) ? paper.authors.join(', ') : 'N/A'}
   Abstract: ${paper.abstract.substring(0, 300)}...
   Venue: ${paper.venue || 'N/A'}
`).join('\n')
    
    const synthesisPrompt = `
Analyze the research on: "${request.query}"

${papers.length > 0 ? `Papers analyzed: ${papers.length}\n\n${paperSummaries}` : 'Use your knowledge base'}

Provide:
1. **Key Findings**: Main discoveries and contributions from these papers
2. **Trends**: What's emerging vs declining based on the papers
3. **Methodologies**: Common approaches and techniques used
4. **Gaps**: What's missing or unexplored in this research
5. **Contradictions**: Debates or conflicting results between papers

${options.includeTrends ? 'Focus heavily on recent trends and future directions.' : ''}
${options.includeCode ? 'Highlight papers with open-source implementations.' : ''}

Be specific and cite evidence from the papers above.
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
