import React, { useEffect } from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import styled from "styled-components";
import "./App.css";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";
import UpdateTitle from "./utils/Updatetitle";

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
    UpdateTitle(location);
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
          <AppRoutes />
        </MainContent>
        <Footer />
      </AppContainer>
    </Router>
  );
}
// ProtectedRoute Component

export default App;
