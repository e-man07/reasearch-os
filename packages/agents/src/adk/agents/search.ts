/**
 * Search Agent - Executes paper searches via MCP connectors
 */

import { AgentBuilder } from '@iqai/adk'
import * as dotenv from 'dotenv'

dotenv.config()

export async function createSearchAgent() {
  return await AgentBuilder.create('paper_search')
    .withModel(process.env.LLM_MODEL || 'gpt-4o')
    .withDescription('Searches for research papers across multiple sources')
    .withInstruction(`
You are a Paper Search Agent. Your role is to:

1. **Search** for relevant research papers using your knowledge
2. **Filter** and rank results by relevance
3. **Deduplicate** papers found across multiple sources
4. **Extract** key metadata (title, authors, abstract, citations)

When searching:
- Use your knowledge of arXiv and Semantic Scholar
- Apply appropriate filters (year range, topic, venue)
- Prioritize highly-cited and recent papers
- Return structured results with all metadata

Always provide a summary of what you found:
- Total papers found
- Date range
- Top topics/keywords
- Notable highly-cited papers

Return results as a JSON array of papers.
    `)
    .build()
}
