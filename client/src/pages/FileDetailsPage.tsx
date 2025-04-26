import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import styled from "styled-components";
import { FileDetails, fileService, paymentService } from "../services/api";
import { PricingTier as PTier } from "../types";

interface RouteParams {
  fileId: string;
}

// Styled components
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const FileCard = styled.div`
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
  word-break: break-word;
`;

const FileInfo = styled.div`
  margin-bottom: 2rem;
`;

const InfoRow = styled.div`
  display: flex;
  margin-bottom: 0.75rem;
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

const DownloadButton = styled.a`
  display: inline-block;
  background-color: #3498db;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  margin-right: 1rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2980b9;
  }
`;

const CopyButton = styled.button`
  background-color: #ecf0f1;
  color: #2c3e50;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #dfe6e9;
  }

  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

interface ExpiryContainerProps {
  expiringSoon: boolean;
}

const ExpiryContainer = styled.div<ExpiryContainerProps>`
  margin-top: 2rem;
  padding: 1rem;
  background-color: ${(props) => (props.expiringSoon ? "#fff3cd" : "#e8f4fd")};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

interface ExpiryTextProps {
  expiringSoon: boolean;
}

const ExpiryText = styled.div<ExpiryTextProps>`
  color: ${(props) => (props.expiringSoon ? "#856404" : "#0c5460")};
  flex: 1;
`;

const ExpiryTitle = styled.h3`
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
`;

const ExpiryDescription = styled.p`
  font-size: 0.95rem;
  margin-bottom: 0;
`;

const UpgradeLink = styled(Link)`
  background-color: #2ecc71;
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  margin-left: 1.5rem;
  white-space: nowrap;

  &:hover {
    background-color: #27ae60;
  }
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 2rem;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 2rem;
  color: #e74c3c;
`;

const PricingTierContainer = styled.div`
  margin-top: 2rem;
  border-top: 1px solid #ecf0f1;
  padding-top: 2rem;
`;

const PricingTierTitle = styled.h3`
  margin-bottom: 1rem;
  color: #2c3e50;
`;

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
`;

const PricingTier = styled.div`
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const TierName = styled.h4`
  margin-bottom: 0.5rem;
  color: #2c3e50;
`;

const TierPrice = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #3498db;
`;

const TierFeature = styled.div`
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #7f8c8d;
`;

const TierButton = styled(Link)`
  display: inline-block;
  background-color: #3498db;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  margin-top: 1rem;
  font-size: 0.9rem;

  &:hover {
    background-color: #2980b9;
  }
`;

const CopiedNotification = styled.div`
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

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Helper function to format remaining time
const formatRemainingTime = (expiryDate: string): string => {
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

const FileDetailsPage: React.FC = () => {
  // @ts-ignore need to ignore this for now
  const { fileId } = useParams<RouteParams>();
  const [fileDetails, setFileDetails] = useState<FileDetails | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [pricingTiers, setPricingTiers] = useState<PTier[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<string>("");
  const [isExpiringSoon, setIsExpiringSoon] = useState<boolean>(false);

  // Fetch file details
  useEffect(() => {
    const fetchFileDetails = async (): Promise<void> => {
      try {
        const response = await fileService.getFileById(fileId!);
        setFileDetails(response.data);

        // Check if the file is expiring soon (less than 1 hour)
        const expiryDate = new Date(response.data.expiresAt);
        const now = new Date();
        const diffMs = expiryDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        setIsExpiringSoon(diffHours < 1);
      } catch (err) {
        console.error("Error fetching file details:", err);
        setError("This file does not exist or has expired.");
      } finally {
        setLoading(false);
      }
    };

    const fetchPricingTiers = async (): Promise<void> => {
      try {
        const response = await paymentService.getPricingTiers();
        setPricingTiers(response.data.filter((tier: PTier) => tier.price > 0)); // Filter out free tier
      } catch (err) {
        console.error("Error fetching pricing tiers:", err);
      }
    };

    fetchFileDetails();
    fetchPricingTiers();
  }, [fileId]);

  // Update countdown timer every minute
  useEffect(() => {
    if (!fileDetails) return;

    const updateCountdown = (): void => {
      const remaining = formatRemainingTime(fileDetails.expiresAt);
      setCountdown(remaining);
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 60000); // Update every minute

    return () => intervalId && clearInterval(intervalId);
  }, [fileDetails]);

  const handleCopyLink = (): void => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <h2>Loading file details...</h2>
        </LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorContainer>
          <h2>{error}</h2>
          <p>
            The file you are looking for may have been removed or has expired.
          </p>
          <Link to="/upload">Upload a new file</Link>
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      <FileCard>
        <Title>{fileDetails!.fileName}</Title>

        <FileInfo>
          <InfoRow>
            <Label>File Size:</Label>
            <Value>{formatFileSize(fileDetails!.fileSize)}</Value>
          </InfoRow>
          <InfoRow>
            <Label>Expiry Time:</Label>
            <Value>{countdown}</Value>
          </InfoRow>
          <InfoRow>
            <Label>Upload Date:</Label>
            <Value>{new Date(fileDetails!.uploadedAt).toLocaleString()}</Value>
          </InfoRow>
          {fileDetails!.isPremium && (
            <InfoRow>
              <Label>Status:</Label>
              <Value>Premium</Value>
            </InfoRow>
          )}
        </FileInfo>

        <DownloadButton
          href={fileDetails!.downloadUrl}
          download={fileDetails!.fileName}
        >
          Download File
        </DownloadButton>
        <CopyButton onClick={handleCopyLink}>Copy Share Link</CopyButton>

        <ExpiryContainer expiringSoon={isExpiringSoon}>
          <ExpiryText expiringSoon={isExpiringSoon}>
            <ExpiryTitle>
              {isExpiringSoon
                ? "File Expiring Soon!"
                : "File Expiry Information"}
            </ExpiryTitle>
            <ExpiryDescription>
              {isExpiringSoon
                ? `This file will expire in ${countdown}. Upgrade now to extend availability.`
                : `This file will be available for ${countdown}. After that, it will be automatically deleted.`}
            </ExpiryDescription>
          </ExpiryText>

          {!fileDetails!.isPremium && (
            <UpgradeLink to={`/payment/${fileId}`}>Upgrade Now</UpgradeLink>
          )}
        </ExpiryContainer>

        {!fileDetails!.isPremium && pricingTiers.length > 0 && (
          <PricingTierContainer>
            <PricingTierTitle>Upgrade Options</PricingTierTitle>
            <p>
              Extend your file's availability and increase size limits with our
              premium options:
            </p>

            <PricingGrid>
              {pricingTiers.map((tier) => (
                <PricingTier key={tier._id}>
                  <TierName>{tier.name}</TierName>
                  <TierPrice>₹{tier.price}</TierPrice>
                  <TierFeature>
                    {tier.fileSizeLimit}GB File Size Limit
                  </TierFeature>
                  <TierFeature>
                    {tier.validityInHours} Hours Validity
                  </TierFeature>
                  <TierButton to={`/payment/${fileId}?tier=${tier._id}`}>
                    Select Plan
                  </TierButton>
                </PricingTier>
              ))}
            </PricingGrid>
          </PricingTierContainer>
        )}
      </FileCard>

      {copied && (
        <CopiedNotification>Link copied to clipboard!</CopiedNotification>
      )}
    </Container>
  );
};

export default FileDetailsPage;
