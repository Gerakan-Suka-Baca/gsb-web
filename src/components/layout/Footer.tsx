"use client";

import Link from "next/link";
import { Mail, MapPin, Phone, Instagram, Linkedin, Youtube, Twitter, Music, Video } from "lucide-react";
import Image from "next/image";

export function Footer() {
  const socialMedia = [
    { icon: Instagram, href: "https://www.instagram.com/komunitasgsb", label: "Instagram" },
    { icon: Linkedin, href: "https://www.linkedin.com/in/komunitas-gerakan-suka-baca-403605248/", label: "LinkedIn" },
    { icon: Youtube, href: "https://www.youtube.com/c/GerakanSukaBaca", label: "YouTube" },
    { icon: Twitter, href: "https://x.com/komunitasgsb", label: "Twitter" },
    { icon: Music, href: "https://open.spotify.com/show/5uoOFClrYGurElVUN0MKZM", label: "Spotify" },
    { icon: Video, href: "https://www.tiktok.com/@komunitasgsb", label: "TikTok" },
  ];

  return (
    <footer id="kontak" className="bg-[#1a1a1a] text-white">
      <div className="container mx-auto px-4 lg:px-6 py-6 md:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-6">
          <div className="col-span-2 lg:col-span-1 space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/home/logo-gsb.png" alt="GSB Logo" className="h-8 w-auto object-contain bg-white/10 rounded-lg p-0.5" width={32} height={32} />
              <span className="text-xl font-heading font-bold">GSB</span>
            </Link>
            <p className="text-gray-400 text-xs leading-relaxed">Gerakan Suka Baca — Bergerak berdampak untuk pendidikan setara Indonesia sejak 2016.</p>
            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 shrink-0" /><span>Depok & Bogor, Indonesia</span></div>
              <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 shrink-0" /><span>gerakansukabaca@gmail.com</span></div>
              <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" /><span>0851-5642-3290</span></div>
            </div>
          </div>

          <div className="col-span-2 lg:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-heading font-semibold text-sm mb-3">Link Cepat</h3>
              <ul className="space-y-1.5 text-xs">
                {[
                  { href: "/", label: "Beranda" },
                  { href: "/about", label: "Tentang Kami" },
                  { href: "/programs", label: "Program" },
                  { href: "/volunteer", label: "Relawan" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-gray-400 hover:text-gsb-tosca transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-sm mb-3">Program</h3>
              <ul className="space-y-1.5 text-xs">
                {[
                  { href: "/programs#minggu-cerdas", label: "Minggu Cerdas" },
                  { href: "/programs#lapak-baca", label: "Lapak Baca" },
                  { href: "/programs#beasiswa", label: "Beasiswa" },
                  { href: "/programs#careducation", label: "Careducation" },
                ].map((p) => (
                  <li key={p.label}>
                    <Link href={p.href} className="text-gray-400 hover:text-gsb-tosca transition-colors">{p.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-sm mb-3">Ikuti Kami</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {socialMedia.map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-gsb-tosca p-2 rounded-md transition-colors">
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <h4 className="font-heading font-semibold text-xs mb-2">Kolaborasi</h4>
            <a href="https://www.indorelawan.org/organization/5c07e2741c15322842719f0a" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <Image src="/footer/indorelawan.png" alt="Indorelawan" width={120} height={36} className="h-8 w-auto object-contain rounded-lg" unoptimized />
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-400">
          <p>© 2026 Gerakan Suka Baca. Hak Cipta Dilindungi.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-white transition-colors">Kebijakan Privasi</Link>
            <Link href="#" className="hover:text-white transition-colors">Syarat dan Ketentuan</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
