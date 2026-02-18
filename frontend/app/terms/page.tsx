export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 md:py-14 max-w-4xl">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

        <p className="text-foreground/90 leading-relaxed mb-4">
          Welcome to BizBranches. By using our Pakistan business directory and related services, you agree to these Terms of Service.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">Use of the Service</h2>
          <p className="text-foreground/90 leading-relaxed mb-4">
            You may use BizBranches to search for businesses in Pakistan, view listings, read reviews, and contact businesses. Business owners may add their business free in accordance with our listing guidelines. You must not use the service for illegal purposes or to submit false or misleading information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">Business Listings</h2>
          <p className="text-foreground/90 leading-relaxed mb-4">
            Listings are subject to approval. We reserve the right to remove or edit listings that violate our policies or that we deem inappropriate. You are responsible for the accuracy of the information you provide.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">Contact</h2>
          <p className="text-foreground/90 leading-relaxed">
            For questions about these terms, please see our <a href="/contact" className="text-primary underline">Contact</a> page or email support@bizbranches.pk.
          </p>
        </section>
      </div>
    </main>
  );
}
