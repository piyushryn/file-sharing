import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { API } from "../services/api";
import { useModal } from "../contexts/ModalContext";
import { useNavigate } from "react-router-dom";

// Types
interface UserFile {
  id: string;
  name: string;
  size: number;
  downloadUrl: string;
  isPremium: boolean;
  expiresAt: string;
  uploadedAt: string;
}

// Styled components
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const ProfileCard = styled.div`
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #2c3e50;
  text-align: center;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin: 1.5rem 0 1rem;
  color: #3498db;
  border-bottom: 2px solid #ecf0f1;
  padding-bottom: 0.5rem;
`;

const InfoRow = styled.div`
  display: flex;
  margin-bottom: 1rem;
  align-items: center;
`;

const Label = styled.span`
  font-weight: 500;
  width: 120px;
  color: #7f8c8d;
`;

const Value = styled.span`
  color: #2c3e50;
`;

const FileList = styled.div`
  margin-top: 1.5rem;
`;

const FileCard = styled.div`
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const FileDetails = styled.div`
  flex: 1;
`;

const FileName = styled.h3`
  font-size: 1.1rem;
  margin: 0 0 0.5rem;
  color: #2c3e50;
`;

const FileInfo = styled.div`
  font-size: 0.9rem;
  color: #7f8c8d;
  display: flex;
  gap: 1rem;
`;

const Badge = styled.span`
  background-color: #3498db;
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-left: 0.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2980b9;
  }
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
  margin: 2rem 0;
`;

const LoadingMessage = styled.p`
  text-align: center;
  color: #7f8c8d;
`;

const CopiedToast = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #2ecc71;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

// Format file size helper
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Format date helper
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Calculate time remaining helper
const getTimeRemaining = (expiryDate: string): string => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Expired";
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 24) {
    const days = Math.floor(diffHours / 24);
    return `${days} day${days !== 1 ? "s" : ""} ${diffHours % 24} hr`;
  }

  return `${diffHours} hr ${diffMinutes} min`;
};

// Main profile page component
const ProfilePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [userFiles, setUserFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const fetchUserFiles = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const response = await API.get("/files/my-uploads");
      setUserFiles(response.data);
    } catch (error) {
      console.error("Error fetching user files:", error);
    } finally {
      setLoading(false);
    }
  };
  // Fetch user files
  useEffect(() => {
    fetchUserFiles();
  }, [isAuthenticated]);

  // Copy share link to clipboard
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopyStatus("Link copied to clipboard!");

    // Clear the message after 3 seconds
    setTimeout(() => {
      setCopyStatus(null);
    }, 3000);
  };

  const { openModal } = useModal();
  if (!isAuthenticated) {
    openModal("login");
    return (
      <Container>
        <ProfileCard>
          <Title>User Profile</Title>
          <EmptyMessage>Please log in to view your profile.</EmptyMessage>
        </ProfileCard>
      </Container>
    );
  }

  return (
    <Container>
      <ProfileCard>
        <Title>User Profile</Title>

        <SectionTitle>Personal Information</SectionTitle>
        <InfoRow>
          <Label>Name:</Label>
          <Value>{user?.name}</Value>
        </InfoRow>
        <InfoRow>
          <Label>Email:</Label>
          <Value>{user?.email}</Value>
        </InfoRow>
        <InfoRow>
          <Label>Account Type:</Label>
          <Value>{user?.isAdmin ? "Admin" : "Standard User"}</Value>
        </InfoRow>

        <SectionTitle>My Uploads</SectionTitle>

        {loading ? (
          <LoadingMessage>Loading your files...</LoadingMessage>
        ) : userFiles.length > 0 ? (
          <FileList>
            {userFiles.map((file) => (
              <FileCard key={file.id}>
                <FileDetails>
                  <FileName>
                    {file.name}
                    {file.isPremium && <Badge>Premium</Badge>}
                  </FileName>
                  <FileInfo>
                    <span>{formatFileSize(file.size)}</span>
                    <span>Expires in: {getTimeRemaining(file.expiresAt)}</span>
                    <span>Uploaded: {formatDate(file.uploadedAt)}</span>
                  </FileInfo>
                </FileDetails>
                <ButtonGroup>
                  <Button
                    onClick={() =>
                      handleCopyLink(`${window.location.host}/file/${file.id}`)
                    }
                  >
                    Copy Share Link
                  </Button>
                  <Button onClick={() => navigate(`/file/${file.id}`)}>
                    View
                  </Button>
                </ButtonGroup>
              </FileCard>
            ))}
          </FileList>
        ) : (
          <EmptyMessage>You haven't uploaded any files yet.</EmptyMessage>
        )}
      </ProfileCard>

      {copyStatus && <CopiedToast>{copyStatus}</CopiedToast>}
    </Container>
  );
};

export default ProfilePage;
