"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Building, Tag, Loader2, ChevronsUpDown } from "lucide-react"
import Link from "next/link"
import { useDebounce } from "@/hooks/use-debounce"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { logger } from "@/lib/logger"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

interface BusinessSuggestion {
  id: string
  name: string
  city: string
  category: string
  logoUrl?: string
  slug?: string
}

interface CategorySuggestion {
  _id: string
  name: string
  slug: string
}

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<{ businesses: BusinessSuggestion[]; categories: CategorySuggestion[] }>({ businesses: [], categories: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 500)
  const searchRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const router = useRouter()

  // Filters
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [cities, setCities] = useState<Array<{ value: string; label: string }>>([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [cityOpen, setCityOpen] = useState(false)
  const [cityQuery, setCityQuery] = useState("")
  const [categoriesList, setCategoriesList] = useState<Array<{ slug: string; name: string }>>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions({ businesses: [], categories: [] })
      setIsOpen(false)
      return
    }

    const fetchSuggestions = async () => {
      setIsLoading(true)
      try {
        // Abort any in-flight request
        if (abortRef.current) {
          abortRef.current.abort()
        }
        const controller = new AbortController()
        abortRef.current = controller

        const params = new URLSearchParams({ q: debouncedQuery })
        if (selectedCity) params.set('city', selectedCity)
        if (selectedCategory) params.set('category', selectedCategory)
        const res = await fetch(`/api/search?${params.toString()}` , { signal: controller.signal })
        const data = await res.json()
        if (data.ok) {
          setSuggestions({ businesses: data.businesses || [], categories: data.categories || [] })
          setIsOpen(true)
        }
      } catch (error) {
        if ((error as any)?.name !== 'AbortError') {
          logger.error("Failed to fetch search suggestions:", error)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [debouncedQuery])

  const handleInputClick = () => {
    if (suggestions.businesses.length > 0 || suggestions.categories.length > 0) {
      setIsOpen(true)
    }
  }

  // Load cities from API with session cache
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setCitiesLoading(true)
        try {
          const raw = sessionStorage.getItem("searchbar:cities")
          if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed?.data)) setCities(parsed.data)
          }
        } catch {}
        const res = await fetch('/api/cities', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        const list: Array<{ id: string; name: string }> = Array.isArray(data?.cities) ? data.cities : []
        if (alive) {
          const mapped = list.map(c => ({ value: c.name.toLowerCase().replace(/\s+/g, '-'), label: c.name }))
          setCities(mapped)
          try { sessionStorage.setItem("searchbar:cities", JSON.stringify({ data: mapped })) } catch {}
        }
      } catch {
        if (alive) setCities([])
      } finally {
        if (alive) setCitiesLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  // Load categories from API
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setCategoriesLoading(true)
        const res = await fetch('/api/categories?limit=200&nocache=1', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        const list: any[] = Array.isArray(data?.categories) ? data.categories : []
        if (alive) setCategoriesList(list.map((c: any) => ({ slug: c.slug, name: c.name || c.slug })))
      } catch {
        if (alive) setCategoriesList([])
      } finally {
        if (alive) setCategoriesLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const performSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    if (selectedCity) params.set("city", selectedCity)
    if (selectedCategory) params.set("category", selectedCategory)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={performSearch} className="relative w-full max-w-2xl" ref={searchRef}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
        <div className="relative md:col-span-1">
          <Input
            type="text"
            placeholder="Search for businesses or categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={handleInputClick}
            onKeyDown={(e) => { if (e.key === 'Enter') performSearch(e as any) }}
            className="pl-10 pr-4 py-2 w-full"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          </div>
        </div>

        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="w-full justify-between">
              <span className="truncate">{selectedCity ? (cities.find(x => x.value === selectedCity)?.label || selectedCity) : (citiesLoading ? "Loading cities..." : "City")}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command shouldFilter={false}>
              <CommandInput placeholder="Search city..." value={cityQuery} onValueChange={setCityQuery} className="h-9" />
              <CommandEmpty>{citiesLoading ? "Loading..." : "No city found."}</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {cities
                    .filter(c => cityQuery.trim() === "" || c.label.toLowerCase().includes(cityQuery.trim().toLowerCase()))
                    .slice(0, 100)
                    .map((c) => (
                      <CommandItem key={c.value} value={c.value} onSelect={(val) => { setSelectedCity(val); setCityOpen(false); setCityQuery("") }}>
                        {c.label}
                      </CommandItem>
                    ))}
                  <CommandItem value="" onSelect={() => { setSelectedCity(""); setCityOpen(false); setCityQuery("") }}>All Cities</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Category"} />
          </SelectTrigger>
          <SelectContent>
            {categoriesList.map((cat) => (
              <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isOpen && (suggestions.businesses.length > 0 || suggestions.categories.length > 0) && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-lg">
          <CardContent className="p-2">
            <ul className="space-y-1">
              {suggestions.categories.length > 0 && (
                <li className="px-2 py-1 text-xs font-semibold text-muted-foreground">CATEGORIES</li>
              )}
              {suggestions.categories.map((category) => (
                <li key={category._id}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{category.name}</span>
                  </Link>
                </li>
              ))}

              {suggestions.businesses.length > 0 && (
                <li className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2">BUSINESSES</li>
              )}
              {suggestions.businesses.map((business) => (
                <li key={business.id}>
                  <Link
                    href={`/${(business as any).slug || business.id}`}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <img 
                      src={business.logoUrl || '/placeholder.svg?height=32&width=32&query=logo'}
                      alt={`${business.name} logo`}
                      className="h-8 w-8 rounded-md object-contain bg-gray-100"
                    />
                    <div>
                      <p className="text-sm font-medium">{business.name}</p>
                      <p className="text-xs text-muted-foreground">{business.city}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <div className="mt-2">
        <Button type="submit" className="w-full md:w-auto">Search</Button>
      </div>
    </form>
  )
}
