import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Post Grid",
    template: "%s · Post Grid",
  },
  description: "Social media workspace for approving and producing creative pieces.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${dmSans.variable} ${manrope.variable} h-full`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var raw=localStorage.getItem("postgrid-theme");var saved=raw?JSON.parse(raw):null;document.documentElement.dataset.theme=saved&&saved.theme==="light"?"light":"dark";if(saved&&saved.vars){for(var key in saved.vars)document.documentElement.style.setProperty(key,saved.vars[key])}}catch(e){document.documentElement.dataset.theme="dark"}',
          }}
        />
        {children}
      </body>
    </html>
  );
}
