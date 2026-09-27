import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { Phone, Shield, ArrowRight, RefreshCw, Smartphone, Globe, CheckCircle2, Key, Info, Sun, Moon } from 'lucide-react';

interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  digits: number | { min: number; max: number };
  placeholder: string;
}

const COUNTRY_CONFIGS: CountryConfig[] = [
  { code: '+91', name: 'India', flag: '🇮🇳', digits: 10, placeholder: '9846628967' },
  { code: '+1', name: 'USA / Canada', flag: '🇺🇸', digits: 10, placeholder: '2025550143' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', digits: { min: 10, max: 11 }, placeholder: '7911123456' },
  { code: '+49', name: 'Germany', flag: '🇩🇪', digits: { min: 10, max: 11 }, placeholder: '15123456789' },
  { code: '+971', name: 'UAE', flag: '🇦🇪', digits: 9, placeholder: '501234567' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦', digits: 9, placeholder: '501234567' },
  { code: '+61', name: 'Australia', flag: '🇦🇺', digits: 9, placeholder: '412345678' },
  { code: '+33', name: 'France', flag: '🇫🇷', digits: 9, placeholder: '612345678' },
  { code: '+81', name: 'Japan', flag: '🇯🇵', digits: 10, placeholder: '9012345678' },
  { code: '+86', name: 'China', flag: '🇨🇳', digits: 11, placeholder: '13800138000' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷', digits: 11, placeholder: '11987654321' },
];

const getSelectedCountryConfig = (code: string): CountryConfig => {
  return COUNTRY_CONFIGS.find(c => c.code === code) || {
    code,
    name: 'Selected Country',
    flag: '🌐',
    digits: { min: 7, max: 15 },
    placeholder: '9876543210'
  };
};

const validatePhoneForCountry = (phone: string, code: string): string | null => {
  const cleanPhone = phone.replace(/\D/g, '');
  const config = getSelectedCountryConfig(code);

  if (!cleanPhone) {
    return 'Please enter your mobile phone number.';
  }

  if (typeof config.digits === 'number') {
    if (cleanPhone.length !== config.digits) {
      return `For ${config.name} (${config.code}), mobile number must be exactly ${config.digits} digits. (You entered ${cleanPhone.length} digit${cleanPhone.length === 1 ? '' : 's'})`;
    }
  } else {
    if (cleanPhone.length < config.digits.min || cleanPhone.length > config.digits.max) {
      return `For ${config.name} (${config.code}), mobile number must be between ${config.digits.min} and ${config.digits.max} digits. (You entered ${cleanPhone.length} digit${cleanPhone.length === 1 ? '' : 's'})`;
    }
  }

  return null;
};

export const OnboardingScreens: React.FC = () => {
  const { loginWithOtp, registerWeb, loginPassword, quickDemoLogin, simulateIvr } = useAuth();
  const { themeMode, toggleTheme } = useTheme();

  const [step, setStep] = useState<number>(1); // 1: Lang, 2: Terms, 3: Phone, 4: OTP
  const [authMode, setAuthMode] = useState<'otp' | 'register' | 'password' | 'ivr'>('otp');
  const [language, setLanguage] = useState<string>('en');
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  
  const [timer, setTimer] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);

  // Auto phone detection attempt simulation
  useEffect(() => {
    if (step === 3 && !phoneInput) {
      if ('credentials' in navigator && (navigator as any).credentials) {
        // Feature detection notice
      }
    }
  }, [step, phoneInput]);

  // Resend OTP countdown
  useEffect(() => {
    let interval: any;
    if (step === 4 && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleRequestOtp = async () => {
    setError(null);
    setSuccessMsg(null);
    
    const valErr = validatePhoneForCountry(phoneInput, countryCode);
    if (valErr) {
      setError(valErr);
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${countryCode}${phoneInput.replace(/\D/g, '')}`;
      const res = await api.requestOtp(fullPhone);
      const generatedOtp = res.debugOtp || '123456';
      setDebugOtp(generatedOtp);
      setOtpInput(generatedOtp);
      setTimer(30);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (!otpInput || otpInput.length < 4) {
      setError('Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${countryCode}${phoneInput.replace(/\D/g, '')}`;
      await loginWithOtp(fullPhone, otpInput);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWebRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const valErr = validatePhoneForCountry(phoneInput, countryCode);
    if (valErr) {
      setError(valErr);
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${countryCode}${phoneInput.replace(/\D/g, '')}`;
      await registerWeb(fullPhone, nameInput, passwordInput);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const valErr = validatePhoneForCountry(phoneInput, countryCode);
    if (valErr) {
      setError(valErr);
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${countryCode}${phoneInput.replace(/\D/g, '')}`;
      await loginPassword(fullPhone, passwordInput);
    } catch (err: any) {
      setError(err.message || 'Password login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateIvrCall = async () => {
    setError(null);
    setSuccessMsg(null);
    
    const valErr = validatePhoneForCountry(phoneInput || '9846628967', countryCode);
    if (valErr && phoneInput) {
      setError(valErr);
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${countryCode}${phoneInput.replace(/\D/g, '')}` || '+919846628967';
      const res = await simulateIvr(fullPhone);
      setSuccessMsg(res.message);
      setPhoneInput('9846628967');
      setCountryCode('+91');
      setAuthMode('otp');
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'IVR simulation failed');
    } finally {
      setLoading(false);
    }
  };

  // Demo Quick Login Helper
  const handleQuickDemo = async (demoPhone: string) => {
    setLoading(true);
    setError(null);
    try {
      await quickDemoLogin(demoPhone);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const currentCountry = getSelectedCountryConfig(countryCode);
  const cleanDigitsCount = phoneInput.replace(/\D/g, '').length;
  const isDigitValid = typeof currentCountry.digits === 'number'
    ? cleanDigitsCount === currentCountry.digits
    : (cleanDigitsCount >= currentCountry.digits.min && cleanDigitsCount <= currentCountry.digits.max);
  const maxDigits = typeof currentCountry.digits === 'number' ? currentCountry.digits : currentCountry.digits.max;

  const renderPhoneInput = (label = 'Enter Phone Number') => (
    <div className="space-y-1.5 text-left">
      <div className="flex items-center justify-between">
        <label className={`block text-xs font-semibold ${themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{label}</label>
        <span className="text-[10px] text-blue-500 font-medium">
          {currentCountry.flag} {currentCountry.name} ({currentCountry.code})
        </span>
      </div>

      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className={`border rounded-xl px-2.5 py-3 text-xs focus:outline-none focus:border-blue-500 font-semibold cursor-pointer shadow-sm transition-all ${
            themeMode === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
          }`}
        >
          {COUNTRY_CONFIGS.map(c => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.code} ({c.name})
            </option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={maxDigits}
          placeholder={currentCountry.placeholder}
          value={phoneInput}
          onChange={(e) => {
            const digitsOnly = e.target.value.replace(/\D/g, '');
            setPhoneInput(digitsOnly);
          }}
          className={`flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none font-mono tracking-wider transition-all shadow-inner ${
            themeMode === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'
          } ${
            phoneInput && !isDigitValid
              ? 'border-amber-500/80 focus:border-amber-400'
              : themeMode === 'dark' ? 'border-slate-700 focus:border-blue-500' : 'border-slate-300 focus:border-blue-500'
          }`}
        />
      </div>

      {/* Digit Requirement & Real-Time Count Helper */}
      <div className="flex items-center justify-between text-[11px] px-1 pt-0.5">
        <span className={themeMode === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
          Digits Rule:{' '}
          <strong className={themeMode === 'dark' ? 'text-slate-200 font-mono' : 'text-slate-800 font-mono'}>
            {typeof currentCountry.digits === 'number'
              ? `${currentCountry.digits} digits`
              : `${currentCountry.digits.min}-${currentCountry.digits.max} digits`}
          </strong>
        </span>
        {phoneInput ? (
          <span className={`font-mono font-bold ${isDigitValid ? 'text-emerald-500' : 'text-amber-500'}`}>
            {cleanDigitsCount}/{typeof currentCountry.digits === 'number' ? currentCountry.digits : `${currentCountry.digits.min}-${currentCountry.digits.max}`} {isDigitValid ? '✓' : ''}
          </span>
        ) : (
          <span className="text-slate-400 font-mono">0/{typeof currentCountry.digits === 'number' ? currentCountry.digits : `${currentCountry.digits.min}-${currentCountry.digits.max}`}</span>
        )}
      </div>
    </div>
  );

  const generatedEmail = phoneInput ? `${countryCode.replace('+', '')}${phoneInput.replace(/\D/g, '')}@phonemail.com` : 'yournumber@phonemail.com';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors ${
      themeMode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Theme Switcher Floating Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-2xl border flex items-center gap-1.5 text-xs font-semibold shadow-lg transition-all ${
            themeMode === 'dark'
              ? 'bg-slate-800/90 border-slate-700 text-amber-400 hover:bg-slate-800'
              : 'bg-white/90 border-slate-200 text-indigo-600 hover:bg-slate-100'
          }`}
        >
          {themeMode === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className={`w-full max-w-md border rounded-3xl shadow-2xl overflow-hidden z-10 p-6 md:p-8 transition-colors ${
        themeMode === 'dark'
          ? 'bg-slate-900/90 backdrop-blur-xl border-slate-700/60'
          : 'bg-white/90 backdrop-blur-xl border-slate-200 shadow-slate-300/40'
      }`}>
        
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-bold shadow-lg shadow-blue-500/25 mb-3">
            <Smartphone className="w-8 h-8" />
          </div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>PhoneMail</h1>
          <p className="text-xs text-blue-500 font-semibold mt-1">Your Phone Number is Your Email ID</p>
        </div>

        {/* Quick Demo Login Bar */}
        <div className={`mb-6 p-3 rounded-xl border text-xs ${
          themeMode === 'dark' ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-100 border-slate-200'
        }`}>
          <p className={`font-semibold mb-2 flex items-center gap-1.5 ${themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
            <Info className="w-3.5 h-3.5 text-blue-500" />
            Quick Demo Accounts (1-Click Login):
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickDemo('9876543210')}
              disabled={loading}
              className="py-1.5 px-2 bg-blue-600/15 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-500 font-bold text-center truncate transition-all"
            >
              Alex (9876...)
            </button>
            <button
              onClick={() => handleQuickDemo('9123456789')}
              disabled={loading}
              className="py-1.5 px-2 bg-sky-600/15 hover:bg-sky-600/30 border border-sky-500/30 rounded-lg text-sky-500 font-bold text-center truncate transition-all"
            >
              Sarah (9123...)
            </button>
            <button
              onClick={() => handleQuickDemo('9998887776')}
              disabled={loading}
              className="py-1.5 px-2 bg-indigo-600/15 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg text-indigo-500 font-bold text-center truncate transition-all"
            >
              David (9998...)
            </button>
          </div>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs font-medium flex items-center gap-2 animate-shake">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Mode Navigation Tabs */}
        <div className={`flex border-b mb-6 ${themeMode === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
          <button
            onClick={() => { setAuthMode('otp'); setStep(1); setError(null); }}
            className={`flex-1 pb-2.5 text-xs font-semibold border-b-2 text-center transition-all ${
              authMode === 'otp' ? 'border-blue-500 text-blue-500 font-bold' : themeMode === 'dark' ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Mobile Flow
          </button>
          <button
            onClick={() => { setAuthMode('register'); setError(null); }}
            className={`flex-1 pb-2.5 text-xs font-semibold border-b-2 text-center transition-all ${
              authMode === 'register' ? 'border-blue-500 text-blue-500 font-bold' : themeMode === 'dark' ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Web Register
          </button>
          <button
            onClick={() => { setAuthMode('password'); setError(null); }}
            className={`flex-1 pb-2.5 text-xs font-semibold border-b-2 text-center transition-all ${
              authMode === 'password' ? 'border-blue-500 text-blue-500 font-bold' : themeMode === 'dark' ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Password
          </button>
          <button
            onClick={() => { setAuthMode('ivr'); setError(null); }}
            className={`flex-1 pb-2.5 text-xs font-semibold border-b-2 text-center transition-all ${
              authMode === 'ivr' ? 'border-blue-500 text-blue-500 font-bold' : themeMode === 'dark' ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Toll-Free Call
          </button>
        </div>

        {/* --- 1. MOBILE ONBOARDING FLOW (SCREEN 1 - 4) --- */}
        {authMode === 'otp' && (
          <div>
            {/* Screen 1: Language Selection */}
            {step === 1 && (
              <div className="space-y-4">
                <div className={`flex items-center gap-2 text-sm font-semibold ${themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span>Select Your Preferred Language</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'es', label: 'Español' },
                    { code: 'fr', label: 'Français' },
                    { code: 'hi', label: 'Hindi (हिंदी)' },
                    { code: 'de', label: 'Deutsch' },
                  ].map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`p-3 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition-all ${
                        language === lang.code
                          ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold'
                          : themeMode === 'dark' ? 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-700/60' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{lang.label}</span>
                      {language === lang.code && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Screen 2: Terms & Conditions */}
            {step === 2 && (
              <div className="space-y-4">
                <div className={`flex items-center gap-2 text-sm font-semibold ${themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>Terms & Privacy Policy</span>
                </div>
                <div className={`p-4 rounded-xl border text-xs space-y-2 max-h-40 overflow-y-auto ${
                  themeMode === 'dark' ? 'bg-slate-900/60 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}>
                  <p className="font-semibold text-blue-500">Welcome to PhoneMail!</p>
                  <p>By creating an account, your phone number will serve as your unique email identifier (<span className="font-mono text-blue-400">&lt;phone&gt;@phonemail.com</span>).</p>
                  <p>We send SMS notifications for incoming emails when you are offline. Standard SMS messaging rates may apply.</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>By tapping "Agree & Continue", you accept the Terms of Service.</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className={`py-3 px-4 rounded-xl text-xs font-semibold ${
                      themeMode === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                  >
                    <span>Agree & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Screen 3: Phone Number Verification */}
            {step === 3 && (
              <div className="space-y-4">
                {renderPhoneInput('Enter Phone Number')}

                <div className={`p-2.5 rounded-lg text-[11px] flex items-center gap-2 ${
                  themeMode === 'dark' ? 'bg-slate-900/60 text-slate-400' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Assigned Email: <strong className="text-blue-500 font-mono">{generatedEmail}</strong></span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className={`py-3 px-4 rounded-xl text-xs font-semibold ${
                      themeMode === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleRequestOtp}
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send OTP</span>}
                  </button>
                </div>
              </div>
            )}

            {/* Screen 4: OTP Verification */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-xs text-slate-400">Verification code generated for:</p>
                  <p className="text-sm font-bold text-blue-500 font-mono mt-0.5">{countryCode} {phoneInput}</p>
                </div>

                {/* OTP Verification Notice Box */}
                <div className={`p-3.5 border rounded-2xl text-left space-y-1.5 shadow-md ${
                  themeMode === 'dark' ? 'bg-slate-900/90 border-blue-500/30' : 'bg-blue-50/50 border-blue-200'
                }`}>
                  <h4 className="text-xs font-bold text-blue-500 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-500 shrink-0" />
                    OTP Verification Notice
                  </h4>
                  <p className={`text-[11px] leading-relaxed ${themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    The OTP has been automatically generated and displayed on the screen for demonstration purposes.
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Real SMS delivery is currently unavailable because the SMS service provider requires a paid service. In a production environment, the generated OTP would be sent directly to the registered mobile number via SMS.
                  </p>
                </div>

                {/* On-Screen Generated OTP Card */}
                {debugOtp && (
                  <div className="p-4 bg-blue-500/15 border-2 border-blue-500/50 rounded-2xl text-center space-y-2 shadow-lg">
                    <div className="flex items-center justify-center gap-1.5 text-blue-500 font-semibold text-xs">
                      <Key className="w-4 h-4 text-blue-500" />
                      <span>Backend Generated OTP Code (Free Mode):</span>
                    </div>
                    <div className={`text-3xl font-black tracking-[0.3em] font-mono text-blue-400 py-2.5 px-6 rounded-xl border border-blue-500/40 inline-block shadow-inner ${
                      themeMode === 'dark' ? 'bg-slate-900/90' : 'bg-white'
                    }`}>
                      {debugOtp}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setOtpInput(debugOtp)}
                        className="mt-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-blue-500/25 inline-flex items-center gap-1"
                      >
                        <span>⚡ Auto-fill Code</span>
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 text-center">Enter Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="123456"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className={`w-full border rounded-xl px-4 py-3 text-center text-xl font-bold tracking-[0.5em] focus:outline-none focus:border-blue-500 font-mono ${
                      themeMode === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Didn't get code?</span>
                  {timer > 0 ? (
                    <span className="text-slate-400">Resend in {timer}s</span>
                  ) : (
                    <button
                      onClick={handleRequestOtp}
                      className="text-blue-500 hover:underline font-semibold"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(3)}
                    className={`py-3 px-4 rounded-xl text-xs font-semibold ${
                      themeMode === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Edit Phone
                  </button>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify & Launch Inbox</span>}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- 2. WEB REGISTRATION FORM (Requirement 8) --- */}
        {authMode === 'register' && (
          <form onSubmit={handleWebRegister} className="space-y-4">
            {renderPhoneInput('Phone Number')}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name (Optional)</label>
              <input
                type="text"
                placeholder="Alex Rivera"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 ${
                  themeMode === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Password (Optional Fallback)</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 ${
                  themeMode === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className={`p-2.5 rounded-xl border text-[11px] ${
              themeMode === 'dark' ? 'bg-slate-900/60 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              Generated Address: <span className="text-blue-500 font-mono font-bold">{generatedEmail}</span>
            </div>

            {/* Requirement 8: Above Next button display terms link */}
            <p className="text-[11px] text-slate-400 text-center">
              By signing up, you agree to the{' '}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-blue-500 font-semibold underline hover:text-blue-400"
              >
                Terms of Service
              </button>
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Register Account</span>}
              </button>

              <div className="relative flex py-1 items-center">
                <div className={`flex-grow border-t ${themeMode === 'dark' ? 'border-slate-700/60' : 'border-slate-200'}`}></div>
                <span className="flex-shrink mx-2 text-[10px] text-slate-400 uppercase font-semibold">Or</span>
                <div className={`flex-grow border-t ${themeMode === 'dark' ? 'border-slate-700/60' : 'border-slate-200'}`}></div>
              </div>

              <button
                type="button"
                onClick={() => { setAuthMode('password'); setError(null); }}
                className={`w-full py-2.5 px-4 border text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  themeMode === 'dark' ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                }`}
              >
                <Key className="w-3.5 h-3.5 text-blue-500" />
                <span>Already a user? Log in with Password & Number</span>
              </button>
            </div>
          </form>
        )}

        {/* --- 3. PASSWORD LOGIN FALLBACK --- */}
        {authMode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            {renderPhoneInput('Phone Number')}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 ${
                  themeMode === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Sign In with Password</span>}
            </button>
          </form>
        )}

        {/* --- 4. TOLL-FREE IVR CALL SIMULATION --- */}
        {authMode === 'ivr' && (
          <div className="space-y-4 text-center">
            {/* SMS Service Unavailable Notice */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-left space-y-2">
              <h3 className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-500 shrink-0" />
                SMS Service Unavailable
              </h3>
              <p className={`text-[11px] leading-relaxed ${themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                The SMS/OTP verification service is currently unavailable because third-party SMS service providers require paid service activation for sending messages to mobile numbers.
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                You may continue using the application with other available features. SMS verification will be enabled once a supported SMS service provider is configured.
              </p>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-left space-y-2">
              <h3 className="text-xs font-bold text-blue-500 flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                Toll-Free / IVR Account Registration
              </h3>
              <p className={`text-[11px] ${themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                Simulates an incoming phone call to PhoneMail IVR line (<span className="font-mono text-blue-500 font-bold">1-800-PHONEMAIL</span>). The system automatically detects your Caller ID and activates your email address.
              </p>
            </div>

            {renderPhoneInput('Caller Phone Number')}

            <button
              onClick={handleSimulateIvrCall}
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Simulate Incoming Toll-Free Call (Press 1)</span>}
            </button>
          </div>
        )}

      </div>

      {/* Terms of Service Modal (Requirement 8) */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border max-w-md w-full rounded-2xl p-6 text-xs space-y-3 ${
            themeMode === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <h3 className={`text-base font-bold flex items-center gap-2 ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <Shield className="w-5 h-5 text-blue-500" />
              PhoneMail Terms of Service
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 leading-relaxed text-slate-400">
              <p>1. <strong>Phone Number Email ID:</strong> You agree that your registered phone number serves as your unique email address domain (<span className="font-mono text-blue-500">&lt;phone&gt;@phonemail.com</span>).</p>
              <p>2. <strong>SMS Fallback & Notifications:</strong> PhoneMail delivers real-time SMS notifications for critical incoming messages when you are away from the application.</p>
              <p>3. <strong>Privacy & Security:</strong> We hash OTP codes and passwords securely using industry standard bcrypt algorithms. Your credentials and data are never sold or shared.</p>
            </div>
            <button
              onClick={() => setShowTermsModal(false)}
              className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 text-xs transition-all shadow-md shadow-blue-500/25"
            >
              I Understand & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
