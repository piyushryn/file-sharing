import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { fileService, uploadFileToS3 } from "../services/api";

// Define types for styled components with props
interface UploadAreaProps {
  isDragging: boolean;
}

interface ProgressFillProps {
  progress: number;
}

interface ButtonProps {
  disabled?: boolean;
}

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1.5rem;
  text-align: center;
  color: #2c3e50;
`;

const UploadCard = styled.div`
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
`;

const UploadArea = styled.div<UploadAreaProps>`
  border: 2px dashed #bdc3c7;
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
  margin-bottom: 1.5rem;
  background-color: ${(props) => (props.isDragging ? "#f5f9ff" : "#f8f9fa")};
  border-color: ${(props) => (props.isDragging ? "#3498db" : "#bdc3c7")};

  &:hover {
    border-color: #3498db;
    background-color: #f5f9ff;
  }
`;

const UploadIcon = styled.div`
  margin-bottom: 1rem;
  color: #3498db;
`;

const UploadText = styled.p`
  margin-bottom: 0.5rem;
  color: #7f8c8d;
`;

const UploadSubtext = styled.p`
  font-size: 0.9rem;
  color: #95a5a6;
`;

const HiddenInput = styled.input`
  display: none;
`;

const ProgressContainer = styled.div`
  margin-top: 1.5rem;
`;

const ProgressBar = styled.div`
  height: 8px;
  background-color: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressFill = styled.div<ProgressFillProps>`
  height: 100%;
  background-color: #3498db;
  width: ${(props) => props.progress}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.p`
  font-size: 0.9rem;
  color: #7f8c8d;
  display: flex;
  justify-content: space-between;
`;

const FilePreview = styled.div`
  display: flex;
  align-items: center;
  margin: 1rem 0;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
`;

const FileIcon = styled.div`
  margin-right: 1rem;
  color: #3498db;
`;

const FileInfo = styled.div`
  flex: 1;
`;

const FileName = styled.p`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const FileSize = styled.p`
  font-size: 0.9rem;
  color: #7f8c8d;
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  background-color: #fdf3f2;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const Button = styled.button<ButtonProps>`
  background-color: ${(props) => (props.disabled ? "#95a5a6" : "#3498db")};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: background-color 0.2s;
  width: 100%;

  &:hover {
    background-color: ${(props) => (props.disabled ? "#95a5a6" : "#2980b9")};
  }
`;

const EmailInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dce0e3;
  border-radius: 4px;
  font-size: 1rem;
  margin-bottom: 1rem;

  &:focus {
    border-color: #3498db;
    outline: none;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
`;

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

type UploadStage = "select" | "uploading" | "confirming" | "complete";

interface ApiError extends Error {
  response?: {
    data: {
      requiresUpgrade?: boolean;
      message?: string;
    };
  };
}

const FileUploadPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [uploadStage, setUploadStage] = useState<UploadStage>("select");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleSelectedFile(files[0]);
    }
  };

  const handleSelectedFile = (file: File): void => {
    if (!file) return;

    // Check file size (maximum 2GB for free tier)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB in bytes
    if (file.size > maxSize) {
      setError(
        `File is too large. Maximum size for free upload is 2GB. You can upgrade after uploading to increase limits.`
      );
      return;
    }

    setSelectedFile(file);
    setError("");
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (): void => {
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleSelectedFile(event.dataTransfer.files[0]);
    }
  };

  const handleClickUpload = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async (): Promise<void> => {
    if (!selectedFile || isUploading) return;

    try {
      setIsUploading(true);
      setError("");
      setUploadStage("uploading");

      // Step 1: Get pre-signed URL from server
      const response = await fileService.getUploadUrl(
        selectedFile.name,
        selectedFile.type,
        selectedFile.size
      );

      const { uploadUrl, fileId } = response.data;

      // Step 2: Upload file directly to S3 with progress tracking
      await uploadFileToS3(selectedFile, uploadUrl, (progress: number) => {
        setUploadProgress(progress);
      });

      // Step 3: Confirm upload is complete and get download URL
      setUploadStage("confirming");
      await fileService.confirmUpload(fileId, email || null);

      // Step 4: Navigate to file details page
      setUploadStage("complete");
      navigate(`/file/${fileId}`);
    } catch (error) {
      console.error("Error uploading file:", error);
      setIsUploading(false);
      const apiError = error as ApiError;
      if (apiError.response && apiError.response.data.requiresUpgrade) {
        setError(
          `This file exceeds the free size limit. Please upload a smaller file or complete the upload and upgrade.`
        );
      } else {
        setError("Error uploading file. Please try again.");
      }
      setUploadStage("select");
    }
  };

  return (
    <Container>
      <Title>Upload Your File</Title>

      <UploadCard>
        {uploadStage === "select" && (
          <>
            <UploadArea
              isDragging={isDragging}
              onClick={handleClickUpload}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <UploadIcon>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                  <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" />
                </svg>
              </UploadIcon>
              <UploadText>
                Drag & drop your file here or click to browse
              </UploadText>
              <UploadSubtext>
                Supports any file type up to 2GB (free)
              </UploadSubtext>
              <HiddenInput
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
            </UploadArea>

            {error && <ErrorMessage>{error}</ErrorMessage>}

            {selectedFile && (
              <FilePreview>
                <FileIcon>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4z" />
                    <path d="M4.5 12.5A.5.5 0 0 1 5 12h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 10h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 8h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 4h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z" />
                  </svg>
                </FileIcon>
                <FileInfo>
                  <FileName>{selectedFile.name}</FileName>
                  <FileSize>{formatFileSize(selectedFile.size)}</FileSize>
                </FileInfo>
              </FilePreview>
            )}

            <FormGroup>
              <Label>Email (optional)</Label>
              <EmailInput
                type="email"
                placeholder="Enter your email to receive the download link"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormGroup>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? "Uploading..." : "Upload File"}
            </Button>
          </>
        )}

        {(uploadStage === "uploading" || uploadStage === "confirming") && (
          <>
            <ProgressContainer>
              <UploadText>
                {uploadStage === "uploading"
                  ? "Uploading your file..."
                  : "Processing your file..."}
              </UploadText>
              <ProgressBar>
                <ProgressFill
                  progress={uploadStage === "confirming" ? 100 : uploadProgress}
                />
              </ProgressBar>
              <ProgressText>
                <span>
                  {uploadStage === "confirming"
                    ? "Generating secure link..."
                    : `${uploadProgress}%`}
                </span>
                {uploadStage === "uploading" && selectedFile && (
                  <span>{formatFileSize(selectedFile.size)}</span>
                )}
              </ProgressText>
            </ProgressContainer>

            {selectedFile && (
              <FilePreview>
                <FileIcon>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4z" />
                    <path d="M4.5 12.5A.5.5 0 0 1 5 12h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 10h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 8h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 4h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z" />
                  </svg>
                </FileIcon>
                <FileInfo>
                  <FileName>{selectedFile.name}</FileName>
                  <FileSize>{formatFileSize(selectedFile.size)}</FileSize>
                </FileInfo>
              </FilePreview>
            )}
          </>
        )}
      </UploadCard>
    </Container>
  );
};

export default FileUploadPage;
