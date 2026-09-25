import type { Metadata, Viewport } from 'next';
import './globals.css';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.checkmycv.co.za';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b1120',
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'CheckMyCV - Free Instant Global ATS CV & Resume Diagnostic',
    template: '%s | CheckMyCV',
  },
  description:
    'Find out why your CV or resume is not landing interviews in under 10 seconds. Free instant global ATS score, international applicant benchmark, and actionable recruiter coaching for US, UK, EU, Africa and remote jobs.',
  keywords: [
    'Check My CV',
    'CheckMyCV',
    'ATS Resume Checker',
    'Global CV Scanner',
    'Workday ATS Test',
    'Greenhouse Resume Match',
    'Remote Job Application',
    'Free CV Audit Worldwide',
    'ATS Optimization Tool',
    'CV Score Calculator',
  ],
  authors: [{ name: 'CheckMyCV Engineering Team' }],
  creator: 'CheckMyCV',
  publisher: 'CheckMyCV',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'CheckMyCV',
    title: 'CheckMyCV - Free Instant Global ATS CV & Resume Diagnostic',
    description:
      'Find out why your CV or resume is not landing interviews in under 10 seconds. Free instant global ATS score and recruiter coaching.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'CheckMyCV - Free Instant Global ATS CV & Resume Diagnostic',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CheckMyCV - Free Instant Global ATS CV & Resume Diagnostic',
    description:
      'Find out why your CV or resume is not landing interviews in under 10 seconds. Free instant global ATS score and recruiter coaching.',
    images: ['/twitter-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('scoremycv_theme') || 'cream';
                  if (theme === 'cream') {
                    document.documentElement.setAttribute('data-theme', 'cream');
                    document.documentElement.classList.add('theme-cream');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[#0b1120] text-slate-100 min-h-screen w-full max-w-full overflow-x-hidden flex flex-col selection:bg-blue-600 selection:text-white antialiased transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
