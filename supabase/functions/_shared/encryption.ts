// Encryption utilities for OAuth tokens using Web Crypto API
// This provides AES-GCM encryption for sensitive data like access tokens

const ENCRYPTION_KEY_NAME = 'OAUTH_ENCRYPTION_KEY';

// Get or create encryption key
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyMaterial = Deno.env.get(ENCRYPTION_KEY_NAME);
  
  if (!keyMaterial) {
    throw new Error('OAUTH_ENCRYPTION_KEY not configured in environment');
  }

  // Convert base64 key to bytes
  const keyBytes = Uint8Array.from(atob(keyMaterial), c => c.charCodeAt(0));
  
  // Import key for AES-GCM encryption
  return await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a token using AES-GCM encryption
 * Returns base64-encoded encrypted data with IV prepended
 */
export async function encryptToken(token: string): Promise<string> {
  if (!token) return token;

  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    
    // Generate random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Decrypts a token that was encrypted with encryptToken
 * Expects base64-encoded data with IV prepended
 */
export async function decryptToken(encryptedToken: string): Promise<string> {
  if (!encryptedToken) return encryptedToken;

  try {
    const key = await getEncryptionKey();
    
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);
    
    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );
    
    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt token');
  }
}

/**
 * Generate a new encryption key (for initial setup)
 * Run this once and store the result as OAUTH_ENCRYPTION_KEY secret
 */
export function generateEncryptionKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...key));
}
