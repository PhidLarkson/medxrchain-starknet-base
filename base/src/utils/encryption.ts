
import CryptoJS from 'crypto-js';

// Default encryption key (will be overridden by user settings)
const DEFAULT_KEY = 'medxrchain-default-key';

/**
 * Encrypt data using AES encryption
 * @param data String data to encrypt
 * @param key Optional encryption key, defaults to key in localStorage
 * @returns Encrypted string
 */
export const encryptData = (data: string, key?: string): string => {
  const encryptionKey = key || localStorage.getItem('encryption_key') || DEFAULT_KEY;
  return CryptoJS.AES.encrypt(data, encryptionKey).toString();
};

/**
 * Decrypt data that was encrypted with AES
 * @param ciphertext Encrypted string to decrypt
 * @param key Optional encryption key, defaults to key in localStorage
 * @returns Decrypted string or empty string if decryption fails
 */
export const decryptData = (ciphertext: string, key?: string): string => {
  try {
    const encryptionKey = key || localStorage.getItem('encryption_key') || DEFAULT_KEY;
    const bytes = CryptoJS.AES.decrypt(ciphertext, encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
};

/**
 * Set the encryption key in localStorage
 * @param key New encryption key
 */
export const setEncryptionKey = (key: string): void => {
  localStorage.setItem('encryption_key', key);
};

/**
 * Generate a secure random encryption key
 * @returns A random encryption key
 */
export const generateEncryptionKey = (): string => {
  return CryptoJS.lib.WordArray.random(16).toString();
};

/**
 * Hash a string using SHA-256
 * @param data String to hash
 * @returns SHA-256 hash of the input string
 */
export const hashData = (data: string): string => {
  return CryptoJS.SHA256(data).toString();
};
