// Server-side helper for Courier (e.g., Leopards) auth + requests
// Caches bearer token in-memory with expiry to avoid frequent logins.
import { logger } from './logger'

let cachedToken: string | null = null
let tokenExpiresAt = 0 // epoch ms

async function loginAndGetToken(): Promise<{ token: string; expiresInSec: number }> {
  // Support both LEOPARDS_* and COURIER_* env var names
  // Also support LEOPARDS_API_KEY (used by Leopard API) instead of USERNAME
  const base = process.env.LEOPARDS_API_BASE_URL || process.env.COURIER_API_BASE_URL
  const apiKey = process.env.LEOPARDS_API_KEY || process.env.COURIER_API_KEY
  const username = process.env.LEOPARDS_API_USERNAME || process.env.COURIER_API_USERNAME || apiKey
  const password = process.env.LEOPARDS_API_PASSWORD || process.env.COURIER_API_PASSWORD

  if (!base || !username || !password) {
    const missing = [!base && "LEOPARDS_API_BASE_URL/COURIER_API_BASE_URL", !username && "LEOPARDS_API_KEY/LEOPARDS_API_USERNAME/COURIER_API_USERNAME", !password && "LEOPARDS_API_PASSWORD/COURIER_API_PASSWORD"].filter(Boolean)
    throw new Error(`Missing env vars: ${missing.join(", ")}`)
  }

  // Leopard API uses API_KEY instead of username, so use apiKey if available
  const loginUsername = apiKey || username

  // Try different login endpoints and formats for Leopard API
  const loginEndpoints = [
    '/login',
    '/auth/login',
    '/api/login',
    '/merchant/login'
  ];
  
  let lastError: Error | null = null;
  
  for (const endpoint of loginEndpoints) {
    try {
      logger.log(`[Courier Auth] Trying login endpoint: ${endpoint}`);
      
      // Try with API key format first (if apiKey is available)
      let loginBody: any;
      if (apiKey) {
        // Leopard API might use apiKey in body
        loginBody = { apiKey, password };
        // Also try with username field
        const res1 = await fetch(`${base}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: apiKey, password }),
          cache: "no-store",
        });
        
        if (res1.ok) {
          const text1 = await res1.text();
          let data1: any;
          try { data1 = JSON.parse(text1) } catch { data1 = {} }
          const token1 = data1?.token || data1?.access_token || data1?.data?.token;
          if (token1) {
            const expiresInSec1 = Number(data1?.expires_in || data1?.expiresIn || 3600);
            return { token: token1, expiresInSec: expiresInSec1 };
          }
        }
      }
      
      // Try standard username/password format
      const res = await fetch(`${base}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
        body: JSON.stringify({ 
          username: loginUsername, 
          password,
          ...(apiKey && { apiKey })
        }),
    cache: "no-store",
      });

      const text = await res.text();
  if (!res.ok) {
        logger.log(`[Courier Auth] ${endpoint} returned ${res.status}: ${text.substring(0, 200)}`);
        lastError = new Error(`Login failed (${res.status}): ${text.substring(0, 200)}`);
        continue;
  }

      let data: any;
  try { data = JSON.parse(text) } catch { data = {} }

  // Try common token fields
      const token: string | undefined = data?.token || data?.access_token || data?.data?.token;
      const expiresInSec: number = Number(data?.expires_in || data?.expiresIn || 3600);

      if (token) {
        logger.log(`[Courier Auth] Successfully authenticated using ${endpoint}`);
        return { token, expiresInSec };
      }
    } catch (error: any) {
      logger.log(`[Courier Auth] Error with ${endpoint}:`, error.message);
      lastError = error;
      continue;
    }
  }
  
  // If all login endpoints failed, try API key in headers instead
  if (apiKey) {
    logger.log('[Courier Auth] Using API key directly (Leopard API style - no login required)');
    // Leopard API uses API key directly without login
    // Return the API key as "token" to be used in headers
    return { token: apiKey, expiresInSec: 3600 * 24 }; // 24 hours
  }
  
  throw lastError || new Error("All login attempts failed")
}

export async function getCourierToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && tokenExpiresAt - now > 60_000) {
    // still valid (>= 60s left)
    return cachedToken
  }

  const { token, expiresInSec } = await loginAndGetToken()
  cachedToken = token
  tokenExpiresAt = now + expiresInSec * 1000
  return token
}

export async function courierGet(path: string): Promise<Response> {
  const base = process.env.LEOPARDS_API_BASE_URL || process.env.COURIER_API_BASE_URL
  if (!base) throw new Error("Missing LEOPARDS_API_BASE_URL or COURIER_API_BASE_URL")
  
  const apiKey = process.env.LEOPARDS_API_KEY || process.env.COURIER_API_KEY
  const password = process.env.LEOPARDS_API_PASSWORD || process.env.COURIER_API_PASSWORD
  const token = await getCourierToken()
  
  // Build headers - Leopard API uses API_KEY and PASSWORD
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  // If using Leopard API with API_KEY (token is the API key)
  if (apiKey && token === apiKey) {
    // Leopard API uses API key directly in Authorization header
    // Try multiple formats to find what works
    headers['Authorization'] = apiKey; // Direct API key (most common for Leopard)
    headers['X-API-Key'] = apiKey;
    headers['API-Key'] = apiKey;
    headers['apikey'] = apiKey;
    if (password) {
      headers['X-API-Password'] = password;
      headers['API-Password'] = password;
    }
    // Also try Bearer format
    headers['Authorization-Bearer'] = `Bearer ${apiKey}`;
    
    // Add to query params as well (some APIs use this)
    const separator = path.includes('?') ? '&' : '?';
    const queryParams = `apiKey=${encodeURIComponent(apiKey)}${password ? `&password=${encodeURIComponent(password)}` : ''}`;
    path = `${path}${separator}${queryParams}`;
  } else {
    // Standard Bearer token
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  logger.log(`[Courier] Making request to: ${base}${path.substring(0, 100)}${path.length > 100 ? '...' : ''}`);
  logger.log(`[Courier] Using API Key: ${apiKey ? '***' + apiKey.slice(-4) : 'No'}`);
  
  return fetch(`${base}${path}`, {
    headers,
    cache: "no-store",
  })
}

// POST request with credentials in body (Leopard API format)
export async function courierPost(path: string, body?: any): Promise<Response> {
  const base = process.env.LEOPARDS_API_BASE_URL || process.env.COURIER_API_BASE_URL
  if (!base) throw new Error("Missing LEOPARDS_API_BASE_URL or COURIER_API_BASE_URL")
  
  const apiKey = process.env.LEOPARDS_API_KEY || process.env.COURIER_API_KEY
  const password = process.env.LEOPARDS_API_PASSWORD || process.env.COURIER_API_PASSWORD
  
  // Leopard API requires api_key and api_password in request body
  const requestBody = {
    api_key: apiKey,
    api_password: password,
    ...body // Merge any additional body data
  };
  
  const headers: Record<string, string> = {
      "Content-Type": "application/json",
  };
  
  logger.log(`[Courier] Making POST request to: ${base}${path}`);
  logger.log(`[Courier] Using API Key: ${apiKey ? '***' + apiKey.slice(-4) : 'No'}`);
  logger.log(`[Courier] Request body keys:`, Object.keys(requestBody));
  
  return fetch(`${base}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
    cache: "no-store",
  })
}
