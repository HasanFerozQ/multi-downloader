// frontend/app/terms/page.tsx
export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-[#020617] text-slate-300 p-8 md:p-24 font-sans leading-relaxed">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-white mb-8">Terms of Service</h1>
        <p className="mb-4">Effective Date: February 10, 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-blue-500 mb-4 uppercase tracking-wider">1. Acceptance of Terms</h2>
          <p>By accessing King Downloader, you agree to be bound by these Terms of Service. If you do not agree to these rules, do not use our service.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-blue-500 mb-4 uppercase tracking-wider">2. Use of Service</h2>
          <p>King Downloader is a tool designed for personal, non-commercial use. Users are responsible for ensuring they have the legal right to download any content processed through our system. You must not use this site for any illegal activities or to violate copyright laws.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-blue-500 mb-4 uppercase tracking-wider">3. Intellectual Property</h2>
          <p>The "King Downloader" name, logo, and website design are our intellectual property. We do not claim ownership of the media files you download; those remain the property of their respective copyright holders.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-blue-500 mb-4 uppercase tracking-wider">4. Limitation of Liability</h2>
          <p>We provide this service "as is" and are not liable for any damages arising from your use of the site, including but not limited to data loss or computer issues. We do not guarantee 100% uptime.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-blue-500 mb-4 uppercase tracking-wider">5. Third-Party Links & Ads</h2>
          <p>Our site contains links to third-party ad networks (Adsterra, PropellerAds). We are not responsible for the content or safety of these external sites.</p>
        </section>

        <footer className="mt-12 pt-8 border-t border-white/10">
          <p className="text-sm">Contact: support@kingdownloader.com (Replace with your actual email later)</p>
        </footer>
      </div>
    </main>
  );
}