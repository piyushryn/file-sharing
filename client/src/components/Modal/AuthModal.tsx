import React, { useState } from "react";
import styled from "styled-components";
import Modal from "./Modal";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../contexts/AuthContext";

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
`;

interface TabProps {
  active: boolean;
}

const Tab = styled.button<TabProps>`
  flex: 1;
  padding: 10px;
  background: none;
  border: none;
  font-size: 18px;
  font-weight: ${(props) => (props.active ? "600" : "400")};
  color: ${(props) => (props.active ? "#3498db" : "#7f8c8d")};
  border-bottom: 2px solid
    ${(props) => (props.active ? "#3498db" : "transparent")};
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    color: #3498db;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #2c3e50;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const SubmitButton = styled.button`
  padding: 10px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2980b9;
  }

  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 14px;
  margin-top: 15px;
`;

const SuccessMessage = styled.div`
  color: #2ecc71;
  font-size: 14px;
  margin-top: 15px;
`;

const AuthModal: React.FC = () => {
  const { modalType, closeModal } = useModal();
  const { login, register, error } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">(
    modalType === "register" ? "register" : "login"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");

  const switchTab = (tab: "login" | "register") => {
    setActiveTab(tab);
    // Reset form fields and errors when switching tabs
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFormError("");
    setSuccess("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");

    if (!email || !password) {
      setFormError("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      setSuccess("Login successful!");

      // Close modal after successful login
      setTimeout(() => {
        closeModal();
      }, 1000);
    } catch (err) {
      // Error is already handled in the context
      setFormError("");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");

    // Validate form
    if (!name || !email || !password || !confirmPassword) {
      setFormError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long");
      return;
    }

    try {
      setLoading(true);
      await register(name, email, password);
      setSuccess("Registration successful!");

      // Close modal after successful registration
      setTimeout(() => {
        closeModal();
      }, 1000);
    } catch (err) {
      // Error is already handled in the context
      setFormError("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={!!modalType} onClose={closeModal}>
      <TabContainer>
        <Tab active={activeTab === "login"} onClick={() => switchTab("login")}>
          Login
        </Tab>
        <Tab
          active={activeTab === "register"}
          onClick={() => switchTab("register")}
        >
          Register
        </Tab>
      </TabContainer>

      {activeTab === "login" ? (
        <Form onSubmit={handleLogin}>
          <FormGroup>
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </FormGroup>
          <SubmitButton type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </SubmitButton>
          {formError && <ErrorMessage>{formError}</ErrorMessage>}
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}
        </Form>
      ) : (
        <Form onSubmit={handleRegister}>
          <FormGroup>
            <Label htmlFor="register-name">Full Name</Label>
            <Input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoComplete="name"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="register-password">Password</Label>
            <Input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="register-confirm-password">Confirm Password</Label>
            <Input
              id="register-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
          </FormGroup>
          <SubmitButton type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </SubmitButton>
          {formError && <ErrorMessage>{formError}</ErrorMessage>}
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}
        </Form>
      )}
    </Modal>
  );
};

export default AuthModal;
