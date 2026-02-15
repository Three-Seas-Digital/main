const attempts = new Map();

export function loginRateLimit(maxAttempts = 5, windowMs = 60000) {
  return (req, res, next) => {
    const key = req.ip + ':' + (req.body.username || req.body.email || '');
    const now = Date.now();
    const record = attempts.get(key);

    if (record) {
      // Clean old attempts
      record.timestamps = record.timestamps.filter(t => now - t < windowMs);

      if (record.timestamps.length >= maxAttempts) {
        const oldestAttempt = record.timestamps[0];
        const retryAfter = Math.ceil((windowMs - (now - oldestAttempt)) / 1000);
        return res.status(429).json({
          error: 'Too many login attempts',
          retryAfter,
        });
      }
    }

    // Track this attempt (will be counted on failure in the route)
    req.trackFailedAttempt = () => {
      if (!attempts.has(key)) {
        attempts.set(key, { timestamps: [] });
      }
      attempts.get(key).timestamps.push(now);
    };

    req.clearAttempts = () => {
      attempts.delete(key);
    };

    next();
  };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attempts) {
    record.timestamps = record.timestamps.filter(t => now - t < 300000);
    if (record.timestamps.length === 0) attempts.delete(key);
  }
}, 300000);
