import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'CheckMyCV - Free Instant Global ATS CV & Resume Diagnostic';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Twitter uses the same image — re-export from the OG image module
export { default } from './opengraph-image';
