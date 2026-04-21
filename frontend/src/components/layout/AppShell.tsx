import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { queryClient } from "../../lib/queryClient";
import { useAnalysisStore } from "../../store/analysisStore";
import { useAuthStore } from "../../store/authStore";
import LanguageSwitcher from "../LanguageSwitcher";

interface AppShellProps {
  children: ReactNode;
}

function RoleBadge({ role }: { role: string }) {
  const { t } = useTranslation();
  const isDoctor = role === "doctor";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isDoctor ? "bg-accent-100 text-accent-700" : "bg-emerald-100 text-emerald-700"
      }`}
    >
      {isDoctor ? "🩺" : "🧑"}
      {isDoctor ? t("roles.doctor") : t("roles.patient")}
    </span>
  );
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
    isActive
      ? "bg-accent-100 text-accent-700"
      : "text-medical-700 hover:bg-medical-100 hover:text-medical-900"
  }`;

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

  const isPatient = user?.role === "patient";

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-10">
      <header className="panel mb-4 animate-fade-up px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-600">
              ECG Analysis System
            </p>
            <h1 className="text-xl font-semibold text-medical-900">{t("navigation.dashboard")}</h1>
          </div>
          <div className="flex items-center gap-3">
            {user?.role && <RoleBadge role={user.role} />}
            <div className="rounded-lg border border-medical-200 bg-medical-50 px-3 py-2 text-sm text-medical-800">
              {user?.email ?? t("common.unknownUser")}
            </div>
            <LanguageSwitcher />
            <button type="button" onClick={handleLogout} className="btn-secondary">
              {t("auth.logout")}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-3 flex gap-1 border-t border-medical-100 pt-3">
          <NavLink to="/" className={navLinkClass} end>
            {t("navigation.dashboard")}
          </NavLink>
          <NavLink to="/records" className={navLinkClass}>
            {t("navigation.records")}
          </NavLink>
        </nav>
      </header>

      {/* Patient info banner */}
      {isPatient && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 animate-fade-up">
          <span className="font-semibold">{t("roles.patientView")}</span>
          {" — "}
          {t("roles.patientViewDesc")}
        </div>
      )}

      <main>{children}</main>
    </div>
  );
}

export default AppShell;
