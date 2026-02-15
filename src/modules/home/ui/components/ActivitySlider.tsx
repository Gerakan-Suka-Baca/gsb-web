'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/fade-in';
import { Button } from '@/components/ui/button';
import { Play, Calendar, ArrowRight, Clock, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';

function formatDuration(ms: number): string {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}j ${minutes}m`;
    return `${minutes} menit`;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function ActivitySlider() {
    const trpc = useTRPC();
    const { data: podcastData } = useQuery(
        trpc.podcast.getLatestEpisode.queryOptions(undefined, {
            staleTime: 5 * 60 * 1000,
            retry: 1,
        })
    );

    const news = [
        {
            title: 'GSB Mengadakan Pelatihan Relawan Batch 12',
            date: '12 Oktober 2024',
            excerpt: 'Pelatihan intensif selama 3 hari untuk mempersiapkan relawan pengajar yang berkualitas.',
            image: '/uploads/thumb-news-1.png',
        },
        {
            title: 'Kolaborasi dengan Universitas Indonesia',
            date: '05 Oktober 2024',
            excerpt: 'Kerjasama strategis untuk pengembangan kurikulum dan program magang mahasiswa.',
            image: '/uploads/thumb-news-2.png',
        },
        {
            title: 'Pojok Baca Baru di Jakarta Timur',
            date: '28 September 2024',
            excerpt: 'Peresmian pojok baca baru untuk meningkatkan minat baca anak-anak di lingkungan sekitar.',
            image: '/uploads/thumb-news-1.png',
        },
    ];

    const podcastImage = podcastData?.images?.[0]?.url ?? '/uploads/thumb-podcast.png';
    const podcastTitle = podcastData?.name ?? 'MSG Podcast';
    const podcastDescription = podcastData?.description ?? 'Dongeng edukatif dari Gerakan Suka Baca.';
    const podcastDuration = podcastData ? formatDuration(podcastData.durationMs) : '';
    const podcastDate = podcastData ? formatDate(podcastData.releaseDate) : '';
    const podcastSpotifyUrl = podcastData?.spotifyUrl ?? 'https://open.spotify.com/show/5uoOFClrYGurElVUN0MKZM';

    return (
        <section className="py-16 md:py-24 bg-muted/50 overflow-hidden">
            <div className="container mx-auto px-4 lg:px-6">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 text-responsive-maroon">
                        Aktivitas <span className="text-gsb-orange">GSB</span>
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Ikuti perkembangan terbaru dan cerita inspiratif dari gerakan kami
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Column 1: Cerita Suba (News) */}
                    <FadeIn direction="right" delay={0.2}>
                        <div className="space-y-6 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-2xl font-heading font-bold text-responsive-maroon flex items-center gap-2">
                                    <span className="w-2 h-8 bg-gsb-orange rounded-full" />
                                    Cerita <span className="text-gsb-orange">SUBA</span>
                                </h3>
                                <Button variant="ghost" className="text-gsb-orange hover:text-gsb-orange/80">
                                    Lihat Semua <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                            <div className="space-y-4 flex-1 overflow-y-auto pr-2 max-h-125 scrollbar-thin scrollbar-thumb-gsb-orange/20 scrollbar-track-transparent">
                                {news.map((item, index) => (
                                    <Card key={index} className="hover:shadow-md transition-shadow border-none bg-card/50 hover:bg-card overflow-hidden group">
                                        <div className="flex flex-row h-full">
                                            <div className="w-1/3 relative overflow-hidden">
                                                <Image
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    fill
                                                />
                                            </div>
                                            <div className="w-2/3 p-4 flex flex-col justify-center">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{item.date}</span>
                                                </div>
                                                <h4 className="text-base md:text-lg font-heading font-bold text-foreground group-hover:text-gsb-orange transition-colors line-clamp-2 mb-2">
                                                    {item.title}
                                                </h4>
                                                <p className="text-muted-foreground text-xs md:text-sm line-clamp-2">
                                                    {item.excerpt}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </FadeIn>

                    {/* Column 2: Podcast SUBA */}
                    <FadeIn direction="left" delay={0.4}>
                        <div className="h-full flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-heading font-bold text-responsive-maroon flex items-center gap-2">
                                    <span className="w-2 h-8 bg-gsb-blue rounded-full" />
                                    Podcast <span className="text-gsb-orange">SUBA</span>
                                </h3>
                            </div>
                            <Card className="flex-1 bg-linear-to-br from-gsb-maroon to-gsb-red text-white border-none overflow-hidden relative group min-h-100">
                                <div className="absolute inset-0 z-0">
                                    {podcastData?.images?.[0] ? (
                                        <Image
                                            src={podcastImage}
                                            alt={podcastTitle}
                                            className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-500 scale-105 group-hover:scale-100"
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 50vw"
                                            unoptimized
                                        />
                                    ) : (
                                        <Image
                                            src="/uploads/thumb-podcast.png"
                                            alt={podcastTitle}
                                            className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-500 scale-105 group-hover:scale-100"
                                            fill
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-linear-to-t from-gsb-maroon via-gsb-maroon/80 to-transparent" />
                                </div>

                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 z-0" />

                                <CardContent className="h-full flex flex-col justify-end items-center text-center p-8 relative z-10">
                                    <div className="mb-auto mt-8">
                                        <Link
                                            href={podcastSpotifyUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 cursor-pointer mx-auto shadow-xl ring-4 ring-white/10">
                                                <Play className="h-10 w-10 text-white fill-current ml-1" />
                                            </div>
                                        </Link>
                                    </div>

                                    <div className="space-y-3 mb-8 w-full">
                                        <span className="inline-block px-4 py-1.5 bg-gsb-yellow text-gsb-maroon text-xs font-bold rounded-full uppercase tracking-wider shadow-sm">
                                            Episode Terbaru
                                        </span>
                                        <h4 className="text-2xl md:text-4xl font-heading font-bold leading-tight drop-shadow-md">
                                            {podcastTitle}
                                        </h4>
                                        {podcastData && (
                                            <div className="flex items-center justify-center gap-4 text-white/80 text-sm">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {podcastDate}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {podcastDuration}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-white/80 text-sm max-w-md mx-auto mb-8 line-clamp-2">
                                        {podcastDescription}
                                    </p>

                                    <Button
                                        className="bg-white text-gsb-maroon hover:bg-gsb-yellow hover:text-gsb-maroon font-bold rounded-full px-10 py-6 text-lg shadow-lg transition-all hover:scale-105 w-full md:w-auto gap-2"
                                        asChild
                                    >
                                        <Link
                                            href={podcastSpotifyUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Dengarkan Sekarang
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
}
