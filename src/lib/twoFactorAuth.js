import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// OTP için gizli anahtarı oluştur
export function generateSecret() {
  return authenticator.generateSecret();
}

// TOTP doğrulama
export function verifyToken(token, secret) {
  return authenticator.verify({ token, secret });
}

// QR Kodu URI'sını oluştur
export function generateOtpAuthUri(username, service, secret) {
  return authenticator.keyuri(username, service, secret);
}

// QR Kod'u PNG formatında oluştur
export async function generateQRCode(otpAuthUri) {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUri);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('QR kod oluşturma hatası:', error);
    throw error;
  }
}

// Kurtarma kodları oluştur
export function generateRecoveryCodes(count = 10) {
  const codes = [];
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < 10; j++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    // 5 karakter sonra tire ekle (XXXXX-XXXXX formatı)
    codes.push(`${code.slice(0, 5)}-${code.slice(5)}`);
  }
  
  return codes;
}