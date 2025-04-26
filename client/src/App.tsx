import React, { useEffect } from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import styled from "styled-components";
import "./App.css";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";
import UpdateTitle from "./utils/Updatetitle";
import AuthModal from "./components/Modal/AuthModal";

// Contexts
import { AuthProvider } from "./contexts/AuthContext";
import { ModalProvider } from "./contexts/ModalContext";

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 20px 0px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

// Title update component
const TitleUpdater = () => {
  const location = useLocation();

  useEffect(() => {
    UpdateTitle(location);
  }, [location]);

  return null;
};

function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <Router>
          <AppContainer>
            <TitleUpdater />
            <Header />
            <MainContent>
              <AppRoutes />
            </MainContent>
            <Footer />
            <AuthModal />
          </AppContainer>
        </Router>
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;
