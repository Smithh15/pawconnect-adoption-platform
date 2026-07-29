import Link from 'next/link';
import { PawPrint } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex h-14 items-center border-b bg-background px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-base">
          <PawPrint className="h-5 w-5 text-primary" />
          PawConnect
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}
