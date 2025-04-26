import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useModal } from "../contexts/ModalContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { openModal } = useModal();

  if (!isAuthenticated) {
    openModal("login");
    return <></>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
