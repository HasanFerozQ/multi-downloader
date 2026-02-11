import { EyeOff, Database, Cookie, Globe } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#020617] text-slate-300 p-8 md:p-24 font-sans leading-relaxed">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-white mb-8 uppercase tracking-tighter">Privacy Policy</h1>
        <p className="mb-6">Updated: February 11, 2026</p>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-blue-500 mb-4 flex items-center gap-2 uppercase tracking-wide">
            <EyeOff size={20} /> 1. Anonymous Use
          </h2>
          <p>You may visit King Downloader anonymously. We do not keep a history of your downloads or store media on our servers for longer than the processing period.</p>
        </section>

        <section className="mb-10 border-b border-white/5 pb-10">
          <h2 className="text-xl font-bold text-blue-500 mb-4 flex items-center gap-2 uppercase tracking-wide">
            <Database size={20} /> 2. Data We Collect
          </h2>
          <p>We collect non-personal identification information, such as browser names, OS types, and technical connection data, to optimize our service performance.</p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-blue-500 mb-4 flex items-center gap-2 uppercase tracking-wide">
            <Cookie size={20} /> 3. Advertising & Cookies
          </h2>
          <p>Our site uses cookies to enhance user experience and serve ads. Third-party partners (Adsterra, PropellerAds) may use cookies to deliver targeted advertisements based on your visits to this and other sites.</p>
        </section>

        <section className="mb-10 bg-blue-500/5 p-6 rounded-2xl border border-blue-500/20">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
            <Globe size={20} /> 4. GDPR Compliance (EU Users)
          </h2>
          <p className="text-sm">If you reside in the EEA, you have the right to access, rectify, or erase your minimal log data. All temporary processing files are automatically deleted within 30 minutes to ensure compliance with data minimization principles.</p>
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

        <footer className="mt-12 pt-8 border-t border-white/10 text-xs text-slate-500">
          Contact: legal@kingdownloader.com | Subject to the laws of Pakistan.
        </footer>      
      </div>
    </main>
  );
}
               
