import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMeQuery } from "../api/hooks";
import { useAuthStore } from "../store/authStore";

function ProtectedRoute() {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const location = useLocation();
  const meQuery = useMeQuery();

  useEffect(() => {
    if (token && meQuery.isError) {
      clearAuth();
    }
  }, [token, meQuery.isError, clearAuth]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (meQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-medical-50">
        <div className="panel px-6 py-4 text-sm font-medium text-medical-700">
          {t('errors.validatingSession')}
        </div>
      </div>
    );
  }

  if (meQuery.isError) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
