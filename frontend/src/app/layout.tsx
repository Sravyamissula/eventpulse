import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EventPulse | AI-Powered Distributed Webhook & Observability Engine",
  description: "Enterprise-grade distributed webhook delivery, idempotency, retries, circuit breakers, and AI failure diagnostics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
