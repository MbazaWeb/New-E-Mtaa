// Mock OTP service for pilot mode
const MOCK_OTP_CODE = "123456";

export function generateMockOtp(): string {
  // For pilot/demo the OTP is constant and displayed on-screen
  return MOCK_OTP_CODE;
}

export function validateMockOtp(code: string): boolean {
  if (!code) return false;
  return String(code).trim() === MOCK_OTP_CODE;
}

export default { generateMockOtp, validateMockOtp };
