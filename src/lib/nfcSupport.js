// NFC Uyumluluk Kontrolü
// Bu dosya, Web NFC API'nin cihaz ve tarayıcıda desteklenip desteklenmediğini kontrol eder

/**
 * Cihaz türünü tespit eder (iOS, iPadOS, Android, vb.)
 * @returns {Object} Cihaz türü bilgileri
 */
export function detectDevice() {
  const ua = navigator.userAgent;
  const device = {
    isIOS: /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    isIPad: /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    isIPhone: /iPhone/.test(ua),
    isMacOS: /Macintosh|MacIntel|MacPPC|Mac68K/.test(ua) && navigator.maxTouchPoints <= 1,
    isAndroid: /Android/.test(ua),
    isWindows: /Windows/.test(ua),
    isMobile: /Mobi|Android/.test(ua) || (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)),
    osVersion: ''
  };

  // iOS/iPadOS sürüm tespiti
  if (device.isIOS) {
    const match = ua.match(/OS (\d+)_(\d+)_?(\d+)?/);
    device.osVersion = match ? `${match[1]}.${match[2]}${match[3] ? `.${match[3]}` : ''}` : '';
  }
  // Android sürüm tespiti
  else if (device.isAndroid) {
    const match = ua.match(/Android (\d+)\.(\d+)\.?(\d+)?/);
    device.osVersion = match ? `${match[1]}.${match[2]}${match[3] ? `.${match[3]}` : ''}` : '';
  }

  return device;
}

/**
 * Web NFC API desteğini ayrıntılı olarak kontrol eder
 * @returns {Object} NFC desteği durumu ve ayrıntıları
 */
export function checkNfcCompatibility() {
  const result = {
    isSupported: false,
    hasNfcHardware: false,
    isSecureContext: window.isSecureContext,
    isSuitableBrowser: false,
    browserInfo: navigator.userAgent,
    chromeVersion: 0,
    safariVersion: 0,
    deviceInfo: detectDevice(),
    details: "",
    requirements: []
  };

  // Chrome sürüm tespiti
  const chromeMatch = navigator.userAgent.match(/Chrome\/([0-9]+)/);
  result.chromeVersion = chromeMatch ? parseInt(chromeMatch[1]) : 0;
  
  // Safari sürüm tespiti
  const safariMatch = navigator.userAgent.match(/Version\/([0-9]+).*Safari/);
  result.safariVersion = safariMatch ? parseInt(safariMatch[1]) : 0;
  
  // Tarayıcı kontrolü - Web NFC şu anda sadece Chrome'da destekleniyor
  result.isSuitableBrowser = navigator.userAgent.includes('Chrome') && result.chromeVersion >= 89;

  // NDEFReader API kontrolü
  if ("NDEFReader" in window) {
    result.isSupported = true;
    result.hasNfcHardware = true; // API varsa muhtemelen donanım da vardır
    result.details = "Web NFC API destekleniyor.";
  } else {
    result.isSupported = false;

    // Detaylı hata analizi
    if (!navigator.userAgent.includes('Chrome')) {
      result.details = "Web NFC API sadece Chrome tarayıcısında desteklenir.";
      result.requirements.push("Chrome tarayıcısı kullanın");
    } else if (result.chromeVersion < 89) {
      result.details = `Chrome ${result.chromeVersion} Web NFC'yi desteklemiyor. Chrome 89+ gerekli.`;
      result.requirements.push("Chrome 89 veya üstü bir sürüm kullanın");
    } else if (!window.isSecureContext) {
      result.details = "Web NFC yalnızca HTTPS veya localhost üzerinde çalışır.";
      result.requirements.push("HTTPS protokolü üzerinden erişin");
    } else if (!navigator.userAgent.includes('Android')) {
      result.details = "Web NFC şu anda yalnızca Android cihazlarda destekleniyor.";
      result.requirements.push("Android cihaz kullanın");
    } else {
      result.details = "Bu cihazda NFC donanımı bulunamadı veya etkin değil.";
      result.hasNfcHardware = false;
      result.requirements.push("NFC özelliği olan bir cihaz kullanın");
      result.requirements.push("Cihaz ayarlarından NFC'yi etkinleştirin");
    }
  }

  return result;
}

/**
 * NFC'nin neden desteklenmediğini açıklayan kullanıcı dostu bir mesaj döndürür
 */
export function getNfcSupportMessage() {
  const compatibility = checkNfcCompatibility();
  
  if (compatibility.isSupported) {
    return "NFC destekleniyor ve kullanılabilir.";
  }
  
  // Basit açıklama ve çözüm önerileri
  const message = {
    title: "NFC Desteklenmiyor",
    description: compatibility.details,
    requirements: compatibility.requirements,
    generalAdvice: "Web NFC API şu anda sadece Android cihazlarda Chrome 89+ tarayıcısında HTTPS protokolü ile desteklenmektedir."
  };
  
  return message;
}

/**
 * Apple cihazlar için test modu davranışını yapılandırmak için kullanılır
 * @param {Object} options - Test modu ayarları
 */
export function configureAppleTestMode(options = {}) {
  const defaultOptions = {
    enabled: true,
    deviceType: 'iPhone', // iPhone, iPad, veya Mac
    osVersion: '16.0', // iOS/iPadOS/macOS sürümü
    simulateDelay: 1500, // NFC okuma/yazma simülasyonu için gecikme (ms)
    simulateErrors: false, // Hata simülasyonunu etkinleştir/devre dışı bırak
    errorRate: 0.2, // 0-1 arası, yüksek değer daha fazla hata anlamına gelir
    prefixSerialNumber: 'APPLE-', // Simüle edilen NFC etiket UID'leri için önek
    persistSimulation: true // Simülasyonu localStorage'da sakla
  };

  // Kullanıcı ayarlarını varsayılanlarla birleştir
  const config = { ...defaultOptions, ...options };
  
  // Yapılandırmayı localStorage'a kaydet
  localStorage.setItem('appleNfcTestConfig', JSON.stringify(config));
  
  return config;
}

/**
 * Mevcut Apple test modu yapılandırmasını alır
 * @returns {Object} Apple test modu yapılandırması
 */
export function getAppleTestConfig() {
  const savedConfig = localStorage.getItem('appleNfcTestConfig');
  
  if (savedConfig) {
    try {
      return JSON.parse(savedConfig);
    } catch (e) {
      console.error('Apple NFC test yapılandırması okunamadı:', e);
    }
  }
  
  // Varsayılan yapılandırmayı döndür
  return configureAppleTestMode();
}

/**
 * Apple cihazlar için NFC etiket okuma simülasyonu
 * @returns {Promise<{serialNumber: string, message: {records: Array<{recordType: string, mediaType: string, data: string|ArrayBuffer}>}}>} Simüle edilmiş NFC etiketi okuma sonucu
 */
export async function simulateAppleNfcReading() {
  const config = getAppleTestConfig();
  
  // Gecikme simülasyonu
  await new Promise(resolve => setTimeout(resolve, config.simulateDelay));
  
  // Hata simülasyonu
  if (config.simulateErrors && Math.random() < config.errorRate) {
    throw new Error('Apple NFC okuma hatası: İzin reddedildi');
  }
  
  // UUID benzeri bir seri numara oluştur
  const randomId = Math.random().toString(36).substr(2, 8).toUpperCase();
  const serialNumber = `${config.prefixSerialNumber}${randomId}`;
  
  // NDEF mesajı simüle et (URL kaydı)
  const message = {
    records: [
      {
        recordType: "url",
        mediaType: "text/plain",
        data: "https://apple.com/" + randomId.toLowerCase()
      }
    ]
  };
  
  return {
    serialNumber,
    message
  };
}

/**
 * Apple cihazlar için NFC etiket yazma simülasyonu
 * @param {Object} writeData - Yazılacak NDEF mesajı
 * @returns {Promise<boolean>} Yazma işleminin başarılı olup olmadığı
 */
export async function simulateAppleNfcWriting(writeData) {
  const config = getAppleTestConfig();
  
  // Gecikme simülasyonu
  await new Promise(resolve => setTimeout(resolve, config.simulateDelay));
  
  // Hata simülasyonu
  if (config.simulateErrors && Math.random() < config.errorRate) {
    throw new Error('Apple NFC yazma hatası: Etiket salt okunur');
  }
  
  // Yazılan verileri localStorage'a kaydet (Persistent simülasyon)
  if (config.persistSimulation && writeData) {
    try {
      const writtenTags = JSON.parse(localStorage.getItem('appleNfcWrittenTags') || '[]');
      writtenTags.push({
        timestamp: new Date().getTime(),
        data: writeData
      });
      localStorage.setItem('appleNfcWrittenTags', JSON.stringify(writtenTags.slice(-10))); // Son 10 yazma işlemini sakla
    } catch (e) {
      console.error('NFC yazma simülasyonu kaydedilemedi:', e);
    }
  }
  
  return true;
}

/**
 * NFC'nin fiziksel olarak aktif olup olmadığını kontrol etmek için bir test yapar
 * Bu fonksiyon yalnızca geliştirme amaçlıdır, gerçek bir güvenilirliği yoktur
 */
export async function testNfcHardware() {
  const device = detectDevice();
  
  // Apple cihaz testi
  if (device.isIOS || device.isMacOS) {
    return { 
      isActive: false, 
      error: "Apple cihazlarda Web NFC API desteklenmiyor. Test modu kullanılabilir.",
      isApple: true
    };
  }
  
  // NDEFReader API yoksa hemen false döndür
  if (!("NDEFReader" in window)) {
    return { 
      isActive: false, 
      error: "Web NFC API desteklenmiyor" 
    };
  }
  
  try {
    // 100ms gibi kısa bir süre bekleyerek NFC okuyucuyu aktif etmeyi dene
    const ndef = new window.NDEFReader();
    const scanPromise = ndef.scan();
    
    // Kısa bir timeout ile yarışan bir promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject("timeout"), 100);
    });
    
    // İlk tamamlanan promise'i bekle
    await Promise.race([scanPromise, timeoutPromise]);
    
    // Buraya ulaşabildiysek, NFC okuyucu başarıyla başlatıldı demektir
    return { isActive: true, error: null };
  } catch (error) {
    // Hata "timeout" değilse, NFC donanımı ile ilgili gerçek bir sorun var demektir
    if (error === "timeout") {
      // Timeout hata değil, sadece testin bitmesi için kullanıldı
      return { isActive: true, error: null };
    }
    
    // Diğer tüm hatalar NFC'nin donanım seviyesinde çalışmadığını gösterir
    return { 
      isActive: false,
      error: String(error)
    };
  }
}