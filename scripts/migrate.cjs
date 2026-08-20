const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'client/src');
const appDir = path.join(__dirname, 'app');

if (!fs.existsSync(appDir)) {
  fs.mkdirSync(appDir, { recursive: true });
}

// Basic map of wouter paths to Next.js app router paths
const routes = {
  '/': 'home/Home.tsx',
  '/login': 'auth/Login.tsx',
  '/giris': 'auth/Login.tsx',
  '/hesap': 'auth/Login.tsx',
  '/kayit': 'auth/Login.tsx',
  '/kayitol': 'auth/Login.tsx',
  '/register': 'auth/Login.tsx',
  '/admin31': 'admin/AdminPage.tsx',
  '/dashboard': 'dashboard/Dashboard.tsx',
  '/dashboard/[id]': 'bio-builder/BioBuilder.tsx', // Needs param mapping
  '/builder/[id]': 'bio-builder/BioBuilder.tsx',
  '/shortener': 'tools/Shortener.tsx',
  '/qr': 'tools/QRGenerator.tsx',
  '/blog': 'marketing/Blog.tsx',
  '/blog/[slug]': 'marketing/BlogArticle.tsx',
  '/hakkimizda': 'marketing/About.tsx',
  '/about': 'marketing/About.tsx',
  '/contact': 'marketing/Contact.tsx',
  '/privacy': 'legal/Privacy.tsx',
  '/terms': 'legal/Terms.tsx',
  '/cookies': 'legal/CookiePolicy.tsx',
  '/cookie-policy': 'legal/CookiePolicy.tsx',
  '/kvkk': 'legal/Kvkk.tsx',
  '/yardim-merkezi': 'marketing/HelpCenter.tsx',
  '/yardim-merkezi/kategori/[slug]': 'marketing/HelpTopicPage.tsx',
  '/yardim-merkezi/[articleId]': 'marketing/HelpTopicPage.tsx',
  '/report': 'legal/PolicyPage.tsx',
  '/raporla': 'legal/PolicyPage.tsx',
  '/p/[slug]': 'public-bio/PublicBioPage.tsx',
  '/u/[username]': 'public-profile/PublicProfile.tsx',
};

// Create app router structure
for (const [routePath, componentPath] of Object.entries(routes)) {
  let nextPath = routePath === '/' ? '' : routePath;
  const dirPath = path.join(appDir, nextPath);
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Create page.tsx
  const pageContent = `'use client';\nimport PageComponent from '@/pages/${componentPath.replace('.tsx', '')}';\n\nexport default function Page(props: any) {\n  return <PageComponent {...props} />;\n}\n`;
  fs.writeFileSync(path.join(dirPath, 'page.tsx'), pageContent);
}

// Create layout.tsx
const layoutContent = `
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "@/index.css";

export const metadata = {
  title: "llinktr",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
`;
fs.writeFileSync(path.join(appDir, 'layout.tsx'), layoutContent);

console.log('App router scaffolding created.');
