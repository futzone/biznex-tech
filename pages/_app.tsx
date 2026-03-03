import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState, type ReactNode } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const publicPages = ["/login"];

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user && !publicPages.includes(router.pathname)) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!user && !publicPages.includes(router.pathname)) {
    return null;
  }

  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isPublicPage = publicPages.includes(router.pathname);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGuard>
          {isPublicPage ? (
            <Component {...pageProps} />
          ) : (
            <DashboardLayout>
              <Component {...pageProps} />
            </DashboardLayout>
          )}
        </AuthGuard>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
