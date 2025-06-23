/**
 * Generate a new Ed25519 private key using browser crypto
 * @returns 32-byte private key as hex string (64 characters)
 */
export async function generateEd25519PrivateKey(): Promise<string> {
	const seedArray = new Uint8Array(32);
	crypto.getRandomValues(seedArray);
	return Array.from(seedArray).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate if a string is a valid Ed25519 private key (64 hex characters)
 * @param key - Key string to validate
 * @returns Boolean indicating if the key is valid
 */
export function isValidEd25519PrivateKey(key: string): boolean {
	return /^[a-fA-F0-9]{64}$/.test(key);
}