import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ExamNavbarProvider } from '@/components/layout/exam-navbar-context';

export default function HomeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ExamNavbarProvider>
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
            </div>
        </ExamNavbarProvider>
    );
}
