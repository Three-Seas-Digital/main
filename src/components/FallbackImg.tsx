import { useState } from 'react';

/**
 * Image component with graceful fallback on load failure.
 * Shows a gradient placeholder instead of a broken image icon.
 */
export default function FallbackImg({ src, alt, className, style, ...rest }: { [x: string]: any; src: any; alt: any; className?: any; style?: any }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={className}
        role="img"
        aria-label={alt}
        style={{
          background: 'linear-gradient(135deg, var(--gray-200) 0%, var(--gray-300) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--gray-600)',
          fontSize: '0.85rem',
          width: '100%',
          height: '100%',
          minHeight: 120,
          ...style,
        }}
      >
        {alt || 'Image'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
