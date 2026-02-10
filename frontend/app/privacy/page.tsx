export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#020617] text-slate-300 p-8 md:p-24 font-sans leading-relaxed">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-white mb-8 uppercase tracking-tighter">Privacy Policy</h1>
        <p className="mb-6 text-blue-500 font-bold">Last Updated: February 10, 2026</p>

        {/* SECTION 1: DATA COLLECTION */}
        <section className="mb-10 border-b border-white/5 pb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-blue-500">01.</span> Data Collection
          </h2>
          <p>We do not require any registration or personal accounts to use King Downloader. We do not collect names, emails, or personal identifiers. We may log non-identifiable information like your IP address or browser type strictly for security and server performance monitoring.</p>
        </section>

        {/* SECTION 2: ADVERTISING COOKIES */}
        <section className="mb-10 border-b border-white/5 pb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-blue-500">02.</span> Advertising & Cookies
          </h2>
          <p>We partner with third-party ad networks (Adsterra and PropellerAds) to serve ads. These partners may use cookies to serve ads based on your visit to this and other sites. You can manage or disable cookies at any time through your browser settings.</p>
        </section>

        {/* SECTION 3: MEDIA PROCESSING */}
        <section className="mb-10 border-b border-white/5 pb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-blue-500">03.</span> Media Processing
          </h2>
          <p>All video and audio files processed by our DigitalOcean VPS engine are temporary. Our automated background tasks delete all downloaded media from our storage within 30 minutes of processing to ensure user privacy and server efficiency.</p>
        </section>

        {/* SECTION 4: THIRD-PARTY LINKS */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-blue-500">04.</span> Third-Party Services
          </h2>
          <p>This site contains links to external donation platforms (Binance Pay). We are not responsible for the privacy practices or content of these third-party platforms.</p>
        </section>

        {/* SECTION 5: GDPR / EUROPEAN USER RIGHTS */}
<section className="mb-10 border-b border-white/5 pb-6">
  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
    <span className="text-blue-500">05.</span> GDPR Compliance (EU Users)
  </h2>
  <p className="mb-4 text-sm text-slate-400">
    If you are a resident of the European Economic Area (EEA), you have specific data protection rights under the GDPR. King Downloader acts as a Data Controller for minimal server logs and a Data Processor for media conversion.
  </p>
  <ul className="list-disc ml-6 space-y-2 text-sm text-slate-400">
    <li><strong>Right to Access:</strong> You can request information about any logs we hold regarding your IP address (deleted every 24 hours).</li>
    <li><strong>Right to Erasure:</strong> All media files are automatically erased within 30 minutes of processing.</li>
    <li><strong>Data Portability:</strong> As we do not store personal accounts, there is no personal data to "port" or transfer.</li>
    <li><strong>Consent for Ads:</strong> By using this site, you acknowledge that our partners (Adsterra/PropellerAds) may process data for personalized advertising based on your consent settings.</li>
  </ul>
</section>

        <footer className="mt-20 pt-8 border-t border-white/10 text-xs text-slate-500 italic">
          For legal inquiries, contact: prodat.courses@gmail.com
        </footer>
      </div>
    </main>
  );
}