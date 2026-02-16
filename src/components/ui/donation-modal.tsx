"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DonationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DonationModal({ isOpen, onClose }: DonationModalProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText("010");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] z-50 px-4 overflow-y-auto"
                    >
                        <div className="bg-background rounded-3xl overflow-hidden shadow-2xl border border-border relative my-4">
                            {/* Header dengan tombol back/close */}
                            <div className="sticky top-0 bg-background border-b border-border/50 px-4 py-3 flex items-center justify-between z-10">
                                <button
                                    onClick={onClose}
                                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    <span>Tutup</span>
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                                    aria-label="Tutup modal"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 max-h-[calc(90vh-80px)] overflow-y-auto">
                                {/* Left Column: QRIS Image */}
                                <div className="bg-white p-4 md:p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-border/50">
                                    <div className="relative w-full aspect-[3/4] max-w-[280px] md:max-w-[300px] shadow-lg rounded-xl overflow-hidden border border-border/50">
                                        <Image
                                            src="/home/qris.jpeg"
                                            alt="QRIS GSB"
                                            fill
                                            sizes="(max-width: 768px) 100vw, 300px"
                                            className="object-contain"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Instructions */}
                                <div className="p-4 md:p-8 lg:p-10 flex flex-col justify-center">
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-heading font-bold text-gsb-maroon mb-2">
                                            Terimakasih Orang Baik!
                                        </h3>
                                        <p className="text-muted-foreground">
                                            Setiap rupiah yang Anda donasikan sangat berarti bagi keberlangsungan pendidikan adik-adik kita.
                                        </p>
                                    </div>

                                    <div className="space-y-4 bg-muted/30 p-5 rounded-2xl border border-border/50">
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-gsb-orange/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-xs font-bold text-gsb-orange">1</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gsb-maroon text-sm mb-1">Kode Unik Donasi</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm text-muted-foreground">
                                                        Tambahkan kode <span className="font-bold text-gsb-orange">010</span>
                                                    </p>
                                                    <button
                                                        onClick={handleCopy}
                                                        className="p-1 hover:bg-muted rounded-md transition-colors"
                                                        title="Salin kode"
                                                    >
                                                        {copied ? (
                                                            <Check className="w-3 h-3 text-gsb-tosca" />
                                                        ) : (
                                                            <Copy className="w-3 h-3 text-muted-foreground" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-gsb-blue/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-xs font-bold text-gsb-blue">2</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gsb-maroon text-sm mb-1">Contoh Nominal</p>
                                                <div className="text-sm bg-background border border-border rounded-lg p-2 font-mono text-muted-foreground">
                                                    Rp 100.000 + 010 = <span className="font-bold text-gsb-maroon">Rp 100.010</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-border">
                                        <p className="text-center text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                                            Konfirmasi donasi Anda melalui WhatsApp
                                        </p>
                                        <Button
                                            className="w-full bg-gsb-green hover:bg-gsb-green/90 text-white font-bold rounded-full h-11 md:h-12 text-sm md:text-base"
                                            onClick={() => window.open('https://wa.me/6285156423290?text=Halo%20GSB%2C%20saya%20sudah%20melakukan%20donasi%20sebesar...', '_blank')}
                                        >
                                            Konfirmasi Donasi
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
