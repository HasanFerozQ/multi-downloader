// frontend/app/about/page.tsx
import { Info, ShieldCheck, Globe, Zap } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-slate-300 p-8 md:p-24 font-sans leading-relaxed">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER SECTION */}
        <header className="mb-16 border-b border-white/10 pb-10">
          <h1 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase">
            About <span className="text-blue-500">King Downloader</span>
          </h1>
          <p className="text-lg text-slate-400">
            King Downloader (formerly King Utility) is a professional social media services platform 
            dedicated to media intelligence and content optimization[cite: 3].
          </p>
        </header>

        {/* CORE PHILOSOPHY */}
        <section className="grid md:grid-cols-2 gap-10 mb-20">
          <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
            <ShieldCheck className="text-blue-500 mb-4" size={32} />
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Zero Hosting Policy</h3>
            <p className="text-sm leading-relaxed">
              King Downloader does not host any videos on its servers[cite: 2, 66]. All media files 
              processed through our platform are hosted on the original platforms' CDNs (Content Delivery Networks)[cite: 2].
            </p>
          </div>

          <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
            <Globe className="text-cyan-500 mb-4" size={32} />
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Privacy First</h3>
            <p className="text-sm leading-relaxed">
              Using our service is totally anonymous and safe[cite: 67]. We do not save your videos 
              on our servers, nor do we keep a history of your downloads[cite: 66].
            </p>
          </div>
        </section>

        {/* DETAILED MISSION & DISCLAIMER */}
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
              <Zap className="text-yellow-500" size={20} /> Our Mission
            </h2>
            <p className="mb-4">
              Our goal is to provide a free-to-use website that helps users save their favorite 
              social media content for offline viewing by generating direct links[cite: 65]. 
              We operate as a general-purpose search engine and tool[cite: 144].
            </p>
            <p className="text-sm italic text-slate-500">
              King Downloader is a social media services website and is not associated by any 
              means with Facebook, Meta Platforms, Inc., or any other social media brand[cite: 3, 8].
            </p>
          </section>

          <section className="bg-blue-600/5 border-l-4 border-blue-600 p-8 rounded-r-2xl">
            <h2 className="text-lg font-bold text-white mb-2 uppercase">Legal Transparency</h2>
            <p className="text-sm">
              We run advertisements on our website to feed our servers and keep King Downloader 
              alive. We promise to use only safe and non-intrusive ads to ensure your 
              experience remains clean and secure.
            </p>
          </section>
        </div>

        {/* FOOTER LINK BACK */}
        <footer className="mt-24 pt-8 border-t border-white/10 text-center">
          <a href="/" className="text-blue-500 font-bold hover:underline uppercase text-sm tracking-widest">
            ← Back to Tools
          </a>
        </footer>
      </div>
    </main>
  );
}