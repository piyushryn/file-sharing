import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

const Container = styled.div`
  text-align: center;
  padding: 2rem 1rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  margin-bottom: 2rem;
  color: #7f8c8d;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin: 3rem 0;
`;

const Feature = styled.div`
  padding: 1.5rem;
  border-radius: 8px;
  background-color: #f8f9fa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const FeatureIcon = styled.div`
  margin-bottom: 1rem;
  color: #3498db;
  font-size: 2rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
`;

const FeatureDescription = styled.p`
  color: #7f8c8d;
`;

const CTAButton = styled(Link)`
  display: inline-block;
  background-color: #3498db;
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2980b9;
  }
`;

const FeatureList = styled.ul`
  list-style-type: none;
  padding: 0;
  text-align: left;
  margin: 0.5rem 0;
`;

const FeatureItem = styled.li`
  margin: 0.5rem 0;
  display: flex;
  align-items: center;

  &::before {
    content: "✓";
    color: #2ecc71;
    margin-right: 0.5rem;
    font-weight: bold;
  }
`;

const HomePage = () => {
  return (
    <Container>
      <Title>Secure File Sharing Made Easy</Title>
      <Subtitle>
        Upload and share files securely with time-limited links. Choose from
        flexible options to meet your needs.
      </Subtitle>

      <CTAButton to="/upload">Upload a File</CTAButton>

      <FeatureGrid>
        <Feature>
          <FeatureIcon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
              <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" />
            </svg>
          </FeatureIcon>
          <FeatureTitle>Easy Uploads</FeatureTitle>
          <FeatureDescription>
            Simple and fast file uploads with progress tracking.
          </FeatureDescription>
          <FeatureList>
            <FeatureItem>Support for any file type</FeatureItem>
            <FeatureItem>Up to 2GB for free</FeatureItem>
            <FeatureItem>Real-time progress bar</FeatureItem>
          </FeatureList>
        </Feature>

        <Feature>
          <FeatureIcon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
            </svg>
          </FeatureIcon>
          <FeatureTitle>Secure Sharing</FeatureTitle>
          <FeatureDescription>
            Security-focused file sharing with controlled access.
          </FeatureDescription>
          <FeatureList>
            <FeatureItem>Secure pre-signed URLs</FeatureItem>
            <FeatureItem>Time-limited access</FeatureItem>
            <FeatureItem>Email link sharing option</FeatureItem>
          </FeatureList>
        </Feature>

        <Feature>
          <FeatureIcon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M4 3a2 2 0 1 0 0 4h8a2 2 0 1 0 0-4H4z" />
              <path d="M5 7v1h-.5A1.5 1.5 0 0 0 3 9.5v1A1.5 1.5 0 0 0 4.5 12h1A1.5 1.5 0 0 0 7 10.5v-1A1.5 1.5 0 0 0 5.5 8H5zm-.5 1.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3-1H8v1h-.5A1.5 1.5 0 0 0 6 9.5v1A1.5 1.5 0 0 0 7.5 12h1a1.5 1.5 0 0 0 1.5-1.5v-1A1.5 1.5 0 0 0 8.5 8H8zm2 0h.5a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 9 10.5v-1A1.5 1.5 0 0 1 10.5 8H11z" />
            </svg>
          </FeatureIcon>
          <FeatureTitle>Flexible Options</FeatureTitle>
          <FeatureDescription>
            Choose from various pricing tiers based on your needs.
          </FeatureDescription>
          <FeatureList>
            <FeatureItem>Extend file validity</FeatureItem>
            <FeatureItem>Increase file size limits</FeatureItem>
            <FeatureItem>Multiple payment options</FeatureItem>
          </FeatureList>
        </Feature>
      </FeatureGrid>

      <Subtitle>
        Ready to share your files securely? Get started now with our easy upload
        process.
      </Subtitle>
      <CTAButton to="/upload">Upload a File</CTAButton>
    </Container>
  );
};

export default HomePage;
