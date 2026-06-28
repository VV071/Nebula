export default function LoadingSpinner() {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: '#060609' }}
    >
      {/* Background orbs */}
      <div
        className="absolute"
        style={{
          top: '20%', left: '20%',
          width: '400px', height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 8s ease-in-out infinite',
        }}
      />
      <div
        className="absolute"
        style={{
          bottom: '20%', right: '20%',
          width: '300px', height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 10s ease-in-out infinite 2s',
        }}
      />

      <div className="flex flex-col items-center gap-8 relative z-10">

        {/* Nebula orbital spinner */}
        <div className="relative w-24 h-24">

          {/* Outer ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: '1px solid rgba(99,102,241,0.15)',
              animation: 'spin 8s linear infinite reverse',
            }}
          />

          {/* Middle ring */}
          <div
            className="absolute inset-3 rounded-full"
            style={{
              border: '1.5px dashed rgba(129,140,248,0.25)',
              animation: 'spin 5s linear infinite',
            }}
          />

          {/* Inner ring (solid) */}
          <div
            className="absolute inset-6 rounded-full"
            style={{
              border: '2px solid rgba(99,102,241,0.4)',
              borderTopColor: '#6366F1',
              borderRightColor: 'rgba(139,92,246,0.6)',
              animation: 'spin 1.4s cubic-bezier(0.5, 0, 0.5, 1) infinite',
              boxShadow: '0 0 20px rgba(99,102,241,0.3)',
            }}
          />

          {/* Center orb */}
          <div
            className="absolute inset-0 flex items-center justify-center"
          >
            <div
              className="w-4 h-4 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                boxShadow: '0 0 16px rgba(99,102,241,0.6), 0 0 32px rgba(99,102,241,0.3)',
                animation: 'breathe 2s ease-in-out infinite',
              }}
            />
          </div>

          {/* Orbiting dot 1 */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ animation: 'orbit 3s linear infinite' }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: '#818CF8',
                boxShadow: '0 0 8px rgba(129,140,248,0.8)',
              }}
            />
          </div>

          {/* Orbiting dot 2 */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ animation: 'orbit 5s linear infinite 1.5s' }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: '#34D399',
                boxShadow: '0 0 6px rgba(52,211,153,0.8)',
              }}
            />
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-2">
          <p
            className="text-sm font-semibold uppercase tracking-widest"
            style={{
              background: 'linear-gradient(135deg, #818CF8, #A78BFA)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Loading
          </p>
          {/* Animated dots */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1 h-1 rounded-full"
                style={{
                  background: 'rgba(129,140,248,0.5)',
                  animation: `breathe 1.4s ease-in-out infinite ${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
