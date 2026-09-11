import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://splat-walk.vercel.app"),
  title: "Splat Walk | A captured world, up close",
  description: "Explore a cave lion scan with native three.js WebGPU Gaussian splats. Move freely and discover three details.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Splat Walk | A captured world, up close",
    description: "Explore a cave lion scan with native three.js WebGPU Gaussian splats. Move freely and discover three details.",
    url: "/",
    siteName: "Splat Walk",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "The cave lion scan inside the Splat Walk exhibition viewer" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Splat Walk | A captured world, up close",
    description: "Explore a cave lion scan with native three.js WebGPU Gaussian splats. Move freely and discover three details.",
    images: ["/og.png"],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/apple-icon.png",
  },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#111411" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
