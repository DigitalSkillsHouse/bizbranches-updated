"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Menu, X, Building2, MapPin, Plus, Globe, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SITE_NAME } from "@/lib/site"

export function Header() {
  const [open, setOpen] = useState(false)
  const closeMenu = () => setOpen(false)

  return (
    <header className="bg-slate-900 border-b border-slate-700/80 sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 max-w-[100vw] overflow-x-hidden">
        <div className="flex items-center justify-between gap-2 h-14 sm:h-16 min-h-[3.5rem]">
          {/* Logo: left on mobile (logo only), center on desktop with text */}
          <Link href="/" className="flex md:flex-1 md:justify-center items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0" onClick={closeMenu} aria-label="Home">
            <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0 group-hover:shadow-xl transition-all duration-300 shadow-lg aspect-square">
              <Image src="/bizbranches.pk.png" alt={SITE_NAME} fill className="object-contain" sizes="56px" priority />
            </div>
            <span className="hidden md:inline text-lg sm:text-xl font-bold text-white group-hover:text-green-400 transition-colors duration-300">BizBranches.Pk</span>
          </Link>

          {/* Mobile Menu Toggle - right side on mobile */}
          <button
            type="button"
            className="md:hidden flex-shrink-0 flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg text-white bg-white/10 border border-white/20 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center flex-1 justify-end gap-2 lg:gap-4">
            <nav className="flex items-center gap-5 lg:gap-8">
              <Link href="/" className="text-white/90 hover:text-white font-medium text-sm transition-colors">
                Home
              </Link>
              <Link href="/category" className="text-white/90 hover:text-white font-medium text-sm transition-colors">
                Categories
              </Link>
            </nav>

            {/* Directories dropdown - country names only */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors py-2 px-2.5 rounded-md hover:bg-white/10" aria-label="Other directories">
                  <Globe className="h-4 w-4" />
                  <span>Directories</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[120px] bg-white py-1 rounded-lg shadow-lg border border-gray-100">
                <DropdownMenuItem asChild>
                  <a href="https://bizbranches.pk" target="_blank" rel="noopener noreferrer" className="cursor-pointer text-sm py-2">
                    Pakistan
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://bizbranches.uk" target="_blank" rel="noopener noreferrer" className="cursor-pointer text-sm py-2">
                    UK
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://bizbranches.us" target="_blank" rel="noopener noreferrer" className="cursor-pointer text-sm py-2">
                    USA
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add Business - primary CTA */}
            <Link
              href="/add"
              onClick={closeMenu}
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label="Add your business free"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Add Business</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation - visible only when open, below md breakpoint */}
        <div
          id="mobile-nav"
          role="navigation"
          aria-label="Mobile menu"
          className={`${open ? "block" : "hidden"} md:hidden pb-4 pt-2 w-full`}
        >
          <nav className="bg-white rounded-xl border border-gray-100 shadow-lg mt-2 p-4 space-y-3 w-full">
            <Link href="/" onClick={closeMenu} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-gray-900">Home</span>
            </Link>
            <Link href="/category" onClick={closeMenu} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <MapPin className="h-4 w-4 text-accent" />
              </div>
              <span className="font-medium text-gray-900">Categories</span>
            </Link>
            <div className="px-3 py-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Directories</span>
              <div className="mt-2 space-y-0.5">
                <a href="https://bizbranches.pk" target="_blank" rel="noopener noreferrer" onClick={closeMenu} className="block p-2.5 rounded-lg hover:bg-gray-50 text-gray-900 text-sm font-medium">Pakistan</a>
                <a href="https://bizbranches.uk" target="_blank" rel="noopener noreferrer" onClick={closeMenu} className="block p-2.5 rounded-lg hover:bg-gray-50 text-gray-900 text-sm font-medium">UK</a>
                <a href="https://bizbranches.us" target="_blank" rel="noopener noreferrer" onClick={closeMenu} className="block p-2.5 rounded-lg hover:bg-gray-50 text-gray-900 text-sm font-medium">USA</a>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <Link href="/add" onClick={closeMenu} className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors">
                <Plus className="h-4 w-4" />
                <span>Add Business</span>
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}