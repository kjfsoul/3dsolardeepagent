export const metadata = {
  title: "3I/Atlas",
  description: "Live drops from four Printify outposts",
};

import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
