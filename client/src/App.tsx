import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import styled from "styled-components";
import "./App.css";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import FileUploadPage from "./pages/FileUploadPage";
import FileDetailsPage from "./pages/FileDetailsPage";
import PaymentPage from "./pages/PaymentPage";
import NotFoundPage from "./pages/NotFoundPage";

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

// Title update component
const TitleUpdater = () => {
  const location = useLocation();

  useEffect(() => {
    let title = "FileShare - Secure File Sharing Made Easy";
    const path = location.pathname;

    // Set specific titles based on route
    if (path === "/") {
      title =
        "FileShare - Secure File Sharing Made Easy | Share Files Up to 2GB Free";
    } else if (path === "/upload") {
      title = "Upload & Share Files Securely | FileShare";
    } else if (path.includes("/file/")) {
      title = "Download Secure File | FileShare";
    } else if (path.includes("/payment/")) {
      title = "Upgrade Your File Options | FileShare";
    } else if (path === "*") {
      title = "Page Not Found | FileShare";
    }

    // Update document title
    document.title = title;
  }, [location]);

  return null;
};

function App() {
  return (
    <Router>
      <AppContainer>
        <TitleUpdater />
        <Header />
        <MainContent>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/upload" element={<FileUploadPage />} />
            <Route path="/file/:fileId" element={<FileDetailsPage />} />
            <Route path="/payment/:fileId" element={<PaymentPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </MainContent>
        <Footer />
      </AppContainer>
    </Router>
  );
}

export default App;
