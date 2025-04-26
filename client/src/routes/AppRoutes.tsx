import { Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import FileUploadPage from "../pages/FileUploadPage";
import FileDetailsPage from "../pages/FileDetailsPage";
import PaymentPage from "../pages/PaymentPage";
import NotFoundPage from "../pages/NotFoundPage";
import ProtectedRoute from "./ProtectedRoute";
import ProfilePage from "../pages/ProfilePage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/upload" element={<FileUploadPage />} />
      <Route path="/file/:fileId" element={<FileDetailsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route
        path="/payment/:fileId"
        element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
