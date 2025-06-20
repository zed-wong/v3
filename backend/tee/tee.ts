import { api } from "encore.dev/api";
import { APIError } from "encore.dev";
import crypto from "crypto";
import { db, prepare } from "../common/db";

// TEE (Trusted Execution Environment) attestation service
export interface AttestationRequest {
  instanceId: string;
  nonce: string;
  measurements: {
    codeHash: string;
    configHash: string;
    timestamp: number;
  };
}

export interface AttestationResponse {
  attestationId: string;
  verified: boolean;
  signature: string;
  timestamp: Date;
  instanceInfo?: InstanceInfo;
}

export interface InstanceInfo {
  instanceId: string;
  publicKey: string;
  enclaveQuote?: string;
  teeProvider: "sgx" | "sev" | "tdx" | "nitro";
  attestedAt: Date;
}

// Helper function to generate IDs
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate attestation for a running instance
export const generateAttestation = api(
  { expose: true, method: "POST", path: "/tee/attest" },
  async (req: AttestationRequest): Promise<AttestationResponse> => {
    // Validate request
    if (!req.instanceId || !req.nonce || !req.measurements) {
      throw APIError.badRequest("Missing required attestation parameters");
    }

    // Verify measurements (in production, this would involve actual TEE verification)
    const measurementString = JSON.stringify(req.measurements);
    const expectedHash = crypto.createHash("sha256").update(measurementString).digest("hex");
    
    // Generate attestation ID
    const attestationId = generateId('att');
    
    // Create signature (in production, this would use TEE-protected keys)
    const signatureData = `${req.instanceId}:${req.nonce}:${expectedHash}`;
    const signature = crypto.createHash("sha256").update(signatureData).digest("hex");

    // Store attestation
    const timestamp = new Date().toISOString();
    const attestStmt = prepare(`
      INSERT INTO attestations (attestation_id, instance_id, verified, signature, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);
    attestStmt.run(attestationId, req.instanceId, 1, signature, timestamp);

    // Get instance info
    const instanceStmt = prepare(`
      SELECT instance_id, public_key, enclave_quote, tee_provider, attested_at
      FROM instances
      WHERE instance_id = ?
    `);
    const instanceRow = instanceStmt.get(req.instanceId) as any;

    let instanceInfo: InstanceInfo | undefined;
    if (instanceRow) {
      instanceInfo = {
        instanceId: instanceRow.instance_id,
        publicKey: instanceRow.public_key,
        enclaveQuote: instanceRow.enclave_quote,
        teeProvider: instanceRow.tee_provider as "sgx" | "sev" | "tdx" | "nitro",
        attestedAt: new Date(instanceRow.attested_at)
      };
    }

    // Create attestation response
    const attestation: AttestationResponse = {
      attestationId,
      verified: true,
      signature,
      timestamp: new Date(timestamp),
      instanceInfo
    };

    return attestation;
  }
);

// Register a new instance with TEE
export const registerInstance = api(
  { expose: true, method: "POST", path: "/tee/register" },
  async ({ 
    instanceId, 
    publicKey,
    teeProvider = "nitro",
    enclaveQuote
  }: {
    instanceId: string;
    publicKey: string;
    teeProvider?: "sgx" | "sev" | "tdx" | "nitro";
    enclaveQuote?: string;
  }): Promise<InstanceInfo> => {
    // Check if instance already exists
    const checkStmt = prepare(`SELECT instance_id FROM instances WHERE instance_id = ?`);
    const existing = checkStmt.get(instanceId);
    
    if (existing) {
      throw APIError.conflict("Instance already registered");
    }

    // Register instance
    const attestedAt = new Date().toISOString();
    const insertStmt = prepare(`
      INSERT INTO instances (instance_id, public_key, enclave_quote, tee_provider, attested_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertStmt.run(instanceId, publicKey, enclaveQuote || null, teeProvider, attestedAt);

    // Create instance info
    const instanceInfo: InstanceInfo = {
      instanceId,
      publicKey,
      enclaveQuote,
      teeProvider,
      attestedAt: new Date(attestedAt)
    };

    return instanceInfo;
  }
);

// Verify an attestation
export const verifyAttestation = api(
  { expose: true, method: "POST", path: "/tee/verify" },
  async ({ 
    attestationId,
    expectedInstanceId
  }: {
    attestationId: string;
    expectedInstanceId?: string;
  }): Promise<{ valid: boolean; attestation?: AttestationResponse; reason?: string }> => {
    // Get attestation
    const attestStmt = prepare(`
      SELECT a.*, i.public_key, i.enclave_quote, i.tee_provider, i.attested_at as instance_attested_at
      FROM attestations a
      LEFT JOIN instances i ON a.instance_id = i.instance_id
      WHERE a.attestation_id = ?
    `);
    const row = attestStmt.get(attestationId) as any;
    
    if (!row) {
      return { valid: false, reason: "Attestation not found" };
    }

    // Build attestation response
    let instanceInfo: InstanceInfo | undefined;
    if (row.instance_id) {
      instanceInfo = {
        instanceId: row.instance_id,
        publicKey: row.public_key,
        enclaveQuote: row.enclave_quote,
        teeProvider: row.tee_provider as "sgx" | "sev" | "tdx" | "nitro",
        attestedAt: new Date(row.instance_attested_at)
      };
    }

    const attestation: AttestationResponse = {
      attestationId: row.attestation_id,
      verified: row.verified === 1,
      signature: row.signature,
      timestamp: new Date(row.timestamp),
      instanceInfo
    };

    // Check if attestation is recent (within 24 hours)
    const attestationAge = Date.now() - attestation.timestamp.getTime();
    if (attestationAge > 24 * 60 * 60 * 1000) {
      return { valid: false, reason: "Attestation expired", attestation };
    }

    // Verify instance ID if provided
    if (expectedInstanceId && instanceInfo?.instanceId !== expectedInstanceId) {
      return { valid: false, reason: "Instance ID mismatch", attestation };
    }

    return { valid: true, attestation };
  }
);

// Get instance information
export const getInstance = api(
  { expose: true, method: "GET", path: "/tee/instance/:instanceId" },
  async ({ instanceId }: { instanceId: string }): Promise<InstanceInfo> => {
    const stmt = prepare(`
      SELECT instance_id, public_key, enclave_quote, tee_provider, attested_at
      FROM instances
      WHERE instance_id = ?
    `);
    const row = stmt.get(instanceId) as any;
    
    if (!row) {
      throw APIError.notFound("Instance not found");
    }
    
    return {
      instanceId: row.instance_id,
      publicKey: row.public_key,
      enclaveQuote: row.enclave_quote,
      teeProvider: row.tee_provider as "sgx" | "sev" | "tdx" | "nitro",
      attestedAt: new Date(row.attested_at)
    };
  }
);

// List all registered instances (for leaderboard)
export const listInstances = api(
  { expose: true, method: "GET", path: "/tee/instances" },
  async (): Promise<{ instances: InstanceInfo[] }> => {
    const stmt = prepare(`
      SELECT instance_id, public_key, enclave_quote, tee_provider, attested_at
      FROM instances
      ORDER BY attested_at DESC
    `);
    const rows = stmt.all();
    
    const instances: InstanceInfo[] = rows.map((row: any) => ({
      instanceId: row.instance_id,
      publicKey: row.public_key,
      enclaveQuote: row.enclave_quote,
      teeProvider: row.tee_provider as "sgx" | "sev" | "tdx" | "nitro",
      attestedAt: new Date(row.attested_at)
    }));
    
    return { instances };
  }
);

// Generate secure random values using TEE
export const generateSecureRandom = api(
  { expose: true, method: "POST", path: "/tee/random" },
  async ({ 
    length = 32,
    encoding = "hex" 
  }: {
    length?: number;
    encoding?: "hex" | "base64" | "base64url";
  }): Promise<{ value: string }> => {
    // In production, this would use TEE's secure random generator
    const buffer = crypto.randomBytes(length);
    
    let value: string;
    switch (encoding) {
      case "base64":
        value = buffer.toString("base64");
        break;
      case "base64url":
        value = buffer.toString("base64url");
        break;
      default:
        value = buffer.toString("hex");
    }

    return { value };
  }
);

// Derive keys securely within TEE
export const deriveKey = api(
  { expose: true, method: "POST", path: "/tee/derive-key" },
  async ({ 
    instanceId,
    keyPath,
    keyType = "ed25519"
  }: {
    instanceId: string;
    keyPath: string;
    keyType?: "ed25519" | "secp256k1" | "sr25519";
  }): Promise<{ publicKey: string; keyId: string }> => {
    // Verify instance is registered
    const checkStmt = prepare(`SELECT instance_id FROM instances WHERE instance_id = ?`);
    const instance = checkStmt.get(instanceId);
    if (!instance) {
      throw APIError.unauthorized("Instance not registered");
    }

    // In production, this would:
    // 1. Use the SDK for private key derivation
    // 2. Derive keys within TEE enclave
    // 3. Never expose private keys outside TEE
    
    // For now, generate a mock public key
    const keyId = crypto.createHash("sha256")
      .update(`${instanceId}:${keyPath}:${keyType}`)
      .digest("hex")
      .substring(0, 16);
    
    const publicKey = crypto.randomBytes(32).toString("hex");

    return { publicKey, keyId };
  }
);