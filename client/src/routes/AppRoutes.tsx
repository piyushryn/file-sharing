import { Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import FileUploadPage from "../pages/FileUploadPage";
import FileDetailsPage from "../pages/FileDetailsPage";
import PaymentPage from "../pages/PaymentPage";
import NotFoundPage from "../pages/NotFoundPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/upload" element={<FileUploadPage />} />
      <Route path="/file/:fileId" element={<FileDetailsPage />} />
      <Route path="/payment/:fileId" element={<PaymentPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
