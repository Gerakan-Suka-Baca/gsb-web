'use client'

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { flushSync } from "react-dom"
import { motion, AnimatePresence, type Variants, type Easing } from "framer-motion"
import {
  Menu, Info, Target, Briefcase, Users, Smile, RefreshCw, BookOpen, Mic, Heart,
  Download, GraduationCap, Library, MessageCircle, Map, HeartHandshake,
  ShoppingBag, School, Building, Handshake, Gift, Sun, Moon, ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { UserMenu } from "./UserMenu"

// Types
interface MenuItem {
  title: string
  url: string
  description?: string
  icon?: React.ReactNode
  items?: MenuItem[]
}

const icons = { Info, Target, Briefcase, Users, Smile, RefreshCw, BookOpen, Mic, Heart, Download, GraduationCap, Library, MessageCircle, Map, HeartHandshake, ShoppingBag, School, Building, Handshake, Gift }
const I = (name: keyof typeof icons) => { const Icon = icons[name]; return <Icon className="size-5 shrink-0" /> }

const menuItems: MenuItem[] = [
  {
    title: "Kenali GSB", url: "#",
    items: [
      { title: "Tentang GSB", description: "Visi, misi, dan budaya kami.", icon: I("Info"), url: "/about" },
      { title: "Portofolio Komunitas", description: "Jejak langkah dan dampak kami.", icon: I("Briefcase"), url: "/about/portfolio" },
      { title: "Tim GSB", description: "Orang-orang di balik layar.", icon: I("Users"), url: "/about/team" },
    ],
  },
  {
    title: "Kenali Suba", url: "#",
    items: [
      { title: "Tentang Suba", description: "Maskot kebanggaan kami.", icon: I("Smile"), url: "/about/suba-story" },
      { title: "Transformasi Suba", description: "Evolusi karakter Suba.", icon: I("RefreshCw"), url: "/about/suba-evolution" },
      { title: "Cerita Suba", description: "Kisah petualangan Suba.", icon: I("BookOpen"), url: "/about/suba-story" },
      { title: "Suara Suba", description: "Podcast dan cerita audio.", icon: I("Mic"), url: "/programs/podcast" },
      { title: "Teman Suba", description: "Komunitas sahabat Suba.", icon: I("Heart"), url: "/volunteer" },
      { title: "Unduh Modul Belajar", description: "Materi belajar gratis.", icon: I("Download"), url: "/programs/modul" },
    ],
  },
  {
    title: "Kenali Program", url: "#",
    items: [
      { title: "Minggu Cerdas", description: "Belajar rutin setiap minggu.", icon: I("BookOpen"), url: "/programs/minggu-cerdas" },
      { title: "Beasiswa Minggu Cerdas", description: "Dukungan pendidikan siswa.", icon: I("GraduationCap"), url: "/programs/beasiswa" },
      { title: "Lapak Baca", description: "Perpustakaan keliling.", icon: I("Library"), url: "/programs/lapak-baca" },
      { title: "Ngobrolin Buku", description: "Diskusi buku menarik.", icon: I("MessageCircle"), url: "/programs/ngobrolin-buku" },
      { title: "Wisata Edukasi", description: "Belajar sambil berpetualang.", icon: I("Map"), url: "/programs/wisata-edukasi" },
      { title: "MSG Podcast", description: "Inspirasi lewat suara.", icon: I("Mic"), url: "/programs/podcast" },
      { title: "Careducation Movement", description: "Gerakan peduli pendidikan.", icon: I("HeartHandshake"), url: "/programs/careducation" },
    ],
  },
  {
    title: "Mari Berdampak", url: "#",
    items: [
      { title: "Merch petualangan Suba", description: "Dukung kami dengan membeli merch.", icon: I("ShoppingBag"), url: "/volunteer/merch" },
      { title: "Kolaborasi Sekolah", description: "Kerjasama dengan sekolah.", icon: I("School"), url: "/volunteer/kolaborasi" },
      { title: "Kolaborasi Kampus", description: "Sinergi dengan mahasiswa.", icon: I("Building"), url: "/volunteer/kolaborasi" },
      { title: "Kolaborasi CSR", description: "Partnership perusahaan.", icon: I("Handshake"), url: "/volunteer/kolaborasi" },
      { title: "Kakak Donatur", description: "Menjadi orang tua asuh.", icon: I("Heart"), url: "/volunteer/kakak-donatur" },
      { title: "Donasi Publik", description: "Dukungan untuk pendidikan.", icon: I("Gift"), url: "/volunteer/donasi" },
    ],
  },
  { title: "Learning Path", url: "/learning-path" },
]

const ease: Easing = [0.0, 0.0, 0.2, 1]
const easeIn: Easing = [0.4, 0.0, 1, 1]

const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease } },
  exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15, ease: easeIn } }
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
}

const itemVariants: Variants = {
  hidden: { x: 20, opacity: 0 },
  show: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } }
}

// Sub Components
const SubMenuLink = ({ item, onClick }: { item: MenuItem; onClick?: () => void }) => (
  <Link
    href={item.url}
    onClick={onClick}
    className="flex select-none gap-3 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
  >
    <div className="text-gsb-orange mt-1">{item.icon}</div>
    <div>
      <div className="text-sm font-semibold text-foreground">{item.title}</div>
      {item.description && <p className="text-xs leading-snug text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
    </div>
  </Link>
)

const MobileMenuItem = ({ item, onClose }: { item: MenuItem; onClose: () => void }) => {
  if (!item.items) {
    return (
      <motion.div variants={itemVariants}>
        <Link href={item.url} onClick={onClose} className="text-lg font-heading font-bold text-gsb-orange py-4 block border-b border-border/30">
          {item.title}
        </Link>
      </motion.div>
    )
  }
  return (
    <motion.div variants={itemVariants}>
      <AccordionItem value={item.title} className="border-b border-border/30">
        <AccordionTrigger className="text-lg font-heading font-bold text-gsb-orange hover:no-underline hover:text-gsb-orange/80 py-4">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="pb-2">
          <div className="flex flex-col gap-2 pl-2">
            {item.items.map((sub) => <SubMenuLink key={sub.title} item={sub} onClick={onClose} />)}
          </div>
        </AccordionContent>
      </AccordionItem>
    </motion.div>
  )
}

// Main Component
export function Navbar() {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  const { theme, setTheme } = useTheme()

  React.useEffect(() => {
    setMounted(true)
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    if (!document.startViewTransition) { setTheme(next); return }
    document.startViewTransition(() => flushSync(() => setTheme(next)))
  }

  const closeMenu = () => setIsOpen(false)

  const ThemeButton = () => mounted && (
    <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full hover:bg-muted transition-colors" aria-label="Toggle theme">
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full border-b border-transparent transition-all duration-300",
        isScrolled ? "bg-background/95 backdrop-blur-md border-border/40 shadow-sm" : "bg-background"
      )}
      onMouseLeave={() => setActiveMenu(null)}
    >
      <div className="container flex h-20 items-center px-4 md:px-6">
        {/* Logo + Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center shrink-0 gap-2">
            <Image src="/home/logo-gsb.png" alt="GSB Logo" width={120} height={48} className="h-12 w-auto object-contain" />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden xl:flex items-center gap-1">
            {menuItems.map((item) =>
              item.items ? (
                <div key={item.title} className="relative" onMouseEnter={() => setActiveMenu(item.title)}>
                  <button
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center gap-1.5 rounded-md px-4 py-2",
                      "text-sm font-medium text-foreground/80 transition-colors",
                      "hover:bg-gsb-yellow/10 hover:text-gsb-orange",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-gsb-orange focus-visible:ring-offset-2",
                      activeMenu === item.title && "bg-gsb-yellow/10 text-gsb-orange"
                    )}
                  >
                    {item.title}
                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", activeMenu === item.title && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {activeMenu === item.title && (
                      <motion.div variants={dropdownVariants} initial="hidden" animate="visible" exit="exit" className="absolute left-0 top-full pt-2 z-[100]">
                        <div className="rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg">
                          <ul className="grid w-[400px] gap-3 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                            {item.items.map((sub) => (
                              <li key={sub.title}>
                                <SubMenuLink item={sub} onClick={() => setActiveMenu(null)} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={item.title}
                  href={item.url}
                  className={cn(
                    "inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2",
                    "text-sm font-medium text-foreground/80 transition-colors",
                    "hover:bg-gsb-yellow/10 hover:text-gsb-orange",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-gsb-orange focus-visible:ring-offset-2"
                  )}
                  onMouseEnter={() => setActiveMenu(null)}
                >
                  {item.title}
                </Link>
              )
            )}
          </div>
        </div>

        <div className="flex-1" />

        {/* Desktop CTA */}
        <div className="hidden xl:flex items-center gap-4">
          <Button asChild className="bg-gsb-orange hover:bg-gsb-orange/90 text-white font-semibold rounded-full px-6 shadow-md transition-all hover:scale-105">
            <Link href="https://www.indorelawan.org/organization/5c07e2741c15322842719f0a" target="_blank" rel="noopener noreferrer">Jadi Relawan</Link>
          </Button>
          <UserMenu />
          <ThemeButton />
        </div>

        {/* Mobile Menu */}
        <div className="flex xl:hidden items-center gap-2">
          <ThemeButton />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Toggle menu"><Menu className="h-6 w-6" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="overflow-y-auto w-[320px] sm:w-[400px] p-6">
              <SheetHeader className="mb-8 text-left pt-2">
                <SheetTitle><Image src="/home/logo-gsb.png" alt="GSB Logo" width={120} height={48} className="h-12 w-auto object-contain" /></SheetTitle>
              </SheetHeader>

              <motion.div className="flex flex-col gap-8" variants={containerVariants} initial="hidden" animate="show">
                <Accordion type="single" collapsible className="flex w-full flex-col gap-3">
                  {menuItems.map((item) => <MobileMenuItem key={item.title} item={item} onClose={closeMenu} />)}
                </Accordion>

                <motion.div className="flex flex-col gap-4 mt-6 pt-4 border-t border-border/50" variants={itemVariants}>
                  <Button asChild className="w-full bg-gsb-orange hover:bg-gsb-orange/90 text-white font-semibold rounded-full h-14 text-lg shadow-md">
                    <Link href="https://www.indorelawan.org/organization/5c07e2741c15322842719f0a" target="_blank" rel="noopener noreferrer" onClick={closeMenu}>Jadi Relawan</Link>
                  </Button>
                  <UserMenu mobile onClose={closeMenu} />
                </motion.div>
              </motion.div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}