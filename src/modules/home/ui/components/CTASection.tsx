'use client';


import * as React from 'react';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/fade-in';
import { DonationModal } from '@/components/ui/donation-modal';

export function CTASection() {
    const [isDonationModalOpen, setIsDonationModalOpen] = React.useState(false);

    return (
        <section className="pb-20 md:pb-32 px-4 lg:px-6">
            <div className="container mx-auto">
                <FadeIn delay={0.4} direction="up">
                    <div className="rounded-xl bg-background dark:bg-card shadow-2xl border-t-4 border-gsb-orange dark:border-gsb-orange overflow-hidden relative transition-colors duration-300">
                        <div className="p-8 md:p-12 text-center relative z-10">
                            <h3 className="text-2xl md:text-3xl font-heading font-bold text-gsb-maroon dark:text-white mb-4">
                                Mari Bergabung dalam Gerakan Ini
                            </h3>

                            <p className="text-muted-foreground dark:text-muted-foreground max-w-2xl mx-auto mb-8 font-medium text-lg">
                                Setiap kontribusi Anda, baik sebagai relawan maupun donatur, membawa
                                perubahan nyata untuk pendidikan Indonesia
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button className="bg-gsb-orange hover:bg-gsb-orange/90 text-white font-bold rounded-full px-8 py-6 text-lg shadow-lg hover:scale-105 transition-transform border-0">
                                    Jadi Relawan
                                </Button>

                                <Button
                                    onClick={() => setIsDonationModalOpen(true)}
                                    className="bg-transparent hover:bg-gsb-orange/5 text-gsb-orange border-2 border-gsb-orange font-bold rounded-full px-8 py-6 text-lg shadow-sm hover:scale-105 transition-transform dark:text-white dark:border-white dark:hover:bg-white/10"
                                >
                                    Donasi Sekarang
                                </Button>
                            </div>
                        </div>

                        <div className="absolute top-0 left-0 w-32 h-32 bg-gsb-orange/10 dark:bg-gsb-orange/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
                        <div className="absolute bottom-0 right-0 w-48 h-48 bg-gsb-yellow/20 dark:bg-gsb-yellow/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
                    </div>
                </FadeIn>
            </div>

            <DonationModal
                isOpen={isDonationModalOpen}
                onClose={() => setIsDonationModalOpen(false)}
            />
        </section>
    );
}

