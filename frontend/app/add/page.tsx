"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ChevronsUpDown, MapPin, Building, User, Phone, Mail, MessageSquare, Globe, Camera, CheckCircle, Upload, Star, Shield, Zap } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cities } from "@/lib/mock-data"
import { slugify } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AdSenseSlot } from "@/components/adsense-slot"
import { LocationMapConfirm } from "@/components/location-map-confirm"

interface FormState {
  businessName: string
  contactPersonName?: string
  category: string
  subCategory?: string
  country: string
  city: string
  postalCode?: string
  address: string
  phone: string
  whatsapp?: string
  email?: string
  description: string
  logoFile?: File | null
  websiteUrl?: string
  facebookUrl?: string
  gmbUrl?: string
  youtubeUrl?: string
  profileUsername?: string
}

export function AddBusinessForm({
  title = "Add Your Business Free",
  description = "Pakistan's free business listing directory. Get visibility in minutes.",
  categories = [],
  onSubmitted,
}: {
  title?: string
  description?: string
  categories?: string[]
  onSubmitted?: () => void
}) {
  const { toast } = useToast()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})
  const [fieldErrorMessages, setFieldErrorMessages] = useState<Record<string, string>>({})
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<boolean>(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState(0)
  const [locationLat, setLocationLat] = useState<number | null>(null)
  const [locationLng, setLocationLng] = useState<number | null>(null)
  const [showLocationMap, setShowLocationMap] = useState(false)
  const [geocodeLoading, setGeocodeLoading] = useState(false)
  const [geocodeFailed, setGeocodeFailed] = useState(false)
  const DESCRIPTION_MAX = 1000
  const DESCRIPTION_MIN = 500
  const CACHE_TTL_MS = 60 * 60 * 1000
  const PAKISTAN_COUNTRY_CODE = "+92"
  const PAKISTAN_MOBILE_DIGITS = 10
  const PAKISTAN_MOBILE_REGEX = /^3\d{9}$/

  const [localCategories, setLocalCategories] = useState<string[]>([])
  
  const fetchCategories = async () => {
    const now = Date.now()
    try {
      setCatLoading(true)
      try {
        const raw = sessionStorage.getItem("add:categories")
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed?.data) && typeof parsed?.ts === "number" && (now - parsed.ts) < CACHE_TTL_MS) {
            setLocalCategories(parsed.data)
          }
        }
      } catch {}

      const res = await fetch("/api/categories?limit=200&nocache=1", { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      const list: string[] = Array.isArray(data?.categories)
        ? data.categories.map((c: any) => c?.name || c?.slug).filter(Boolean)
        : []
      if (list.length) {
        setLocalCategories((prev) => {
          const prevSet = new Set(prev)
          const newSet = new Set(list)
          let differs = prevSet.size !== newSet.size
          if (!differs) { for (const s of newSet) { if (!prevSet.has(s)) { differs = true; break } } }
          if (differs) {
            try { sessionStorage.setItem("add:categories", JSON.stringify({ ts: now, data: list })) } catch {}
            return list
          }
          return prev
        })
      }
    } catch {
    } finally {
      setCatLoading(false)
    }
  }
  
  useEffect(() => {
    fetchCategories()
  }, [])
  
  const [catOpen, setCatOpen] = useState(false)
  const [catQuery, setCatQuery] = useState("")
  const [catLoading, setCatLoading] = useState(true)
  const filteredCategories = useMemo(() => {
    const q = catQuery.trim().toLowerCase()
    if (!q) return localCategories
    return localCategories.filter((c) => c.toLowerCase().includes(q))
  }, [catQuery, localCategories])

  useEffect(() => {
    if (catOpen) fetchCategories()
  }, [catOpen])
  
  const [subCatOpen, setSubCatOpen] = useState(false)
  const [subCatQuery, setSubCatQuery] = useState("")
  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([])
  const [subCatLoading, setSubCatLoading] = useState(false)
  const filteredSubCategories = useMemo(() => {
    const q = subCatQuery.trim().toLowerCase()
    if (!q) return subCategoryOptions
    return subCategoryOptions.filter((s) => s.toLowerCase().includes(q))
  }, [subCatQuery, subCategoryOptions])
  
  // Country is fixed to Pakistan; no dropdown
  
  const [form, setForm] = useState<FormState>({
    businessName: "",
    contactPersonName: "",
    category: "",
    subCategory: "",
    country: "Pakistan",
    city: "",
    postalCode: "",
    address: "",
    phone: "",
    whatsapp: "",
    email: "",
    description: "",
    logoFile: null,
    websiteUrl: "",
    facebookUrl: "",
    gmbUrl: "",
    youtubeUrl: "",
    profileUsername: "",
  })

  const fetchSubcategories = async () => {
    const cat = form.category?.trim()
    if (!cat) {
      setSubCategoryOptions([])
      return
    }
    try {
      setSubCatLoading(true)
      const res = await fetch(`/api/categories?slug=${encodeURIComponent(slugify(cat))}`, { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      const list: string[] = Array.isArray(data?.category?.subcategories)
        ? data.category.subcategories.map((s: any) => s?.name || s?.slug).filter(Boolean)
        : []
      setSubCategoryOptions(list)
    } catch (e) {
      setSubCategoryOptions([])
    } finally {
      setSubCatLoading(false)
    }
  }

  useEffect(() => { fetchSubcategories() }, [form.category])
  useEffect(() => { if (subCatOpen) fetchSubcategories() }, [subCatOpen])

  // Optional client-side duplicate check (debounced; non-blocking)
  useEffect(() => {
    const name = form.businessName?.trim()
    const city = form.city?.trim()
    const category = form.category?.trim()
    const phone = form.phone?.trim()
    const whatsapp = form.whatsapp?.trim()
    const email = form.email?.trim()
    const hasEnough = (name && city && category) || (phone && phone.length >= 10) || (whatsapp && whatsapp.length >= 10) || (email && email.includes("@"))
    if (!hasEnough) {
      setDuplicateWarning(false)
      return
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/business/check-duplicates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name || "",
            city: city || "",
            category: category || "",
            phone: form.phone ? PAKISTAN_COUNTRY_CODE + form.phone : "",
            whatsapp: form.whatsapp ? PAKISTAN_COUNTRY_CODE + form.whatsapp : undefined,
            address: form.address?.trim() || undefined,
            email: email || "",
            websiteUrl: form.websiteUrl?.trim() || undefined,
            facebookUrl: form.facebookUrl?.trim() || undefined,
            gmbUrl: form.gmbUrl?.trim() || undefined,
            youtubeUrl: form.youtubeUrl?.trim() || undefined,
          }),
        })
        const data = await res.json().catch(() => ({}))
        const hasDupes = !!data?.hasDuplicates
        setDuplicateWarning(hasDupes)
        // Show "already registered" on the exact fields that conflict
        if (hasDupes && data?.conflicts && typeof data.conflicts === "object") {
          const conflicts = data.conflicts as Record<string, boolean>
          const errs: Record<string, boolean> = {}
          const msgs: Record<string, string> = {}
          if (conflicts.nameCityCategory) {
            errs.businessName = true
            errs.city = true
            errs.category = true
            msgs.businessName = "A business with this name, city and category is already listed. Try a different name or check if you already have a listing."
            msgs.city = msgs.businessName
            msgs.category = msgs.businessName
          }
          if (conflicts.phone) {
            errs.phone = true
            msgs.phone = "This number is already in our directory. Please use a different number or search for your existing listing."
          }
          if (conflicts.whatsapp) {
            errs.whatsapp = true
            msgs.whatsapp = "This WhatsApp number is already in our directory. Please use a different number."
          }
          if (conflicts.email) {
            errs.email = true
            msgs.email = "This email is already in our directory. Please use a different email or find your existing listing."
          }
          if (conflicts.websiteUrl) {
            errs.websiteUrl = true
            msgs.websiteUrl = "This website is already listed. Please use a different URL."
          }
          if (conflicts.facebookUrl) {
            errs.facebookUrl = true
            msgs.facebookUrl = "This Facebook link is already in our directory."
          }
          if (conflicts.gmbUrl) {
            errs.gmbUrl = true
            msgs.gmbUrl = "This Google Business link is already in our directory."
          }
          if (conflicts.youtubeUrl) {
            errs.youtubeUrl = true
            msgs.youtubeUrl = "This YouTube link is already in our directory."
          }
          if (Object.keys(errs).length) {
            setFieldErrors((prev) => ({ ...prev, ...errs }))
            setFieldErrorMessages((prev) => ({ ...prev, ...msgs }))
          }
        } else if (!hasDupes) {
          // Clear duplicate-related field errors when check says no duplicates
          setFieldErrors((prev) => {
            const next = { ...prev }
            const dupKeys = ["businessName", "city", "category", "phone", "whatsapp", "address", "email", "websiteUrl", "facebookUrl", "gmbUrl", "youtubeUrl"]
            dupKeys.forEach((k) => delete next[k])
            return next
          })
          setFieldErrorMessages((prev) => {
            const next = { ...prev }
            const dupKeys = ["businessName", "city", "category", "phone", "whatsapp", "address", "email", "websiteUrl", "facebookUrl", "gmbUrl", "youtubeUrl"]
            dupKeys.forEach((k) => delete next[k])
            return next
          })
        }
      } catch {
        setDuplicateWarning(false)
      }
    }, 600)
    return () => clearTimeout(t)
  }, [form.businessName, form.city, form.category, form.phone, form.whatsapp, form.address, form.email, form.websiteUrl, form.facebookUrl, form.gmbUrl, form.youtubeUrl])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "categories:version") {
        fetchCategories()
        fetchSubcategories()
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchCategories()
        fetchSubcategories()
      }
    }
    window.addEventListener("storage", onStorage)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      window.removeEventListener("storage", onStorage)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  const completionPercentage = useMemo(() => {
    const requiredFields = [
      form.businessName,
      form.category,
      form.country,
      form.city,
      form.address,
      form.phone,
      form.description,
      form.logoFile
    ];
    
    const filledCount = requiredFields.filter(field => 
      field !== null && field !== undefined && field !== ''
    ).length;
    
    return Math.round((filledCount / requiredFields.length) * 100);
  }, [form]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    if (id === "phone" || id === "whatsapp") {
      const digits = toPakistanDigits(value)
      setForm((prev) => ({ ...prev, [id]: digits }))
    } else {
      setForm((prev) => ({ ...prev, [id]: value }))
    }
    if (fieldErrors[id]) {
      setFieldErrors(prev => ({ ...prev, [id]: false }))
      setFieldErrorMessages(prev => ({ ...prev, [id]: "" }))
    }
    setFormErrorMessage(null)
    setDuplicateWarning(false)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setForm((prev) => ({ ...prev, logoFile: file }))
    if (fieldErrors.logo) {
      setFieldErrors(prev => ({ ...prev, logo: false }))
      setFieldErrorMessages(prev => ({ ...prev, logo: "" }))
    }
    if (file) {
      const url = URL.createObjectURL(file)
      setLogoPreview(url)
    } else {
      setLogoPreview(null)
    }
  }

  const friendlyLabels: Record<string, { label: string; inputId: string; message: string }> = {
    businessName: { label: "Business Name", inputId: "businessName", message: "Enter your business name" },
    category: { label: "Category", inputId: "category", message: "Select a category" },
    country: { label: "Country", inputId: "country", message: "Country is required" },
    city: { label: "City", inputId: "city", message: "Select your city" },
    address: { label: "Complete Address", inputId: "address", message: "Enter your full address" },
    phone: { label: "Phone Number", inputId: "phone", message: "Enter a valid Pakistan mobile number (10 digits after +92)" },
    whatsapp: { label: "WhatsApp Number", inputId: "whatsapp", message: "Enter a valid Pakistan mobile number (10 digits after +92)" },
    email: { label: "Email", inputId: "email", message: "Enter a valid email" },
    description: { label: "Business Description", inputId: "description", message: "Description must be at least 500 characters" },
    logo: { label: "Business Logo", inputId: "logo", message: "Upload your business logo" },
    websiteUrl: { label: "Website URL", inputId: "websiteUrl", message: "Enter a valid website URL" },
    facebookUrl: { label: "Facebook", inputId: "facebookUrl", message: "Enter a valid Facebook URL" },
    gmbUrl: { label: "Google Business", inputId: "gmbUrl", message: "Enter a valid Google Business URL" },
    youtubeUrl: { label: "YouTube", inputId: "youtubeUrl", message: "Enter a valid YouTube URL" },
  }

  // Client-side format validation helpers
  const phoneDigits = (s: string) => String(s || "").replace(/\D/g, "")
  const toPakistanDigits = (s: string) => phoneDigits(s).slice(0, PAKISTAN_MOBILE_DIGITS)
  const isValidPakistanMobile = (digits: string) => digits.length === PAKISTAN_MOBILE_DIGITS && PAKISTAN_MOBILE_REGEX.test(digits)
  const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim())
  const isValidUrl = (s: string) => {
    const v = String(s || "").trim()
    if (!v) return true
    try {
      new URL(v.startsWith("http") ? v : `https://${v}`)
      return true
    } catch {
      return false
    }
  }

  const validate = () => {
    setFormErrorMessage(null)
    const required = [
      ["businessName", form.businessName],
      ["category", form.category],
      ["country", form.country],
      ["city", form.city],
      ["address", form.address],
      ["phone", form.phone],
      ["whatsapp", form.whatsapp],
      ["email", form.email],
      ["description", form.description],
    ] as const

    const missingKeys = required.filter(([, v]) => !v || String(v).trim() === "").map(([k]) => k as string)
    if (!form.logoFile) missingKeys.push("logo")

    const errors: Record<string, boolean> = {}
    const messages: Record<string, string> = {}

    missingKeys.forEach(key => {
      errors[key] = true
      messages[key] = friendlyLabels[key]?.message || "This field is required"
    })

    // Description: minimum 500 characters
    if (form.description?.trim() && form.description.trim().length < DESCRIPTION_MIN) {
      errors.description = true
      messages.description = `Description must be at least ${DESCRIPTION_MIN} characters (you have ${form.description.trim().length}).`
    }

    // Digital presence: at least one of Website or Facebook required
    const hasWebsite = !!form.websiteUrl?.trim()
    const hasFacebook = !!form.facebookUrl?.trim()
    if (!hasWebsite && !hasFacebook) {
      errors.websiteUrl = true
      errors.facebookUrl = true
      messages.websiteUrl = "Enter at least one: Website URL or Facebook page link (required)."
      messages.facebookUrl = "Enter at least one: Website URL or Facebook page link (required)."
    }

    // Pakistan mobile: exactly 10 digits after +92, must start with 3 (e.g. 300 1234567)
    if (form.phone?.trim()) {
      const digits = toPakistanDigits(form.phone)
      if (digits.length !== PAKISTAN_MOBILE_DIGITS) {
        errors.phone = true
        messages.phone = "Enter 10 digits (Pakistan mobile, e.g. 300 1234567). Only +92 numbers accepted."
      } else if (!PAKISTAN_MOBILE_REGEX.test(digits)) {
        errors.phone = true
        messages.phone = "Pakistan mobile numbers must start with 3 (e.g. 300, 301, 321). Only +92 accepted."
      }
    }
    if (form.whatsapp?.trim()) {
      const digits = toPakistanDigits(form.whatsapp)
      if (digits.length !== PAKISTAN_MOBILE_DIGITS) {
        errors.whatsapp = true
        messages.whatsapp = "Enter 10 digits (Pakistan mobile, e.g. 300 1234567). Only +92 numbers accepted."
      } else if (!PAKISTAN_MOBILE_REGEX.test(digits)) {
        errors.whatsapp = true
        messages.whatsapp = "Pakistan mobile numbers must start with 3 (e.g. 300, 301, 321). Only +92 accepted."
      }
    }
    if (form.email?.trim() && !isValidEmail(form.email)) {
      errors.email = true
      messages.email = "Enter a valid email address"
    }
    if (form.websiteUrl?.trim() && !isValidUrl(form.websiteUrl)) {
      errors.websiteUrl = true
      messages.websiteUrl = "Enter a valid website URL"
    }
    if (form.facebookUrl?.trim() && !isValidUrl(form.facebookUrl)) {
      errors.facebookUrl = true
      messages.facebookUrl = "Enter a valid Facebook URL"
    }
    if (form.gmbUrl?.trim() && !isValidUrl(form.gmbUrl)) {
      errors.gmbUrl = true
      messages.gmbUrl = "Enter a valid Google Business URL"
    }
    if (form.youtubeUrl?.trim() && !isValidUrl(form.youtubeUrl)) {
      errors.youtubeUrl = true
      messages.youtubeUrl = "Enter a valid YouTube URL"
    }

    setFieldErrors(errors)
    setFieldErrorMessages(messages)

    const hasErrors = Object.keys(errors).length > 0
    if (hasErrors) {
      toast({
        title: "Please fix the errors below",
        description: "Check the fields marked in red.",
        variant: "destructive",
      })
      const firstKey = Object.keys(errors)[0]
      const inputId = friendlyLabels[firstKey]?.inputId || firstKey
      const el = document.getElementById(inputId)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        ;(el as HTMLElement).focus?.()
      }
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("name", form.businessName)
      if (form.contactPersonName) fd.append("contactPerson", form.contactPersonName)
      fd.append("category", form.category)
      if (form.subCategory) fd.append("subCategory", form.subCategory)
      if (form.country) fd.append("country", form.country)
      fd.append("city", form.city)
      if (form.postalCode) fd.append("postalCode", form.postalCode)
      fd.append("address", form.address)
      fd.append("phone", PAKISTAN_COUNTRY_CODE + form.phone)
      fd.append("whatsapp", PAKISTAN_COUNTRY_CODE + form.whatsapp)
      if (form.email) fd.append("email", form.email)
      fd.append("description", form.description)
      if (form.websiteUrl) fd.append("websiteUrl", form.websiteUrl)
      if (form.facebookUrl) fd.append("facebookUrl", form.facebookUrl)
      if (form.gmbUrl) fd.append("gmbUrl", form.gmbUrl)
      if (form.youtubeUrl) fd.append("youtubeUrl", form.youtubeUrl)
      if (form.profileUsername) fd.append("profileUsername", form.profileUsername)
      if (form.logoFile) {
        fd.append("logo", form.logoFile)
      }
      if (locationLat != null && locationLng != null) {
        fd.append("latitude", String(locationLat))
        fd.append("longitude", String(locationLng))
      }

      const res = await fetch("/api/business", {
        method: "POST",
        body: fd,
      })

      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        const slug = data?.slug ?? data?.business?.slug ?? null
        const name = form.businessName.trim() || "Your business"
        setForm({
          businessName: "",
          contactPersonName: "",
          category: "",
          subCategory: "",
          country: "Pakistan",
          city: "",
          postalCode: "",
          address: "",
          phone: "",
          whatsapp: "",
          email: "",
          description: "",
          logoFile: null,
          websiteUrl: "",
          facebookUrl: "",
          gmbUrl: "",
          youtubeUrl: "",
          profileUsername: "",
        })
        setFieldErrors({})
        setFieldErrorMessages({})
        setFormErrorMessage(null)
        setDuplicateWarning(false)
        setLocationLat(null)
        setLocationLng(null)
        setGeocodeFailed(false)
        onSubmitted?.()
        router.push(slug
          ? `/add/success?slug=${encodeURIComponent(slug)}&name=${encodeURIComponent(name)}`
          : "/add/success")
      } else {
        setFormErrorMessage(null)
        let userMessage = "Something went wrong. Please check your entries and try again."
        const fieldMap: Record<string, string> = {}
        try {
          const data = await res.json()

          if (res.status === 409 && data?.conflicts && typeof data.conflicts === "object") {
            userMessage = "We already have this in our directory. Please update the fields below or search the site to find your existing listing."
            const conflicts = data.conflicts as Record<string, boolean>
            if (conflicts.nameCityCategory) {
              fieldMap.businessName = "A business with this name, city and category is already listed. Try a different name or check if you already have a listing."
              fieldMap.city = "A business with this name, city and category is already listed. Try a different name or check if you already have a listing."
              fieldMap.category = "A business with this name, city and category is already listed. Try a different name or check if you already have a listing."
            }
            if (conflicts.phone) fieldMap.phone = "This number is already in our directory. Use a different number or search for your existing listing."
            if (conflicts.whatsapp) fieldMap.whatsapp = "This WhatsApp number is already in our directory. Please use a different number."
            if (conflicts.email) fieldMap.email = "This email is already in our directory. Use a different email or find your existing listing."
            if (conflicts.websiteUrl) fieldMap.websiteUrl = "This website is already listed. Please use a different URL."
            if (conflicts.facebookUrl) fieldMap.facebookUrl = "This Facebook link is already in our directory."
            if (conflicts.gmbUrl) fieldMap.gmbUrl = "This Google Business link is already in our directory."
            if (conflicts.youtubeUrl) fieldMap.youtubeUrl = "This YouTube link is already in our directory."
            setFieldErrors(prev => ({ ...prev, ...Object.fromEntries(Object.keys(fieldMap).map(k => [k, true])) }))
            setFieldErrorMessages(prev => ({ ...prev, ...fieldMap }))
          } else if (Array.isArray(data?.details)) {
            for (const d of data.details) {
              const path = (d?.path && (Array.isArray(d.path) ? d.path.join(".") : String(d.path))) || ""
              const msg = d?.message || "Invalid"
              const key = path === "name" ? "businessName" : path === "logo" ? "logo" : path
              if (friendlyLabels[key]) {
                fieldMap[key] = friendlyLabels[key].message
              }
            }
            if (Object.keys(fieldMap).length) {
              setFieldErrors(prev => ({ ...prev, ...Object.fromEntries(Object.keys(fieldMap).map(k => [k, true])) }))
              setFieldErrorMessages(prev => ({ ...prev, ...fieldMap }))
            }
          }
          if (data?.error && typeof data.error === "string") {
            const lower = data.error.toLowerCase()
            if (res.status !== 409 && (lower.includes("duplicate") || lower.includes("already"))) userMessage = "We may already have this in our directory. Please search the site or try different details."
            else if (res.status === 409) userMessage = data.error
            else if (lower.includes("invalid") || lower.includes("validation")) userMessage = "Please fix the highlighted fields and try again."
            else userMessage = data.error
          }
        } catch (_) {
          try {
            const text = await res.text()
            if (text && text.length < 120) userMessage = text
          } catch {}
        }
        setFormErrorMessage(userMessage)
        toast({ title: "Submission failed", description: userMessage, variant: "destructive" })
      }
    } catch (err) {
      setFormErrorMessage("Check your connection and try again.")
      toast({ title: "Connection error", description: "Check your connection and try again.", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Page title and CTA */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
              {description}
            </p>
            <section className="mt-6 text-left max-w-2xl mx-auto" aria-labelledby="how-to-add-heading">
              <h2 id="how-to-add-heading" className="text-lg font-semibold text-gray-900 mb-2">How to add your business listing in Pakistan</h2>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                <li>Fill in your business name, category, city, and address.</li>
                <li>Add contact details (phone, email, WhatsApp, website).</li>
                <li>Submit the form. Listing is free and goes live after submission.</li>
              </ol>
            </section>
            <div className="mt-6 max-w-2xl mx-auto">
              <AdSenseSlot slotId="add-before-form-completion" className="my-6" />
            </div>
          </div>
          {/* Enhanced Progress Card */}
          <div className="mb-6 sm:mb-8 md:mb-10">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl border border-gray-100/50 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Form Completion</h2>
                  <p className="text-sm sm:text-base text-gray-600">Fill in all required fields to complete your listing</p>
                </div>
                <div className="text-center sm:text-right flex-shrink-0">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                    {completionPercentage}%
                </div>
                  <div className="text-xs sm:text-sm text-gray-500 font-medium">Complete</div>
              </div>
              </div>
              <div className="relative w-full bg-gray-100 rounded-full h-4 overflow-hidden shadow-inner">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out shadow-lg"
                  style={{ width: `${completionPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            {submitting && (
              <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-lg flex flex-col items-center justify-center gap-6 rounded-3xl shadow-2xl">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-indigo-200 rounded-full"></div>
                  <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-2">Submitting your listing...</div>
                  <div className="text-gray-600">This will only take a moment</div>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              <form onSubmit={handleSubmit} noValidate className="space-y-0" role="form" aria-label="Business listing registration form" aria-describedby={formErrorMessage ? "form-error" : undefined}>
                {formErrorMessage && (
                  <div id="form-error" className="mx-4 sm:mx-6 md:mx-8 lg:mx-10 mt-4 sm:mt-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">
                    {formErrorMessage}
                  </div>
                )}
                {duplicateWarning && !formErrorMessage && (
                  <div className="mx-4 sm:mx-6 md:mx-8 lg:mx-10 mt-4 sm:mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm" role="status">
                    We already have some of this information in our directory. Please update the fields marked in red, or search the site to find your existing listing.
                  </div>
                )}
                {/* Basic Information */}
                <section className="p-4 sm:p-6 md:p-8 lg:p-10 border-b border-gray-100 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30">
                  <div className="flex items-start gap-3 sm:gap-4 md:gap-5 mb-6 sm:mb-8">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <Building className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Business Information</h2>
                      <p className="text-sm sm:text-base text-gray-600">Enter your business name, contact person, and email address</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="businessName" className="text-gray-700 font-semibold text-sm flex items-center gap-1">
                        Business Name <span className="text-red-500 text-lg">*</span>
                      </Label>
                        <Input 
                          id="businessName" 
                          name="businessName"
                        placeholder="e.g., ABC Restaurant, XYZ Services" 
                          value={form.businessName} 
                          onChange={handleChange} 
                          aria-describedby={fieldErrors.businessName ? "businessName-error" : "businessName-help"}
                          aria-invalid={!!fieldErrors.businessName}
                        className={`h-12 border-2 rounded-lg transition-all min-h-[44px] ${fieldErrors.businessName ? 'border-red-400 bg-red-50/50' : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'} bg-white`}
                        />
                      {fieldErrorMessages.businessName ? <p id="businessName-error" className="text-sm text-red-600 mt-1" role="alert">{fieldErrorMessages.businessName}</p> : <p id="businessName-help" className="text-xs text-gray-500">Official business name as on documents</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPersonName" className="text-gray-700 font-semibold text-sm">Contact Person</Label>
                      <Input 
                        id="contactPersonName" 
                        placeholder="Contact person name" 
                        value={form.contactPersonName} 
                        onChange={handleChange} 
                        className="h-12 border-2 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white transition-all" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-semibold text-sm">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="business@example.com" 
                        value={form.email} 
                        onChange={handleChange} 
                        className={`h-12 border-2 rounded-lg transition-all bg-white ${fieldErrors.email ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'}`}
                        aria-invalid={!!fieldErrors.email}
                        aria-describedby={fieldErrors.email ? "email-error" : undefined}
                      />
                      {fieldErrorMessages.email && <p id="email-error" className="text-sm text-red-600 mt-1" role="alert">{fieldErrorMessages.email}</p>}
                    </div>
                  </div>
                </section>
                <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-4">
                  <AdSenseSlot slotId="add-after-business-info" className="my-0" />
                </div>

                {/* Contact Information */}
                <section className="p-10 border-b border-gray-100 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30">
                  <div className="flex items-start gap-5 mb-8">
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Phone className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold text-gray-900 mb-2">Contact Information</h3>
                      <p className="text-gray-600 text-base">How customers can reach you</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-700 font-semibold text-sm flex items-center gap-1">
                        Phone Number <span className="text-red-500 text-lg">*</span>
                      </Label>
                      <div className={`flex h-12 rounded-lg border-2 overflow-hidden ${fieldErrors.phone ? 'border-red-400 bg-red-50/50' : 'border-gray-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200'} bg-white`}>
                        <span className="inline-flex items-center px-3 sm:px-4 bg-gray-100 text-gray-600 font-medium border-r border-gray-200 shrink-0" aria-hidden>+92</span>
                        <Input
                          id="phone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          maxLength={PAKISTAN_MOBILE_DIGITS}
                          placeholder="300 1234567"
                          value={form.phone}
                          onChange={handleChange}
                          className="h-full border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                          aria-invalid={!!fieldErrors.phone}
                          aria-describedby={fieldErrors.phone ? "phone-error" : "phone-help"}
                        />
                      </div>
                      {fieldErrorMessages.phone ? <p id="phone-error" className="text-sm text-red-600 mt-1" role="alert">{fieldErrorMessages.phone}</p> : <p id="phone-help" className="text-xs text-gray-500 mt-1">Pakistan only. Enter 10 digits (e.g. 300 1234567). No duplicate numbers.</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp" className="text-gray-700 font-semibold text-sm flex items-center gap-1">
                        WhatsApp Number <span className="text-red-500 text-lg">*</span>
                      </Label>
                      <div className={`flex h-12 rounded-lg border-2 overflow-hidden ${fieldErrors.whatsapp ? 'border-red-400 bg-red-50/50' : 'border-gray-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200'} bg-white`}>
                        <span className="inline-flex items-center px-3 sm:px-4 bg-gray-100 text-gray-600 font-medium border-r border-gray-200 shrink-0" aria-hidden>+92</span>
                        <Input
                          id="whatsapp"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          maxLength={PAKISTAN_MOBILE_DIGITS}
                          placeholder="300 1234567"
                          value={form.whatsapp}
                          onChange={handleChange}
                          className="h-full border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                          aria-invalid={!!fieldErrors.whatsapp}
                          aria-describedby={fieldErrors.whatsapp ? "whatsapp-error" : "whatsapp-help"}
                        />
                      </div>
                      {fieldErrorMessages.whatsapp ? <p id="whatsapp-error" className="text-sm text-red-600 mt-1" role="alert">{fieldErrorMessages.whatsapp}</p> : <p id="whatsapp-help" className="text-xs text-gray-500 mt-1">Pakistan only. Enter 10 digits. Must be unique in directory.</p>}
                    </div>
                  </div>
                </section>
                <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-4">
                  <AdSenseSlot slotId="add-after-contact-info" className="my-0" />
                </div>

                {/* Location & Category */}
                <section className="p-10 border-b border-gray-100 bg-gradient-to-br from-blue-50/50 via-white to-cyan-50/30">
                  <div className="flex items-start gap-5 mb-8">
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <MapPin className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold text-gray-900 mb-2">Location & Category</h3>
                      <p className="text-gray-600 text-base">Where your business is located and what it does</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {/* Country: Pakistan only (no dropdown) */}
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold text-sm flex items-center gap-1">Country</Label>
                      <div className="flex items-center gap-2 h-12 px-4 rounded-lg border-2 border-gray-200 bg-gray-50 text-gray-700 font-medium">
                        🇵🇰 Pakistan
                      </div>
                    </div>

                    {/* City + Postal in one row: city takes space, postal small */}
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem] gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold text-sm flex items-center gap-1">🇵🇰 Select Your Business City (Pakistan) <span className="text-red-500 text-lg">*</span></Label>
                        <Select value={form.city || ""} onValueChange={(v) => { setForm((s) => ({ ...s, city: v })); if (fieldErrors.city) { setFieldErrors(prev => ({ ...prev, city: false })); setFieldErrorMessages(prev => ({ ...prev, city: "" })); setFormErrorMessage(null); } }}>
                          <SelectTrigger className={`w-full h-12 rounded-lg border-2 transition-all ${fieldErrors.city ? 'border-red-400 bg-red-50/50' : 'border-gray-200 focus:border-blue-500'} bg-white`} aria-invalid={!!fieldErrors.city}>
                            <SelectValue placeholder="Select your city" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {cities.map((city) => (
                              <SelectItem key={city.slug} value={city.name}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldErrorMessages.city && <p className="text-sm text-red-600 mt-1" role="alert">{fieldErrorMessages.city}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode" className="text-gray-700 font-semibold text-sm">Postal Code</Label>
                        <Input
                          id="postalCode"
                          placeholder="e.g. 54000"
                          value={form.postalCode}
                          onChange={handleChange}
                          className="h-12 w-full border-2 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white transition-all"
                        />
                      </div>
                    </div>

                    {/* Category: full width, large combobox */}
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold text-sm flex items-center gap-1">Category <span className="text-red-500 text-lg">*</span></Label>
                      <Popover open={catOpen} onOpenChange={setCatOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" role="combobox" aria-expanded={catOpen} className={`w-full justify-between h-12 min-h-[48px] rounded-lg border-2 transition-all text-left px-4 ${fieldErrors.category ? 'border-red-400 bg-red-50/50' : 'border-gray-200 focus:border-blue-500'} bg-white`}>
                            <span className="truncate">{form.category ? form.category : (catLoading ? "Loading..." : "Select your business category")}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60 flex-shrink-0" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full min-w-[320px] sm:min-w-[380px] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput placeholder="Search category..." value={catQuery} onValueChange={setCatQuery} className="h-10 text-base" />
                            <CommandEmpty>
                              {catLoading ? "Loading..." : "No categories found."}
                            </CommandEmpty>
                            <CommandList className="max-h-[280px]">
                              <CommandGroup heading="Categories">
                                {filteredCategories.map((c) => (
                                  <CommandItem
                                    key={c}
                                    value={c}
                                    onSelect={(val) => {
                                      setForm((p) => ({ ...p, category: val, subCategory: "" }))
                                      setCatOpen(false)
                                      setCatQuery("")
                                    }}
                                    className="text-base py-2.5"
                                  >
                                    {c}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {fieldErrorMessages.category && <p className="text-sm text-red-600 mt-1" role="alert">{fieldErrorMessages.category}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold text-sm">Sub Category (optional)</Label>
                      <Popover open={subCatOpen} onOpenChange={setSubCatOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" role="combobox" aria-expanded={subCatOpen} className="w-full justify-between h-12 min-h-[48px] rounded-lg border-2 border-gray-200 focus:border-blue-500 bg-white transition-all text-left px-4" disabled={!form.category}>
                            <span className="truncate">{form.subCategory || (subCatLoading ? "Loading..." : "Select sub category")}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60 flex-shrink-0" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full min-w-[320px] sm:min-w-[380px] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput placeholder="Search sub category..." value={subCatQuery} onValueChange={setSubCatQuery} className="h-10 text-base" />
                            <CommandEmpty>
                              {subCatLoading ? "Loading..." : "No sub categories found."}
                            </CommandEmpty>
                            <CommandList className="max-h-[240px]">
                              <CommandGroup heading="Sub Categories">
                                {filteredSubCategories.map((s) => (
                                  <CommandItem
                                    key={s}
                                    value={s}
                                    onSelect={(val) => {
                                      setForm((p) => ({ ...p, subCategory: val }))
                                      setSubCatOpen(false)
                                      setSubCatQuery("")
                                    }}
                                    className="text-base py-2.5"
                                  >
                                    {s}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <Label htmlFor="address" className="text-gray-700 font-semibold text-sm flex items-center gap-1">
                      Complete Address <span className="text-red-500 text-lg">*</span>
                    </Label>
                    <Input 
                      id="address" 
                      placeholder="Street address, building, floor, etc." 
                      value={form.address} 
                      onChange={handleChange} 
                      aria-invalid={!!fieldErrors.address}
                      aria-describedby={fieldErrors.address ? "address-error" : undefined}
                      className={`h-12 border-2 rounded-lg transition-all min-h-[44px] ${fieldErrors.address ? 'border-red-400 bg-red-50/50' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'} bg-white`}
                    />
                    {fieldErrorMessages.address && <p id="address-error" className="text-sm text-red-600 mt-1" role="alert">{fieldErrorMessages.address}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!form.address?.trim() || !form.city?.trim() || geocodeLoading}
                        onClick={async () => {
                          setGeocodeFailed(false)
                          setGeocodeLoading(true)
                          try {
                            const params = new URLSearchParams({
                              address: form.address.trim(),
                              city: form.city.trim(),
                              country: form.country || "Pakistan",
                            })
                            if (form.area?.trim()) params.set("area", form.area.trim())
                            const res = await fetch(`/api/geocode?${params.toString()}`)
                            const data = await res.json().catch(() => ({}))
                            if (data?.ok && data.latitude != null && data.longitude != null) {
                              setLocationLat(data.latitude)
                              setLocationLng(data.longitude)
                              setShowLocationMap(true)
                            } else {
                              setGeocodeFailed(true)
                              toast({ title: "Location could not be verified", description: "You can still submit; listing may not appear in “near me” until fixed.", variant: "default" })
                            }
                          } catch {
                            setGeocodeFailed(true)
                            toast({ title: "Could not verify location", description: "You can still submit.", variant: "default" })
                          } finally {
                            setGeocodeLoading(false)
                          }
                        }}
                      >
                        {geocodeLoading ? "Verifying…" : "Verify location (recommended)"}
                      </Button>
                      {locationLat != null && locationLng != null && (
                        <span className="text-sm text-green-700 font-medium flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" /> Location set
                        </span>
                      )}
                      {geocodeFailed && (
                        <span className="text-sm text-amber-700">Location not verified; you can still submit.</span>
                      )}
                    </div>
                  </div>
                </section>
                <LocationMapConfirm
                  open={showLocationMap}
                  onOpenChange={setShowLocationMap}
                  initialLat={locationLat ?? 31.5204}
                  initialLng={locationLng ?? 74.3587}
                  onConfirm={(lat, lng) => {
                    setLocationLat(lat)
                    setLocationLng(lng)
                  }}
                  address={[form.address, form.area, form.city].filter(Boolean).join(", ")}
                />
                <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-4">
                  <AdSenseSlot slotId="add-after-location-category" className="my-0" />
                </div>

                {/* Business Description & Logo */}
                <section className="p-10 border-b border-gray-100 bg-gradient-to-br from-purple-50/50 via-white to-pink-50/30">
                  <div className="flex items-start gap-5 mb-8">
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <User className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold text-gray-900 mb-2">Business Details</h3>
                      <p className="text-gray-600 text-base">Tell us about your business and upload your logo</p>
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-gray-700 font-semibold text-sm flex items-center gap-1">
                        Business Description <span className="text-red-500 text-lg">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your business, services, and what makes you unique..."
                        value={form.description}
                        onChange={handleChange}
                        maxLength={DESCRIPTION_MAX}
                        rows={5}
                        aria-invalid={!!fieldErrors.description}
                        aria-describedby={fieldErrors.description ? "description-error" : undefined}
                        className={`border-2 rounded-lg resize-none transition-all min-h-[44px] ${fieldErrors.description ? 'border-red-400 bg-red-50/50' : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'} bg-white`}
                      />
                      {fieldErrorMessages.description && <p id="description-error" className="text-sm text-red-600 mt-1" role="alert">{fieldErrorMessages.description}</p>}
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Minimum {DESCRIPTION_MIN} characters required</span>
                        <span className="font-medium">{form.description.length}/{DESCRIPTION_MAX}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logo" className="text-gray-700 font-semibold text-sm flex items-center gap-1">
                        Business Logo <span className="text-red-500 text-lg">*</span>
                      </Label>
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="relative flex-1 w-full">
                          <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${fieldErrors.logo ? 'border-red-400 bg-red-50/50' : 'border-gray-300 hover:border-purple-400 bg-gray-50/50 hover:bg-gray-50'}`}>
                            <div className="flex flex-col items-center">
                              <Upload className="h-10 w-10 text-gray-400 mb-3" />
                              <div className="text-base font-semibold text-gray-900 mb-1">Upload business logo</div>
                              <div className="text-sm text-gray-600 mb-4">JPG, PNG, WebP or SVG. Max 2.5MB</div>
                              <Button type="button" variant="outline" size="sm" className="pointer-events-none">
                                Choose File
                              </Button>
                            </div>
                            <Input 
                              id="logo" 
                              type="file" 
                              accept="image/png,image/jpeg,image/webp,image/svg+xml" 
                              onChange={handleFile} 
                              aria-invalid={!!fieldErrors.logo}
                              aria-describedby={fieldErrors.logo ? "logo-error" : undefined}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer min-h-[44px]"
                            />
                          </div>
                        </div>
                        {fieldErrorMessages.logo && <p id="logo-error" className="text-sm text-red-600 mt-1" role="alert">{fieldErrorMessages.logo}</p>}
                        {logoPreview && (
                          <div className="flex-shrink-0">
                            <div className="w-32 h-32 rounded-xl border-2 border-gray-200 overflow-hidden bg-white shadow-lg">
                              <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-2" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
                <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-4">
                  <AdSenseSlot slotId="add-after-business-details" className="my-0" />
                </div>

                {/* Digital Presence */}
                <section className="p-10 border-b border-gray-100 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30">
                  <div className="flex items-start gap-5 mb-8">
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Globe className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold text-gray-900 mb-2">Digital Presence</h3>
                      <p className="text-gray-600 text-base">At least one required: Website URL or Facebook page link</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="websiteUrl" className="text-gray-700 font-semibold text-sm">Website URL <span className="text-amber-600">(required if no Facebook)</span></Label>
                      <Input 
                        id="websiteUrl" 
                        placeholder="https://www.example.com" 
                        value={form.websiteUrl} 
                        onChange={handleChange} 
                        className={`h-12 border-2 rounded-lg transition-all bg-white ${fieldErrors.websiteUrl ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'}`}
                        aria-invalid={!!fieldErrors.websiteUrl}
                        aria-describedby={fieldErrors.websiteUrl ? "websiteUrl-error" : undefined}
                      />
                      {fieldErrorMessages.websiteUrl && <p id="websiteUrl-error" className="text-sm text-red-600 mt-1" role="alert">{fieldErrorMessages.websiteUrl}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facebookUrl" className="text-gray-700 font-semibold text-sm">Facebook Page <span className="text-amber-600">(required if no Website)</span></Label>
                      <Input 
                        id="facebookUrl" 
                        placeholder="https://facebook.com/yourpage" 
                        value={form.facebookUrl} 
                        onChange={handleChange} 
                        className={`h-12 border-2 rounded-lg transition-all bg-white ${fieldErrors.facebookUrl ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'}`}
                        aria-invalid={!!fieldErrors.facebookUrl}
                        aria-describedby={fieldErrors.facebookUrl ? "facebookUrl-error" : undefined}
                      />
                      {fieldErrorMessages.facebookUrl && <p id="facebookUrl-error" className="text-sm text-red-600 mt-1" role="alert">{fieldErrorMessages.facebookUrl}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gmbUrl" className="text-gray-700 font-semibold text-sm">Google Business Profile</Label>
                      <Input 
                        id="gmbUrl" 
                        placeholder="https://maps.google.com/?cid=..." 
                        value={form.gmbUrl} 
                        onChange={handleChange} 
                        className={`h-12 border-2 rounded-lg transition-all bg-white ${fieldErrors.gmbUrl ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'}`}
                        aria-invalid={!!fieldErrors.gmbUrl}
                        aria-describedby={fieldErrors.gmbUrl ? "gmbUrl-error" : undefined}
                      />
                      {fieldErrorMessages.gmbUrl && <p id="gmbUrl-error" className="text-sm text-red-600 mt-1" role="alert">{fieldErrorMessages.gmbUrl}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtubeUrl" className="text-gray-700 font-semibold text-sm">YouTube Channel</Label>
                      <Input 
                        id="youtubeUrl" 
                        placeholder="https://youtube.com/@yourchannel" 
                        value={form.youtubeUrl} 
                        onChange={handleChange} 
                        className={`h-12 border-2 rounded-lg transition-all bg-white ${fieldErrors.youtubeUrl ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'}`}
                        aria-invalid={!!fieldErrors.youtubeUrl}
                        aria-describedby={fieldErrors.youtubeUrl ? "youtubeUrl-error" : undefined}
                      />
                      {fieldErrorMessages.youtubeUrl && <p id="youtubeUrl-error" className="text-sm text-red-600 mt-1" role="alert">{fieldErrorMessages.youtubeUrl}</p>}
                    </div>
                  </div>
                </section>
                <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-4">
                  <AdSenseSlot slotId="add-after-digital-presence" className="my-0" />
                </div>

                {/* Submit Button — prominent green CTA like home page */}
                <div className="p-8 sm:p-10 bg-gradient-to-b from-slate-50 to-white border-t border-gray-100">
                  <div className="max-w-2xl mx-auto text-center">
                    <Button
                      type="submit"
                      className="w-full sm:w-auto min-h-[52px] sm:min-h-[56px] px-8 sm:px-12 py-4 text-base sm:text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      disabled={submitting}
                      aria-busy={submitting}
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-3">
                          <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" aria-hidden />
                          <span>Submitting…</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-3">
                          <Star className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" aria-hidden />
                          <span>Add Your Business Free</span>
                          <Star className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" aria-hidden />
                        </span>
                      )}
                    </Button>
                    <p className="mt-4 text-sm text-gray-600">
                      Your listing goes live immediately after submission. Free forever.
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AddBusinessPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "List Your Business",
            "description": "Add your business to the directory for free",
            "url": "https://biz-own.com/add",
            "mainEntity": {
              "@type": "Service",
              "name": "Business Listing Service",
              "description": "Free business directory listing service for businesses worldwide",
              "provider": {
                "@type": "Organization",
                "name": "BizDirectory"
              }
            }
          })
        }}
      />
      <AddBusinessForm />
    </>
  )
}