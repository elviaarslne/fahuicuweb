import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fa Hui Cu Internal System",
  description: "Sistem internal Fa Hui Cu untuk anggota, kelas, acara, absensi, dan evaluasi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
