/**
 * Simple in-memory rate limiter implementation
 */

const tokenStore = new Map();

export function rateLimit({
  interval,
  uniqueTokenPerInterval = 500,
  maxRequests,
}) {
  return {
    check: async (limit, token) => {
      const now = Date.now();
      const windowStart = now - interval;
      
      // Clean old tokens
      const tokensToDelete = [];
      tokenStore.forEach((timestamp, key) => {
        if (timestamp < windowStart) {
          tokensToDelete.push(key);
        }
      });
      tokensToDelete.forEach(key => tokenStore.delete(key));

      // Ensure store has space
      if (tokenStore.size >= uniqueTokenPerInterval) {
        throw new Error('Rate limit exceeded');
      }

      // Check token count in current interval
      const tokenCount = Array.from(tokenStore.entries())
        .filter(([key]) => key.startsWith(`${token}:`))
        .filter(([, timestamp]) => timestamp > windowStart)
        .length;

      if (tokenCount >= (limit ?? maxRequests)) {
        throw new Error('Rate limit exceeded');
      }

      // Add new token
      const newKey = `${token}:${now}`;
      tokenStore.set(newKey, now);

      return true;
    }
  };
}
