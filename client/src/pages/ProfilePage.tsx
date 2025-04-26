import React from "react";
import styled from "styled-components";

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

// Main profile page component
const ProfilePage: React.FC = () => {
  return (
    <Container>
      <ProfileCard>
        <Title>User Profile</Title>
        <p>This page is under construction.</p>
        <p>Check back later for profile management features.</p>
      </ProfileCard>
    </Container>
  );
};

export default ProfilePage;
