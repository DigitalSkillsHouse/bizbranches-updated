"use client"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background" role="main">
      <div className="container mx-auto px-4 py-10 md:py-14 max-w-4xl">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">About BizBranches</h1>

        <section aria-labelledby="what-is-bizbranches">
          <h2 id="what-is-bizbranches" className="text-xl md:text-2xl font-semibold text-foreground mb-3">What is BizBranches?</h2>
          <p className="text-foreground/90 leading-relaxed mb-4">
            BizBranches is a free business listing directory for Pakistan. It helps people find local businesses by city and category, and lets business owners add their listing at no cost.
          </p>
        </section>

        <section aria-labelledby="who-is-it-for" className="mb-8">
          <h2 id="who-is-it-for" className="text-xl md:text-2xl font-semibold text-foreground mb-3">Who is it for?</h2>
          <ul className="list-disc pl-6 text-foreground/90 space-y-2 mb-4">
            <li>People in Pakistan looking for local businesses (restaurants, clinics, shops, services).</li>
            <li>Business owners in Pakistan who want a free listing so customers can find them.</li>
          </ul>
        </section>

        <section aria-labelledby="what-value" className="mb-8">
          <h2 id="what-value" className="text-xl md:text-2xl font-semibold text-foreground mb-3">What value does it provide?</h2>
          <p className="text-foreground/90 leading-relaxed mb-4">
            Users can search and browse businesses by category and city, read listings with contact details (phone, email, address, website), and contact businesses directly. Business owners get a free listing that appears in search and on category and city pages—no fee to list or to search.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">Our Vision</h2>
          <p className="text-foreground/90 leading-relaxed">
            To be a trusted, free business directory in Pakistan that connects businesses with customers and helps people find local services easily.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">Our Mission</h2>
          <p className="text-foreground/90 leading-relaxed">
            To provide a free platform where businesses in Pakistan can list and be found, and where users can discover and contact local businesses by city and category.
          </p>
        </section>

        <blockquote className="border-l-4 border-primary pl-4 md:pl-5 py-2 italic text-foreground/90 mb-8">
          Find and connect with Pakistani businesses—from city centers to local shops.
        </blockquote>

        <div className="mt-10">
          <p className="text-foreground font-semibold">Digital Skills House</p>
          <p className="text-muted-foreground">Founder of BizBranches.pk</p>

          <hr className="my-6 border-primary border-2" />

          <h2 className="text-xl font-semibold text-foreground">Developed by</h2>
          <p className="text-muted-foreground">Taoqeer Ahmad Rajput</p>
        </div>
      </div>
    </main>
  )
}
