"use client";

import Link from "next/link";
import {
  Mail,
  MapPin,
  Phone,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react";
import Image from "next/image";

export function Footer() {
  const quickLinks = [
    { href: "#beranda", label: "Beranda" },
    { href: "#tentang", label: "Tentang Kami" },
    { href: "#program", label: "Program" },
    { href: "#penghargaan", label: "Penghargaan" },
  ];

  const programs = [
    { href: "#", label: "Minggu Cerdas" },
    { href: "#", label: "Lapak Baca" },
    { href: "#", label: "Beasiswa" },
    { href: "#", label: "Proyek Berdampak" },
  ];

  const socialMedia = [
    { icon: Instagram, href: "https://www.instagram.com/komunitasgsb/", label: "Instagram" },
    { icon: Linkedin, href: "https://www.linkedin.com/in/komunitas-gerakan-suka-baca-403605248/", label: "LinkedIn" },
    { icon: Youtube, href: "https://www.youtube.com/c/GerakanSukaBaca", label: "YouTube" },
  ];

  return (
    <footer id="kontak" className="bg-[#1a1a1a] text-white">
      <div className="container mx-auto px-4 lg:px-6 py-8 md:py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-8">

          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/home/logo-gsb.png"
                alt="GSB Logo"
                className="h-10 w-auto object-contain bg-white/10 rounded-lg p-1"
                width={40}
                height={40}
              />
              <span className="text-2xl font-heading font-bold text-white">GSB - Gerakan Suka Baca</span>
            </Link>

            <p className="text-gray-400 text-sm leading-relaxed">
              Gerakan Suka Baca - Bergerak berdampak untuk pendidikan setara
              Indonesia sejak 2016.
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin className="h-4 w-4 mt-1 shrink-0" />
                <span>Jakarta, Indonesia</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="h-4 w-4 shrink-0" />
                <span>info@gsb.or.id</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="h-4 w-4 shrink-0" />
                <span>+62 812-3456-7890</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-lg mb-4 text-white">
              Link Cepat
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-gsb-tosca transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-lg mb-4 text-white">
              Program Kami
            </h3>
            <ul className="space-y-2">
              {programs.map((program) => (
                <li key={program.label}>
                  <Link
                    href={program.href}
                    className="text-gray-400 hover:text-gsb-tosca transition-colors text-sm"
                  >
                    {program.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-lg mb-4 text-white">
              Ikuti Kami
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Tetap terhubung dengan gerakan kami di media sosial
            </p>

            <div className="flex gap-3">
              {socialMedia.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-gsb-tosca p-2.5 rounded-lg transition-colors text-white"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>© 2025 Gerakan Suka Baca. Hak Cipta Dilindungi.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">
                Kebijakan Privasi
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Syarat dan Ketentuan
              </Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
