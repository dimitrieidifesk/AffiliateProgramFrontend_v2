import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { LogIn, Eye, EyeOff, Mail, Lock, Shield, TrendingUp, Users, Star } from 'lucide-react';
import http from 'services/http';
import { persistUserProfile } from 'utils/auth';
import { fetchUserProfile } from 'services/users';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    captchaVerified: false
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.email) {
      newErrors.email = 'Логин или email обязателен для заполнения';
    }

    if (!formData?.password) {
      newErrors.password = 'Пароль обязателен для заполнения';
    } else if (formData?.password?.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    }

    if (!formData?.captchaVerified) {
      newErrors.captcha = 'Пожалуйста, подтвердите, что вы не робот';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

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

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = { login: formData.email, password: formData.password };
  const res = await http.post('/api/v2/auth/login', payload, { navigate, ensureAuthCheck: false });
      if (res.ok) {
        // Backend should set HttpOnly cookies. Next, fetch and persist current user, then redirect
        try {
          const user = await fetchUserProfile('00000', { navigate });
          if (user) persistUserProfile(user);
        } catch (_) {}
        navigate('/dashboard', { replace: true });
      } else {
        let apiMessage = 'Ошибка входа';
        const rawError = (typeof res.data === 'string') ? res.data : (res.data?.error || res.data?.message);
        if (res.status === 401) {
          if (typeof rawError === 'string' && /bad username or password/i.test(rawError)) {
            apiMessage = 'Неверный логин или пароль';
          } else {
            apiMessage = 'Ошибка авторизации. Проверьте логин и пароль.';
          }
        } else if (rawError) {
          apiMessage = String(rawError);
        }
        setErrors(prev => ({ ...prev, api: apiMessage }));
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, api: 'Не удалось выполнить запрос. Проверьте соединение.' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Promotional Content */}
      <div className="hidden lg:flex lg:w-1/2 bg-yellow-400 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-black bg-opacity-10 rounded-full"></div>
        <div className="absolute top-32 right-16 w-16 h-16 bg-black bg-opacity-5 rounded-xl transform rotate-45"></div>
        <div className="absolute bottom-24 left-20 w-12 h-12 bg-black bg-opacity-10 rounded-full"></div>
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
              Добро пожаловать обратно
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Войдите в свой аккаунт и продолжайте зарабатывать с нашей партнерской программой.
            </p>
            
            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-black bg-opacity-10 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-black" />
                </div>
                <span className="font-medium">Высокие комиссии с каждого клиента</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-black bg-opacity-10 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-black" />
                </div>
                <span className="font-medium">Многоуровневая система привлечения</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-black bg-opacity-10 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-black" />
                </div>
                <span className="font-medium">Прозрачные и честные выплаты</span>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-black bg-opacity-5 rounded-2xl p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">200+</div>
                  <div className="text-sm opacity-75">Активных партнеров</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">98%</div>
                  <div className="text-sm opacity-75">Довольных клиентов</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
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
            <h2 className="text-3xl font-bold text-text-primary mb-2">Вход в систему</h2>
            <p className="text-text-secondary">Войдите в свой аккаунт для продолжения</p>
          </div>

          {/* Login Form */}
          <div className="bg-background rounded-2xl shadow-card border border-border p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors?.api && (
                <div className="text-sm text-error bg-error-50 border border-error/20 rounded-lg p-3">
                  {errors.api}
                </div>
              )}
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                  Логин или email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-text-muted" />
                  </div>
                  <input
                    id="email"
                    type="text"
                    value={formData?.email}
                    onChange={(e) => handleInputChange('email', e?.target?.value)}
                    className={`block w-full pl-10 pr-4 py-3 border rounded-lg placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-yellow-primary focus:border-transparent nav-transition ${
                      errors?.email ? 'border-error bg-error-50' : 'border-border bg-surface'
                    }`}
                    placeholder="Введите логин или email"
                    autoComplete="username"
                  />
                </div>
                <p className="mt-2 text-sm text-text-secondary">Можно ввести логин или email</p>
                {errors?.email && (
                  <p className="mt-2 text-sm text-error flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>{errors?.email}</span>
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                  Пароль
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
                    placeholder="Введите ваш пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-text-muted hover:text-text-primary nav-transition" />
                    ) : (
                      <Eye className="w-5 h-5 text-text-muted hover:text-text-primary nav-transition" />
                    )}
                  </button>
                </div>
                {errors?.password && (
                  <p className="mt-2 text-sm text-error flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>{errors?.password}</span>
                  </p>
                )}
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    checked={formData?.rememberMe}
                    onChange={(e) => handleInputChange('rememberMe', e?.target?.checked)}
                    className="h-4 w-4 text-yellow-primary focus:ring-yellow-primary border-border rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-text-primary">
                    Запомнить меня
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm text-yellow-primary hover:text-accent nav-transition"
                >
                  Забыли пароль?
                </button>
              </div>

              {/* reCAPTCHA */}
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-4 px-6 rounded-lg nav-transition disabled:opacity-50 disabled:cursor-not-allowed shadow-card hover:shadow-card-hover flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Вход в систему...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Войти</span>
                  </>
                )}
              </button>

              {/* Registration Link */}
              <div className="text-center pt-4 border-t border-border">
                <p className="text-text-secondary">
                  Нет аккаунта?{' '}
                  <Link to="/registration" className="text-yellow-primary hover:text-accent font-medium nav-transition">
                    Зарегистрироваться
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;