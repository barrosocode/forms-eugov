import { DM_Sans, Sora } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-public-display",
});

export default function PublicFormLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${dmSans.variable} ${sora.variable} min-h-screen bg-[#f4eddf] text-[#0a2342] [font-family:var(--font-public-sans),sans-serif]`}>
      {children}
    </div>
  );
}
