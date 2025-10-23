'use client'

import { useState } from 'react'
import { Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

export interface SearchFormData {
  query: string
  sources: string[]
  yearFrom?: number
  yearTo?: number
  maxResults: number
}

interface SearchFormProps {
  onSearch: (data: SearchFormData) => void
  isLoading?: boolean
}

export function SearchForm({ onSearch, isLoading = false }: SearchFormProps) {
  const [query, setQuery] = useState('')
  const [sources, setSources] = useState<string[]>(['arxiv', 'semantic_scholar'])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [yearFrom, setYearFrom] = useState<number>()
  const [yearTo, setYearTo] = useState<number>()
  const [maxResults, setMaxResults] = useState(20)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    onSearch({
      query: query.trim(),
      sources,
      yearFrom,
      yearTo,
      maxResults,
    })
  }

  const toggleSource = (source: string) => {
    setSources((prev) =>
      prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {/* Main Search Input */}
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search research papers... (e.g., 'attention mechanisms in transformers')"
          className="pr-10 h-12 text-base"
          disabled={isLoading}
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
      </div>

      {/* Source Selection */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="arxiv"
            checked={sources.includes('arxiv')}
            onCheckedChange={() => toggleSource('arxiv')}
            disabled={isLoading}
          />
          <Label
            htmlFor="arxiv"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            arXiv
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="semantic_scholar"
            checked={sources.includes('semantic_scholar')}
            onCheckedChange={() => toggleSource('semantic_scholar')}
            disabled={isLoading}
          />
          <Label
            htmlFor="semantic_scholar"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Semantic Scholar
          </Label>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          disabled={isLoading}
          className="gap-1"
        >
          {showAdvanced ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide Advanced
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show Advanced
            </>
          )}
        </Button>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yearFrom">Year From</Label>
                <Input
                  id="yearFrom"
                  type="number"
                  value={yearFrom || ''}
                  onChange={(e) => setYearFrom(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear()}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearTo">Year To</Label>
                <Input
                  id="yearTo"
                  type="number"
                  value={yearTo || ''}
                  onChange={(e) => setYearTo(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder={new Date().getFullYear().toString()}
                  min="1900"
                  max={new Date().getFullYear()}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxResults">Max Results</Label>
                <Select
                  value={maxResults.toString()}
                  onValueChange={(value) => setMaxResults(parseInt(value))}
                  disabled={isLoading}
                >
                  <SelectTrigger id="maxResults">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || !query.trim() || sources.length === 0}
        className="w-full h-12 gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Search Papers
          </>
        )}
      </Button>
    </form>
  )
}
