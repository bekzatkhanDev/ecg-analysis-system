import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { queryClient } from "../../lib/queryClient";
import { useAnalysisStore } from "../../store/analysisStore";
import { useAuthStore } from "../../store/authStore";
import LanguageSwitcher from "../LanguageSwitcher";

interface AppShellProps {
  children: ReactNode;
}

function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const resetSession = useAnalysisStore((state) => state.resetSession);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    resetSession();
    queryClient.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-10">
      <header className="panel mb-6 animate-fade-up px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-600">
              {t('common.about')}
            </p>
            <h1 className="text-xl font-semibold text-medical-900">{t('navigation.dashboard')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-medical-200 bg-medical-50 px-3 py-2 text-sm text-medical-800">
              {user?.email ?? "Unknown user"}
            </div>
            <LanguageSwitcher />
            <button type="button" onClick={handleLogout} className="btn-secondary">
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

export default AppShell;
