import { ShieldAlert, Scale, UserCheck, Copyright } from "lucide-react";

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-[#020617] text-slate-300 p-8 md:p-24 font-sans leading-relaxed">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-white mb-8 uppercase tracking-tighter">Terms of Service</h1>
        <p className="mb-6">Effective Date: February 11, 2026</p>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-blue-500 mb-4 flex items-center gap-2 uppercase tracking-wide">
            <UserCheck size={20} /> 1. Eligibility & Agreement
          </h2>
          <p>By accessing King Downloader, you signify your agreement to these Terms. You must be at least 18 years of age (or the age of majority in your jurisdiction) to use our services. Use is prohibited where disallowed by local law.</p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-blue-500 mb-4 flex items-center gap-2 uppercase tracking-wide">
            <Scale size={20} /> 2. Grant of Use
          </h2>
          <p>We grant you a non-exclusive, non-transferable, and limited right to use King Downloader for your personal, non-commercial use only. This grant is terminable by us at will for any reason.</p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-blue-500 mb-4 flex items-center gap-2 uppercase tracking-wide">
            <Copyright size={20} /> 3. Intellectual Property & Fair Use
          </h2>
          <p>King Downloader does not host any videos on its servers; all content is processed through original platform CDNs. We believe this constitutes "Fair Use" under Section 107 of the US Copyright Law. Users are solely responsible for ensuring they have the rights to download content.</p>
        </section>

        <section className="mb-10 bg-red-500/5 p-6 rounded-2xl border border-red-500/20">
          <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2 uppercase tracking-wide">
            <ShieldAlert size={20} /> 4. Limitation of Liability
          </h2>
          <p className="text-sm">King Downloader is provided "AS-IS" without warranties. We are not liable for any damages, data loss, or legal issues resulting from your use of the service. Maximum liability is limited to $100.</p>
        </section>

        <footer className="mt-12 pt-8 border-t border-white/10 text-xs text-slate-500">
          Contact: legal@kingdownloader.com | Subject to the laws of Pakistan.
        </footer>
      </div>
    </main>
  );
}