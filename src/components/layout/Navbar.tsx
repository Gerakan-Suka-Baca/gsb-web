"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";
import { motion } from "framer-motion";
import {
  Menu,
  Info,
  Target,
  Briefcase,
  Users,
  Smile,
  RefreshCw,
  BookOpen,
  Mic,
  Heart,
  Download,
  GraduationCap,
  Library,
  MessageCircle,
  Map,
  HeartHandshake,
  ShoppingBag,
  School,
  Building,
  Handshake,
  Gift,
  Code,
  Database,
  User,
  PenTool,
  Sun,
  Moon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems: MenuItem[] = [
    {
      title: "Kenali GSB",
      url: "#",
      items: [
        {
          title: "Tentang kami",
          description: "Siapa kami dan apa visi kami.",
          icon: <Info className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Makna dan Tujuan",
          description: "Filosofi di balik gerakan kami.",
          icon: <Target className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Portofolio Komunitas",
          description: "Jejak langkah dan dampak kami.",
          icon: <Briefcase className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Tim Inti dan Pengurus",
          description: "Orang-orang di balik layar.",
          icon: <Users className="size-5 shrink-0" />,
          url: "#",
        },
      ],
    },
    {
      title: "Kenali Suba",
      url: "#",
      items: [
        {
          title: "Tentang Suba",
          description: "Maskot kebanggaan kami.",
          icon: <Smile className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Transformasi Suba",
          description: "Evolusi karakter Suba.",
          icon: <RefreshCw className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Cerita Suba",
          description: "Kisah petualangan Suba.",
          icon: <BookOpen className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Suara Suba",
          description: "Podcast dan cerita audio.",
          icon: <Mic className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Teman Suba",
          description: "Komunitas sahabat Suba.",
          icon: <Heart className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Unduh Modul Belajar",
          description: "Materi belajar gratis.",
          icon: <Download className="size-5 shrink-0" />,
          url: "#",
        },
      ],
    },
    {
      title: "Kenali Program",
      url: "#",
      items: [
        {
          title: "Minggu Cerdas",
          description: "Belajar rutin setiap minggu.",
          icon: <BookOpen className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Beasiswa Minggu Cerdas",
          description: "Dukungan pendidikan siswa.",
          icon: <GraduationCap className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Lapak Baca",
          description: "Perpustakaan keliling.",
          icon: <Library className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Ngobrolin Buku",
          description: "Diskusi buku menarik.",
          icon: <MessageCircle className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Wisata Edukasi",
          description: "Belajar sambil berpetualang.",
          icon: <Map className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "MSG Podcast",
          description: "Inspirasi lewat suara.",
          icon: <Mic className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Careducation Movement",
          description: "Gerakan peduli pendidikan.",
          icon: <HeartHandshake className="size-5 shrink-0" />,
          url: "#",
        },
      ],
    },
    {
      title: "Mari Berdampak",
      url: "#",
      items: [
        {
          title: "Merch petualangan Suba",
          description: "Dukung kami dengan membeli merch.",
          icon: <ShoppingBag className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Kolaborasi Sekolah",
          description: "Kerjasama dengan sekolah.",
          icon: <School className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Kolaborasi Kampus",
          description: "Sinergi dengan mahasiswa.",
          icon: <Building className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Kolaborasi CSR",
          description: "Partnership perusahaan.",
          icon: <Handshake className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Kakak Donatur",
          description: "Menjadi orang tua asuh.",
          icon: <Heart className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Donasi Publik",
          description: "Dukungan untuk pendidikan.",
          icon: <Gift className="size-5 shrink-0" />,
          url: "#",
        },
      ],
    },
    {
      title: "Produk",
      url: "#",
      items: [
        {
          title: "Kelas FrontEnd",
          description: "Belajar web development.",
          icon: <Code className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Kelas Data Science",
          description: "Analisis data modern.",
          icon: <Database className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Kelas Self Development",
          description: "Pengembangan diri.",
          icon: <User className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Tryout UTBK",
          description: "Persiapan masuk kampus.",
          icon: <PenTool className="size-5 shrink-0" />,
          url: "#",
        },
      ],
    },
  ];

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme);
      });
    });
  };

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { x: 20, opacity: 0 },
    show: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  } as const;

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full border-b border-transparent transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-border/40 shadow-sm"
          : "bg-background",
      )}
    >
      <div className="flex w-full h-20 items-center justify-between lg:justify-start px-4 md:px-6">
        <Link href="/" className="flex items-center shrink-0 gap-2">
          <Image
            src="/home/logo-gsb.png"
            alt="GSB Logo"
            className="h-12 w-auto object-contain"
            width={100}
            height={100}
          />
        </Link>
        
        <div className="hidden lg:flex w-full justify-between items-center px-4">
          <div className="hidden lg:flex items-center px-4">
            <NavigationMenu>
              <NavigationMenuList>
                {menuItems.map((item) => renderMenuItem(item))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
  
          <div className="hidden lg:flex items-center gap-4">
            <Button
              asChild
              className="bg-gsb-orange hover:bg-gsb-orange/90 text-white font-semibold rounded-full px-6 shadow-md transition-all hover:scale-105"
            >
              <Link
                href="https://www.indorelawan.org/organization/5c07e2741c15322842719f0a"
                target="_blank"
                rel="noopener noreferrer"
              >
                Jadi Relawan
              </Link>
            </Button>
  
            <Button
              variant="outline"
              className="border-2 border-gsb-blue text-gsb-blue hover:bg-gsb-blue hover:text-white font-semibold rounded-full px-6 transition-all hover:scale-105"
            >
              Masuk
            </Button>
  
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full hover:bg-muted transition-colors"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="flex lg:hidden items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full hover:bg-muted transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="overflow-y-auto w-75 sm:w-100"
            >
              <SheetHeader className="mb-6 text-left">
                <SheetTitle>
                  <Image
                    src="/home/logo-gsb.png"
                    alt="GSB Logo"
                    className="h-10 w-auto object-contain"
                    width={100}
                    height={100}
                  />
                </SheetTitle>
              </SheetHeader>

              <motion.div
                className="flex flex-col gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <Accordion
                  type="single"
                  collapsible
                  className="flex w-full flex-col gap-2"
                >
                  {menuItems.map((item) =>
                    renderMobileMenuItem(item, itemVariants),
                  )}
                </Accordion>

                <motion.div
                  className="flex flex-col gap-3 mt-4 mx-4"
                  variants={itemVariants}
                >
                  <Button
                    asChild
                    className="w-full bg-gsb-orange hover:bg-gsb-orange/90 text-white font-semibold rounded-full h-12 text-lg"
                  >
                    <Link
                      href="https://www.indorelawan.org/organization/5c07e2741c15322842719f0a"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Jadi Relawan
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-gsb-blue text-gsb-blue font-semibold rounded-full h-12 text-lg"
                  >
                    Masuk
                  </Button>
                </motion.div>
              </motion.div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

const renderMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger className="bg-transparent hover:bg-gsb-yellow/10 text-foreground/80 hover:text-gsb-orange font-medium data-[state=open]:bg-gsb-yellow/10 data-[state=open]:text-gsb-orange transition-colors duration-200">
          {item.title}
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid w-100 gap-3 p-4 md:w-125 md:grid-cols-2 lg:w-150">
            {item.items.map((subItem) => (
              <li key={subItem.title}>
                <NavigationMenuLink asChild>
                  <SubMenuLink item={subItem} />
                </NavigationMenuLink>
              </li>
            ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink
        asChild
        className="bg-transparent hover:bg-gsb-yellow/10 text-foreground/80 hover:text-gsb-orange font-medium transition-colors duration-200 h-10 items-center justify-center rounded-md px-4 py-2"
      >
        <Link href={item.url}>{item.title}</Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderMobileMenuItem = (item: MenuItem, variants: any) => {
  if (item.items) {
    return (
      <motion.div variants={variants} key={item.title}>
        <AccordionItem value={item.title} className="border-b-0">
          <AccordionTrigger className="text-lg font-heading font-bold text-gsb-orange hover:no-underline hover:text-gsb-orange/80 py-3 px-4">
            {item.title}
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="flex flex-col gap-2 pl-2">
              {item.items.map((subItem) => (
                <SubMenuLink key={subItem.title} item={subItem} mobile />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </motion.div>
    );
  }

  return (
    <motion.div variants={variants} key={item.title}>
      <Link
        href={item.url}
        className="text-lg font-heading font-bold text-gsb-orange py-3 block"
      >
        {item.title}
      </Link>
    </motion.div>
  );
};

const SubMenuLink = ({
  item,
  mobile = false,
}: {
  item: MenuItem;
  mobile?: boolean;
}) => {
  return (
    <Link
      className={cn(
        "flex select-none gap-3 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        mobile ? "w-full" : "h-full",
      )}
      href={item.url}
    >
      <div className="text-gsb-orange mt-1">{item.icon}</div>
      <div>
        <div className="text-sm font-semibold text-foreground">
          {item.title}
        </div>
        {item.description && (
          <p className="text-xs leading-snug text-muted-foreground mt-1 line-clamp-2">
            {item.description}
          </p>
        )}
      </div>
    </Link>
  );
};
