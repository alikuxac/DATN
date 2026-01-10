import "./globals.css";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import AppProviders from "@/components/providers/AppProviders";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
