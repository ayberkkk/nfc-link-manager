"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import '../lib/i18n';

// Material UI Icons
import WifiIcon from '@mui/icons-material/Wifi';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import WarningIcon from '@mui/icons-material/Warning';
import HomeIcon from '@mui/icons-material/Home';
import ListIcon from '@mui/icons-material/List';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LogoutIcon from '@mui/icons-material/Logout';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import NfcIcon from '@mui/icons-material/Nfc';
import LanguageIcon from '@mui/icons-material/Language';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Card {
  id: number;
  uid: string;
  link: string;
  user_id: string;
  users?: {
    name: string;
    email: string;
  };
}

interface ScannedCard {
  uid: string;
  link: string;
  locked: boolean;
}

export default function NFCManager() {
  const { t, i18n } = useTranslation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [activeTab, setActiveTab] = useState("home");
  const [activeOperation, setActiveOperation] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCard, setScannedCard] = useState<ScannedCard | null>(null);
  const [newLink, setNewLink] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  // LocalStorage'dan kullanıcı ve dil kontrolü
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  // Kullanıcı değiştiğinde kartları yükle
  useEffect(() => {
    if (currentUser) {
      fetchCards();
    }
  }, [currentUser]);

  async function fetchCards() {
    if (!currentUser) return;

    try {
      const res = await fetch("/api/cards");
      const data = await res.json();
      // Sadece giriş yapan kullanıcının kartlarını filtrele
      const userCards = data.filter((card: Card) => card.user_id === currentUser.id);
      setCards(userCards);
    } catch {
      toast.error(t('cards.error_loading_cards'));
    }
  }

  // Kullanıcı Girişi/Kaydı
  const handleAuth = async () => {
    if (!loginEmail || !loginPassword) {
      toast.error(t('auth.fill_all_fields'));
      return;
    }

    try {
      if (isLoginMode) {
        // Giriş - login endpoint kullan
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setCurrentUser(data.user);
          localStorage.setItem("currentUser", JSON.stringify(data.user));
          toast.success(t('welcome_user', { name: data.user.name }));
          setLoginEmail("");
          setLoginPassword("");
        } else {
          toast.error(data.error || t('auth.login_failed'));
        }
      } else {
        // Kayıt
        if (!loginName) {
          toast.error(t('auth.fill_all_fields'));
          return;
        }

        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: loginName, email: loginEmail, password: loginPassword }),
        });

        if (res.ok) {
          const [newUser] = await res.json();
          setCurrentUser(newUser);
          localStorage.setItem("currentUser", JSON.stringify(newUser));
          toast.success(t('auth.register_success'));
          setLoginEmail("");
          setLoginName("");
          setLoginPassword("");
        } else {
          toast.error(t('auth.email_exists'));
        }
      }
    } catch {
      toast.error(t('cards.error_general'));
    }
  };

  // Çıkış
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    setCards([]);
    setActiveTab("home");
    toast.success(t('auth.logout'));
  };

  // NFC Kart Okuma Simülasyonu
  const simulateNFCScan = (operation: string) => {
    if (!currentUser) {
      toast.error(t('nfc.login_required'));
      return;
    }

    setActiveOperation(operation);
    setIsScanning(true);
    setScannedCard(null);
    setNewLink("");

    // Simüle edilmiş NFC okuma
    setTimeout(() => {
      const mockCard: ScannedCard = {
        uid: "NFC-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        link: operation === 'read' ? "https://example.com" : "",
        locked: false
      };
      setScannedCard(mockCard);
      setIsScanning(false);

      if (operation === 'read') {
        toast.success(t('cards.read_success'));
      }
    }, 2000);
  };

  // Kart Yazdırma
  const writeCard = async () => {
    if (!newLink) {
      toast.error(t('cards.fill_link'));
      return;
    }

    if (!scannedCard || !currentUser) return;

    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: scannedCard.uid,
          link: newLink,
          user_id: currentUser.id
        }),
      });

      if (res.ok) {
        toast.success(t('cards.write_success'));
        setActiveOperation(null);
        setScannedCard(null);
        setNewLink("");
        fetchCards();
      }
    } catch {
      toast.error(t('cards.error_writing_card'));
    }
  };

  // Kart Sıfırlama
  const resetCard = async () => {
    toast.success(t('cards.reset_success'));
    setActiveOperation(null);
    setScannedCard(null);
  };

  // Kart Kilitleme
  const lockCard = async () => {
    toast.success(t('cards.lock_success'));
    setActiveOperation(null);
    setScannedCard(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('cards.copy_success'));
  };

  async function deleteCard(id: number) {
    try {
      const res = await fetch("/api/cards", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        toast.success(t('cards.delete_success'));
        fetchCards();
      }
    } catch {
      toast.error(t('cards.error_general'));
    }
  }

  const filteredCards = cards.filter(card =>
    card.uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.link.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const operations = [
    {
      id: 'read',
      title: t('operation.read'),
      description: t('operation.read_description'),
      icon: VisibilityIcon,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500',
      iconColor: 'text-blue-500'
    },
    {
      id: 'write',
      title: t('operation.write'),
      description: t('operation.write_description'),
      icon: EditIcon,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500',
      iconColor: 'text-green-500'
    },
    {
      id: 'reset',
      title: t('operation.reset'),
      description: t('operation.reset_description'),
      icon: RefreshIcon,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500',
      iconColor: 'text-orange-500'
    },
    {
      id: 'lock',
      title: t('operation.lock'),
      description: t('operation.lock_description'),
      icon: LockIcon,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-500',
      iconColor: 'text-red-500'
    }
  ];

  const tabs = [
    { id: 'home', icon: HomeIcon, label: t('tab.home') },
    { id: 'cards', icon: ListIcon, label: t('tab.my_cards') },
    { id: 'settings', icon: SettingsIcon, label: t('tab.settings') }
  ];

  // Giriş Ekranı
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <Toaster position="top-center" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-700"
        >
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-purple-900/30 rounded-full mb-4">
              <NfcIcon sx={{ fontSize: 48, color: '#c084fc' }} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('app_name')}</h1>
            <p className="text-gray-400">
              {isLoginMode ? t('auth.login_subtitle') : t('auth.register_subtitle')}
            </p>
          </div>

          <div className="space-y-4">
            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <PersonIcon sx={{ fontSize: 16, marginRight: 0.5 }} />
                  {t('auth.name')}
                </label>
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder={t('auth.enter_name')}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <EmailIcon sx={{ fontSize: 16, marginRight: 0.5 }} />
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder={t('auth.enter_email')}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <LockIcon sx={{ fontSize: 16, marginRight: 0.5 }} />
                {t('auth.password')}
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder={isLoginMode ? t('auth.enter_password') : t('auth.create_password')}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              />
            </div>

            <button
              onClick={handleAuth}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              {isLoginMode ? t('auth.login') : t('auth.register')}
            </button>

            <div className="text-center">
              <button
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setLoginPassword("");
                }}
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                {isLoginMode
                  ? t('auth.no_account')
                  : t('auth.have_account')}
              </button>
            </div>
          </div>

          {/* Dil Seçici */}
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => changeLanguage('tr')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${i18n.language === 'tr'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
            >
              TR
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${i18n.language === 'en'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
            >
              EN
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 20px',
            border: '1px solid #374151',
          },
        }}
      />

      {/* Header */}
      <div className="bg-gray-800 shadow-lg sticky top-0 z-40 border-b border-gray-700">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-900/30 rounded-xl">
              <WifiIcon sx={{ fontSize: 24, color: '#c084fc' }} />
            </div>
            <h1 className="text-xl font-semibold text-white">
              {activeTab === 'home' && t('app_name')}
              {activeTab === 'cards' && t('tab.my_cards')}
              {activeTab === 'settings' && t('tab.settings')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Dil Değiştirme */}
            <button
              onClick={() => changeLanguage(i18n.language === 'tr' ? 'en' : 'tr')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
              title={i18n.language === 'tr' ? 'Switch to English' : 'Türkçe\'ye geç'}
            >
              <LanguageIcon sx={{ fontSize: 20, color: '#9ca3af' }} />
              <span className="text-xs text-gray-400">{i18n.language.toUpperCase()}</span>
            </button>
            <span className="text-sm text-gray-400">{currentUser.name}</span>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title={t('auth.logout')}
            >
              <LogoutIcon sx={{ fontSize: 20, color: '#9ca3af' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Home Tab */}
        {activeTab === 'home' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4"
          >
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-purple-700 to-purple-800 rounded-2xl p-6 mb-6 text-white shadow-xl">
              <h2 className="text-2xl font-bold mb-2">{t('welcome_user', { name: currentUser.name })}</h2>
              <p className="opacity-90">{t('nfc.manage_cards_description')}</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="bg-white/10 rounded-lg px-3 py-1.5 backdrop-blur">
                  <p className="text-sm">{t('cards.total_cards')}</p>
                  <p className="text-xl font-bold">{cards.length}</p>
                </div>
              </div>
            </div>

            {/* Operation Grid */}
            <h3 className="text-lg font-semibold text-white mb-4">{t('operation.operations')}</h3>
            <div className="grid grid-cols-2 gap-4">
              {operations.map((op) => (
                <motion.button
                  key={op.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => simulateNFCScan(op.id)}
                  className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700 active:shadow-none transition-all hover:bg-gray-750"
                >
                  <div className={`w-12 h-12 ${op.bgColor} bg-opacity-20 rounded-xl flex items-center justify-center mb-3`}>
                    <op.icon sx={{ fontSize: 24, color: op.iconColor.replace('text-', '#').replace('500', '500') }} />
                  </div>
                  <h4 className="font-semibold text-white">{op.title}</h4>
                  <p className="text-sm text-gray-400 mt-1">{op.description}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Cards Tab */}
        {activeTab === 'cards' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4"
          >
            {/* Search Bar */}
            <div className="relative mb-4">
              <SearchIcon sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 20, color: '#6b7280' }} />
              <input
                type="text"
                placeholder={t('cards.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 rounded-xl border border-gray-700 text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Cards List */}
            <div className="space-y-3">
              {filteredCards.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCardIcon sx={{ fontSize: 64, color: '#4b5563', marginBottom: 2 }} />
                  <p className="text-gray-400">{t('cards.no_cards_message')}</p>
                </div>
              ) : (
                filteredCards.map((card) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-900/30 rounded-xl flex items-center justify-center">
                          <CreditCardIcon sx={{ fontSize: 24, color: '#c084fc' }} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{card.uid}</h4>
                          <p className="text-sm text-gray-400 truncate">{card.link}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(card.uid)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <ContentCopyIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                        </button>
                        <button
                          onClick={() => deleteCard(card.id)}
                          className="p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <DeleteIcon sx={{ fontSize: 16, color: '#f87171' }} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4"
          >
            <div className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700 mb-4">
              <h3 className="font-semibold text-white mb-4">{t('user.user_info')}</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <PersonIcon sx={{ fontSize: 20, color: '#9ca3af' }} />
                  <div>
                    <p className="text-sm text-gray-500">{t('user.name_surname')}</p>
                    <p className="font-medium text-white">{currentUser.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <EmailIcon sx={{ fontSize: 20, color: '#9ca3af' }} />
                  <div>
                    <p className="text-sm text-gray-500">{t('user.email')}</p>
                    <p className="font-medium text-white">{currentUser.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-4">{t('app.app_settings')}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{t('app.notifications')}</span>
                  <div className="w-12 h-6 bg-purple-600 rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{t('app.auto_read')}</span>
                  <div className="w-12 h-6 bg-gray-600 rounded-full relative">
                    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-4">{t('app.about')}</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>{t('app.version')}</p>
                <p>{t('app.copyright')}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${activeTab === tab.id
                  ? 'text-purple-400'
                  : 'text-gray-500'
                }`}
            >
              <tab.icon sx={{ fontSize: 24, color: activeTab === tab.id ? '#c084fc' : '#6b7280' }} />
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Operation Modal */}
      <AnimatePresence>
        {activeOperation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-end justify-center z-50"
            onClick={() => !isScanning && setActiveOperation(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gray-800 rounded-t-3xl w-full max-w-lg border-t border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Handle */}
              <div className="flex justify-center pt-3">
                <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
              </div>

              <div className="p-6 pb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-white">
                    {operations.find(op => op.id === activeOperation)?.title}
                  </h2>
                  {!isScanning && (
                    <button
                      onClick={() => setActiveOperation(null)}
                      className="p-2 hover:bg-gray-700 rounded-xl transition-colors"
                    >
                      <CloseIcon sx={{ fontSize: 20, color: '#9ca3af' }} />
                    </button>
                  )}
                </div>

                {isScanning ? (
                  <div className="text-center py-12">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="inline-block p-6 bg-purple-900/30 rounded-full mb-6"
                    >
                      <NfcIcon sx={{ fontSize: 64, color: '#c084fc' }} />
                    </motion.div>
                    <p className="text-lg font-medium text-white mb-2">{t('nfc.scan_expected')}</p>
                    <p className="text-gray-400">{t('nfc.scan_please')}</p>
                  </div>
                ) : scannedCard ? (
                  <div className="space-y-4">
                    {/* Kart Bilgileri */}
                    <div className="bg-gray-700 rounded-xl p-4">
                      <p className="text-sm text-gray-400 mb-1">{t('cards.card_uid')}</p>
                      <p className="font-mono font-medium text-white">{scannedCard.uid}</p>
                      {activeOperation === 'read' && scannedCard.link && (
                        <>
                          <p className="text-sm text-gray-400 mb-1 mt-3">{t('cards.link')}</p>
                          <p className="text-white break-all">{scannedCard.link}</p>
                        </>
                      )}
                    </div>

                    {/* İşlem Alanı */}
                    {activeOperation === 'write' && (
                      <div>
                        <label className="text-sm font-medium text-gray-300">{t('cards.new_link')}</label>
                        <input
                          type="url"
                          placeholder="https://example.com"
                          value={newLink}
                          onChange={(e) => setNewLink(e.target.value)}
                          className="w-full mt-2 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    )}

                    {activeOperation === 'reset' && (
                      <div className="bg-orange-900/20 border border-orange-800 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <WarningIcon sx={{ fontSize: 20, color: '#fb923c', marginTop: 0.5 }} />
                          <div>
                            <p className="font-medium text-orange-300">{t('cards.attention')}</p>
                            <p className="text-sm text-orange-400 mt-1">
                              {t('cards.reset_warning')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeOperation === 'lock' && (
                      <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <LockIcon sx={{ fontSize: 20, color: '#f87171', marginTop: 0.5 }} />
                          <div>
                            <p className="font-medium text-red-300">{t('cards.permanent_lock')}</p>
                            <p className="text-sm text-red-400 mt-1">
                              {t('cards.lock_warning')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* İşlem Butonları */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setActiveOperation(null)}
                        className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-medium transition-colors"
                      >
                        {t('operation.cancel')}
                      </button>
                      {activeOperation === 'read' ? (
                        <button
                          onClick={() => {
                            copyToClipboard(scannedCard.link || scannedCard.uid);
                            setActiveOperation(null);
                          }}
                          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <ContentCopyIcon sx={{ fontSize: 16 }} />
                          {t('cards.copy')}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (activeOperation === 'write') writeCard();
                            else if (activeOperation === 'reset') resetCard();
                            else if (activeOperation === 'lock') lockCard();
                          }}
                          className={`flex-1 px-4 py-3 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2
                            ${activeOperation === 'write' ? 'bg-green-600 hover:bg-green-700' : ''}
                            ${activeOperation === 'reset' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                            ${activeOperation === 'lock' ? 'bg-red-600 hover:bg-red-700' : ''}
                          `}
                        >
                          <CheckIcon sx={{ fontSize: 16 }} />
                          {activeOperation === 'write' && t('operation.write')}
                          {activeOperation === 'reset' && t('operation.reset')}
                          {activeOperation === 'lock' && t('operation.lock')}
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
