import { useMemo, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLoginMutation, useRegisterMutation } from "../api/hooks";
import { getApiErrorMessage } from "../lib/apiClient";
import { useAuthStore } from "../store/authStore";

type Mode = "login" | "register";

function LoginPage() {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();

  const isSubmitting = loginMutation.isPending || registerMutation.isPending;
  const errorMessage = useMemo(() => {
    if (loginMutation.error) {
      return getApiErrorMessage(loginMutation.error);
    }
    if (registerMutation.error) {
      return getApiErrorMessage(registerMutation.error);
    }
    return null;
  }, [loginMutation.error, registerMutation.error]);

  if (token) {
    return <Navigate to="/" replace />;
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInfoMessage(null);

    if (mode === "login") {
      loginMutation.mutate({
        email,
        password,
      });
      return;
    }

    registerMutation.mutate(
      {
        email,
        password,
        full_name: fullName.trim() || undefined,
      },
      {
        onSuccess: () => {
          setInfoMessage("User registered. Logging in...");
          loginMutation.mutate({
            email,
            password,
          });
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="panel w-full max-w-md animate-fade-up p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-600">
            ECG Platform
          </p>
          <h1 className="text-2xl font-semibold text-medical-900">{t('auth.login.title')}</h1>
          <p className="mt-1 text-sm text-medical-700">
            {t('auth.login.subtitle')}
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-lg bg-medical-100 p-1">
          <button
            type="button"
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
              mode === "login"
                ? "bg-white text-accent-700 shadow-sm"
                : "text-medical-700 hover:text-medical-900"
            }`}
            onClick={() => setMode("login")}
          >
            {t('auth.login.signIn')}
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
              mode === "register"
                ? "bg-white text-accent-700 shadow-sm"
                : "text-medical-700 hover:text-medical-900"
            }`}
            onClick={() => setMode("register")}
          >
            {t('auth.register.signUp')}
          </button>
        </div>

        <form className="space-y-3" onSubmit={submit}>
          {mode === "register" ? (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-medical-700">
                {t('auth.register.fullName')}
              </label>
              <input
                type="text"
                className="input-field"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Dr. Name"
              />
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-medical-700">
              {t('auth.login.email')}
            </label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="doctor@clinic.org"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-medical-700">
              {t('auth.login.password')}
            </label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {errorMessage ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {infoMessage ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
              {infoMessage}
            </div>
          ) : null}

          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting
              ? t('common.pleaseWait')
              : mode === "login"
                ? t('auth.login.signIn')
                : t('common.createAccount')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
