import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'CheckMyCV - Free Instant Global ATS CV & Resume Diagnostic';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Background grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(99, 102, 241, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.07) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Glow blobs */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -100,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(79, 70, 229, 0.2) 0%, transparent 70%)',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
            padding: '64px 80px',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* Logo + brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}>
            {/* Logo mark */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                fontWeight: 900,
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              C
            </div>
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.5px',
              }}
            >
              CheckMyCV
            </span>

            {/* Free badge */}
            <div
              style={{
                marginLeft: 8,
                padding: '6px 14px',
                borderRadius: 100,
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                fontSize: 14,
                fontWeight: 600,
                color: '#a5b4fc',
                letterSpacing: '0.5px',
              }}
            >
              FREE
            </div>
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.1,
              letterSpacing: '-2px',
              marginBottom: 24,
              maxWidth: 820,
            }}
          >
            Instant ATS Score
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #818cf8, #6366f1)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              for Any CV or Résumé
            </span>
          </div>

          {/* Subline */}
          <div
            style={{
              fontSize: 22,
              fontWeight: 400,
              color: '#94a3b8',
              lineHeight: 1.5,
              maxWidth: 680,
              marginBottom: 48,
            }}
          >
            Find out why your CV isn't landing interviews — in under 10 seconds. Global ATS
            benchmark for US, UK, EU, Africa &amp; remote jobs.
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 48 }}>
            {[
              { value: '10s', label: 'Instant analysis' },
              { value: '95%', label: 'ATS accuracy' },
              { value: '50+', label: 'Countries covered' },
            ].map((stat) => (
              <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: '#818cf8',
                    letterSpacing: '-1px',
                  }}
                >
                  {stat.value}
                </span>
                <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side: mock score card */}
        <div
          style={{
            position: 'absolute',
            right: 64,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 260,
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 20,
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Score circle */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                background: 'conic-gradient(#6366f1 0deg, #6366f1 270deg, rgba(99,102,241,0.15) 270deg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  background: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                }}
              >
                <span style={{ fontSize: 22, fontWeight: 900, color: '#ffffff' }}>78</span>
              </div>
            </div>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>ATS Score</span>
          </div>

          {/* Score bars */}
          {[
            { label: 'Keywords', pct: 85, color: '#22c55e' },
            { label: 'Format', pct: 72, color: '#6366f1' },
            { label: 'Impact', pct: 60, color: '#f59e0b' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: '#94a3b8',
                }}
              >
                <span>{item.label}</span>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{item.pct}%</span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${item.pct}%`,
                    borderRadius: 3,
                    background: item.color,
                  }}
                />
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: 4,
              padding: '8px 12px',
              borderRadius: 10,
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              fontSize: 11,
              color: '#a5b4fc',
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            ✓ No sign-up required
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
