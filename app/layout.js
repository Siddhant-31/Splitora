import { Inter, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import Header from "@/components/header";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata = {
  title: "Splitora",
  description: "The smartest way to split expenses with friends",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logos/splitora-mark.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.className} ${bricolage.variable}`}>
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          appearance={{
            layout: {
              // hides the orange "Development mode" label in Clerk's popups
              unsafe_disableDevelopmentModeWarnings: true,
            },
            variables: { colorPrimary: "#5B4BDB" },
          }}
        >
          <ConvexClientProvider>
            <Header />
            <main className="min-h-screen">
              <Toaster richColors />

              {children}
            </main>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
