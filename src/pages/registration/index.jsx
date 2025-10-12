import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { User, Mail, Phone, Lock, Check, ArrowRight, ArrowLeft, TrendingUp, Users, Star, Shield, DollarSign } from 'lucide-react';
import http from 'services/http';
// Debounce-based checks are not used per product requirement; checks happen on Next click.

const Registration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    login: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    telegramNick: '',
    agreeToTerms: false,
    captchaVerified: false
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [exists, setExists] = useState({ login: null, email: null, phone: null });
  const [checking, setChecking] = useState({ login: false, email: false, phone: false });

  const totalSteps = 4;

  // Helper to call exists endpoint
  const checkUserExists = async (field, value) => {
    if (!value) {
      setExists(prev => ({ ...prev, [field]: null }));
      return false;
    }
    setChecking(prev => ({ ...prev, [field]: true }));
    try {
  const qp = `${field}=${encodeURIComponent(value)}`;
  const { ok, data } = await http.get(`/api/v2/auth/user_exists?${qp}`, { ensureAuthCheck: false });
      const existsFlag = ok && data && typeof data.exists === 'boolean' ? data.exists : false;
      setExists(prev => ({ ...prev, [field]: existsFlag }));
      // Reflect inline errors immediately
      if (existsFlag) {
        setErrors(prev => ({
          ...prev,
          [field]: field === 'login' ? 'Логин уже используется' : field === 'email' ? 'Этот email уже зарегистрирован' : 'Этот телефон уже зарегистрирован',
        }));
      } else {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
      return existsFlag;
    } catch (_) {
      // On error do not block; clear checking state
      return false;
    } finally {
      setChecking(prev => ({ ...prev, [field]: false }));
    }
  };

  const validateCurrentStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData?.fullName?.trim()) {
        newErrors.fullName = 'ФИО обязательно для заполнения';
      }
      if (!formData?.login?.trim()) {
        newErrors.login = 'Логин обязателен для заполнения';
      } else if (formData?.login?.length < 3) {
        newErrors.login = 'Логин должен содержать минимум 3 символа';
      } else if (exists.login) {
        newErrors.login = 'Логин уже используется';
      }
    }

    if (currentStep === 2) {
      if (!formData?.email) {
        newErrors.email = 'Email обязателен для заполнения';
      } else if (!/\S+@\S+\.\S+/.test(formData?.email)) {
        newErrors.email = 'Пожалуйста, введите корректный email адрес';
      } else if (exists.email) {
        newErrors.email = 'Этот email уже зарегистрирован';
      }
      if (!formData?.phone?.trim()) {
        newErrors.phone = 'Контактный телефон обязателен для заполнения';
      } else if (exists.phone) {
        newErrors.phone = 'Этот телефон уже зарегистрирован';
      }
    }

    if (currentStep === 3) {
      if (!formData?.password) {
        newErrors.password = 'Пароль обязателен для заполнения';
      } else if (formData?.password?.length < 8) {
        newErrors.password = 'Пароль должен содержать минимум 8 символов';
      }
      if (!formData?.confirmPassword) {
        newErrors.confirmPassword = 'Подтверждение пароля обязательно';
      } else if (formData?.password !== formData?.confirmPassword) {
        newErrors.confirmPassword = 'Пароли не совпадают';
      }
    }

    if (currentStep === 4) {
      if (!formData?.agreeToTerms) {
        newErrors.agreeToTerms = 'Необходимо согласиться с правилами и политикой конфиденциальности';
      }
      if (!formData?.captchaVerified) {
        newErrors.captcha = 'Пожалуйста, подтвердите, что вы не робот';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Reset previous uniqueness flags when user edits corresponding field
    if (field === 'login' || field === 'email' || field === 'phone') {
      setExists(prev => ({ ...prev, [field]: null }));
    }

    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleCaptchaChange = (value) => {
    setFormData(prev => ({
      ...prev,
      captchaVerified: !!value
    }));

    if (errors?.captcha) {
      setErrors(prev => ({
        ...prev,
        captcha: ''
      }));
    }
  };

  const handleNext = async () => {
    // Validate base fields for the current step first
    if (!validateCurrentStep()) return;

    if (currentStep === 1) {
      // Check login uniqueness on Next click
      const loginExists = await checkUserExists('login', formData.login);
      if (loginExists) return;
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      return;
    }

    if (currentStep === 2) {
      // Check email and phone uniqueness on Next click
      const emailExists = await checkUserExists('email', formData.email);
      const phoneExists = await checkUserExists('phone', formData.phone);
      if (emailExists || phoneExists) return;
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      return;
    }

    // For other steps, proceed normally
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    // Final guard: prevent submit when duplicates detected or checks in progress
    if (exists.login || exists.email || exists.phone || checking.login || checking.email || checking.phone) {
      setErrors(prev => ({
        ...prev,
        api: 'Указанные логин, email или телефон уже зарегистрированы или проверяются. Пожалуйста, измените данные.',
      }));
      if (exists.login) setCurrentStep(1);
      else if (exists.email || exists.phone) setCurrentStep(2);
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        full_name: formData.fullName,
        login: formData.login,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        telegram: formData.telegramNick,
        role: 'webmaster',
      };
  const res = await http.post('/api/v2/auth/sign_up', payload, { navigate, ensureAuthCheck: false });
      if (res.ok) {
        // После успешной регистрации запросим профиль и сохраним его в хранилище
        try {
          const user = await fetchUserProfile('00000', { navigate });
          if (user) persistUserProfile(user);
        } catch (_) {}
        navigate('/dashboard', { replace: true });
      } else {
        const raw = typeof res.data === 'string' ? res.data : (res.data?.error || res.data?.message);
        const apiMessage = raw ? String(raw) : 'Не удалось создать аккаунт';
        setErrors(prev => ({ ...prev, api: apiMessage }));
      }
    } catch (e) {
      setErrors(prev => ({ ...prev, api: 'Не удалось выполнить запрос. Проверьте соединение.' }));
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitles = {
    1: 'Личная информация',
    2: 'Контактные данные',
    3: 'Пароль и безопасность',
    4: 'Завершение регистрации'
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-text-primary mb-2">
                ФИО *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  value={formData?.fullName}
                  onChange={(e) => handleInputChange('fullName', e?.target?.value)}
                  className={`block w-full pl-10 pr-4 py-3 border rounded-lg placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-yellow-primary focus:border-transparent nav-transition ${
                    errors?.fullName ? 'border-error bg-error-50' : 'border-border bg-surface'
                  }`}
                  placeholder="Введите ваше полное имя"
                />
              </div>
              {errors?.fullName && (
                <p className="mt-2 text-sm text-error flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>{errors?.fullName}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="login" className="block text-sm font-medium text-text-primary mb-2">
                Логин *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  id="login"
                  type="text"
                  value={formData?.login}
                  onChange={(e) => handleInputChange('login', e?.target?.value)}
                  className={`block w-full pl-10 pr-4 py-3 border rounded-lg placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-yellow-primary focus:border-transparent nav-transition ${
                    errors?.login ? 'border-error bg-error-50' : 'border-border bg-surface'
                  }`}
                  placeholder="Придумайте логин"
                />
                {checking.login && (
                  <span className="absolute right-3 inset-y-0 flex items-center text-xs text-text-secondary">Проверка...</span>
                )}
              </div>
              {errors?.login && (
                <p className="mt-2 text-sm text-error flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>{errors?.login}</span>
                </p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                Email адрес *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData?.email}
                  onChange={(e) => handleInputChange('email', e?.target?.value)}
                  className={`block w-full pl-10 pr-4 py-3 border rounded-lg placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-yellow-primary focus:border-transparent nav-transition ${
                    errors?.email ? 'border-error bg-error-50' : 'border-border bg-surface'
                  }`}
                  placeholder="Введите ваш email"
                />
                {checking.email && (
                  <span className="absolute right-3 inset-y-0 flex items-center text-xs text-text-secondary">Проверка...</span>
                )}
              </div>
              {errors?.email && (
                <p className="mt-2 text-sm text-error flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>{errors?.email}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-2">
                Контактный телефон *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={formData?.phone}
                  onChange={(e) => handleInputChange('phone', e?.target?.value)}
                  className={`block w-full pl-10 pr-4 py-3 border rounded-lg placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-yellow-primary focus:border-transparent nav-transition ${
                    errors?.phone ? 'border-error bg-error-50' : 'border-border bg-surface'
                  }`}
                  placeholder="+7 (999) 123-45-67"
                />
                {checking.phone && (
                  <span className="absolute right-3 inset-y-0 flex items-center text-xs text-text-secondary">Проверка...</span>
                )}
              </div>
              {errors?.phone && (
                <p className="mt-2 text-sm text-error flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>{errors?.phone}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="telegramNick" className="block text-sm font-medium text-text-primary mb-2">
                Telegram никнейм (необязательно)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-text-muted font-medium">@</span>
                </div>
                <input
                  id="telegramNick"
                  type="text"
                  value={formData?.telegramNick}
                  onChange={(e) => handleInputChange('telegramNick', e?.target?.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-border bg-surface rounded-lg placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-yellow-primary focus:border-transparent nav-transition"
                  placeholder="username"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                Пароль *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData?.password}
                  onChange={(e) => handleInputChange('password', e?.target?.value)}
                  className={`block w-full pl-10 pr-12 py-3 border rounded-lg placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-yellow-primary focus:border-transparent nav-transition ${
                    errors?.password ? 'border-error bg-error-50' : 'border-border bg-surface'
                  }`}
                  placeholder="Придумайте надежный пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <Check className={`w-5 h-5 nav-transition ${showPassword ? 'text-text-primary' : 'text-text-muted'}`} />
                </button>
              </div>
              {errors?.password && (
                <p className="mt-2 text-sm text-error flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>{errors?.password}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                Подтвердите пароль *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData?.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e?.target?.value)}
                  className={`block w-full pl-10 pr-12 py-3 border rounded-lg placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-yellow-primary focus:border-transparent nav-transition ${
                    errors?.confirmPassword ? 'border-error bg-error-50' : 'border-border bg-surface'
                  }`}
                  placeholder="Повторите пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <Check className={`w-5 h-5 nav-transition ${showConfirmPassword ? 'text-text-primary' : 'text-text-muted'}`} />
                </button>
              </div>
              {errors?.confirmPassword && (
                <p className="mt-2 text-sm text-error flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>{errors?.confirmPassword}</span>
                </p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-text-primary mb-2">Почти готово!</h3>
              <p className="text-text-secondary">Осталось согласиться с условиями и подтвердить регистрацию</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  id="agreeToTerms"
                  type="checkbox"
                  checked={formData?.agreeToTerms}
                  onChange={(e) => handleInputChange('agreeToTerms', e?.target?.checked)}
                  className={`h-4 w-4 mt-0.5 rounded border-2 focus:ring-2 focus:ring-yellow-primary nav-transition ${
                    errors?.agreeToTerms 
                      ? 'border-error text-error focus:border-error' :'border-border text-yellow-primary focus:border-yellow-primary'
                  }`}
                />
                <label htmlFor="agreeToTerms" className="text-sm text-text-secondary">
                  Я согласен(-а) с{' '}
                  <span className="text-yellow-primary font-medium">правилами</span>
                  {' '}и{' '}
                  <span className="text-yellow-primary font-medium">политикой конфиденциальности</span>
                </label>
              </div>
              {errors?.agreeToTerms && (
                <p className="mt-2 text-sm text-error flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>{errors?.agreeToTerms}</span>
                </p>
              )}

              <div className="flex justify-center">
                <div>
                  <ReCAPTCHA
                    sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Test key
                    onChange={handleCaptchaChange}
                    theme="light"
                  />
                  {errors?.captcha && (
                    <p className="mt-2 text-sm text-error text-center">
                      {errors?.captcha}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getProgressColor = (step) => {
    if (step < currentStep) return 'bg-yellow-400';
    if (step === currentStep) return 'bg-yellow-400';
    return 'bg-gray-200';
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Promotional Content */}
      <div className="hidden lg:flex lg:w-1/2 bg-yellow-400 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-black bg-opacity-10 rounded-full animate-float"></div>
        <div className="absolute top-32 right-16 w-16 h-16 bg-black bg-opacity-5 rounded-xl transform rotate-45 animate-float-delayed"></div>
        <div className="absolute bottom-24 left-20 w-12 h-12 bg-black bg-opacity-10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-40 right-32 w-8 h-8 bg-black bg-opacity-5 rounded-lg"></div>

        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-black w-full">
          {/* Logo */}
          <div className="mb-12">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mr-3">
                <TrendingUp className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Leadmaker</h1>
                <p className="text-sm opacity-80">Партнерская программа</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Начните зарабатывать уже сегодня
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Присоединяйтесь к нашей партнерской программе и получите доступ к лучшим инструментам для заработка в интернете.
            </p>
            
            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-black bg-opacity-10 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-black" />
                </div>
                <span className="font-medium">Высокие комиссии и регулярные выплаты</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-black bg-opacity-10 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-black" />
                </div>
                <span className="font-medium">Команда профессионалов всегда поможет</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-black bg-opacity-10 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-black" />
                </div>
                <span className="font-medium">Надежная техническая поддержка</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-black bg-opacity-10 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-black" />
                </div>
                <span className="font-medium">Готовые маркетинговые материалы</span>
              </div>
            </div>

          </div>
        </div>
      </div>
      {/* Right Side - Registration Form */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-surface">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center mr-3">
                <TrendingUp className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">Leadmaker</h1>
                <p className="text-sm text-text-secondary">Партнерская программа</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-text-primary mb-2">Регистрация</h2>
            <p className="text-text-secondary">Шаг {currentStep} из {totalSteps}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex space-x-1 mb-4">
              {[1, 2, 3, 4]?.map((step) => (
                <div key={step} className="flex-1 h-2 rounded-full">
                  <div 
                    className={`h-full rounded-full nav-transition ${getProgressColor(step)}`}
                  ></div>
                </div>
              ))}
            </div>
            <p className="text-sm text-text-secondary text-center">
              {stepTitles?.[currentStep]}
            </p>
          </div>

          {/* Registration Form */}
          <div className="bg-background rounded-2xl shadow-card border border-border p-8">
            {errors?.api && (
              <div className="text-sm text-error bg-error-50 border border-error/20 rounded-lg p-3 mb-4">
                {errors.api}
              </div>
            )}
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-text-primary nav-transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Назад</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={(currentStep === 1 && checking.login) || (currentStep === 2 && (checking.email || checking.phone))}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 px-6 rounded-lg nav-transition shadow-card hover:shadow-card-hover flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Далее</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || checking.login || checking.email || checking.phone}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-6 rounded-lg nav-transition disabled:opacity-50 disabled:cursor-not-allowed shadow-card hover:shadow-card-hover flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Создание...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Создать аккаунт</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-border mt-4">
              <p className="text-text-secondary">
                Уже есть аккаунт?{' '}
                <Link to="/login" className="text-yellow-primary hover:text-accent font-medium nav-transition">
                  Войти
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;