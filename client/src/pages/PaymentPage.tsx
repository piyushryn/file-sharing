import React, { useState, useEffect, FormEvent, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { fileService, paymentService } from "../services/api";
import { loadStripe, Stripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { PricingTier as PTier, RazorpayResponse } from "../types";

// Define interfaces for data types
interface FileDetails {
  fileId: string;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  expiresAt: string;
  isPremium: boolean;
  validityHours: number;
  uploadedAt: string;
  email?: string;
}

interface StripePaymentFormProps {
  fileId: string;
  selectedTier: PTier;
  onPaymentSuccess: () => void;
  onBack: () => void;
}

interface RouteParams {
  fileId: string;
  [key: string]: string | undefined;
}

// Styled components
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const PaymentCard = styled.div`
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

const Subtitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #34495e;
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 2rem;
`;

const ErrorContainer = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  background-color: #fdf3f2;
  color: #e74c3c;
  border-radius: 4px;
`;

const SuccessContainer = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  background-color: #eafaf1;
  color: #27ae60;
  border-radius: 4px;
  text-align: center;
`;

const PricingTierList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
`;

const PricingTier = styled.div<{ selected: boolean }>`
  border: 2px solid ${(props) => (props.selected ? "#3498db" : "#ecf0f1")};
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  background-color: ${(props) => (props.selected ? "#f5f9ff" : "#fff")};

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

const PaymentMethodContainer = styled.div`
  margin: 2rem 0;
`;

const PaymentButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1.5rem 0;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: center;
  }
`;

const PaymentButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;

  @media (min-width: 768px) {
    width: auto;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const RazorpayButton = styled(PaymentButton)`
  background-color: #2b6de6;
  color: white;

  &:hover:not(:disabled) {
    background-color: #1a5dc8;
  }
`;

const StripeButton = styled(PaymentButton)`
  background-color: #5433ff;
  color: white;

  &:hover:not(:disabled) {
    background-color: #4525e6;
  }
`;

const BackButton = styled.button`
  background-color: #95a5a6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 1rem;

  &:hover {
    background-color: #7f8c8d;
  }
`;

const PaymentMethodTitle = styled.h3`
  margin-bottom: 1rem;
  color: #2c3e50;
  text-align: center;
`;

// Stripe payment form component
// const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
//   fileId,
//   selectedTier,
//   onPaymentSuccess,
//   onBack,
// }) => {
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [clientSecret, setClientSecret] = useState<string>("");
//   const [processing, setProcessing] = useState<boolean>(false);

//   const stripe = useStripe();
//   const elements = useElements();
//   const navigate = useNavigate();

//   useEffect(() => {
//     const initializePayment = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         const response = await paymentService.initStripePayment(
//           fileId,
//           selectedTier._id,
//           "USD"
//         );
//         setClientSecret(response.data.clientSecret);
//       } catch (err) {
//         console.error("Error initializing Stripe payment:", err);
//         setError("Failed to initialize payment. Please try again.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (fileId && selectedTier) {
//       initializePayment();
//     }
//   }, [fileId, selectedTier]);

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();

//     if (!stripe || !elements) {
//       return;
//     }

//     setProcessing(true);
//     setError(null);

//     const result = await stripe.confirmPayment({
//       elements,
//       confirmParams: {
//         return_url: `${window.location.origin}/file/${fileId}`,
//       },
//       redirect: "if_required",
//     });

//     if (result.error) {
//       setError(result.error.message || "Payment failed");
//       setProcessing(false);
//     } else if (
//       result.paymentIntent &&
//       result.paymentIntent.status === "succeeded"
//     ) {
//       // Payment succeeded, update file attributes
//       try {
//         await fileService.updateFile(fileId, {
//           maxSize: selectedTier.fileSizeLimit,
//           validityHours: selectedTier.validityInHours,
//           isPremium: true,
//         });

//         onPaymentSuccess();
//       } catch (err) {
//         console.error("Error updating file after payment:", err);
//         setError(
//           "Payment succeeded but we had trouble updating your file. Please contact support."
//         );
//         setProcessing(false);
//       }
//     }
//   };

//   if (loading) {
//     return (
//       <LoadingContainer>
//         <p>Initializing payment...</p>
//       </LoadingContainer>
//     );
//   }

//   return (
//     <div>
//       <PaymentMethodTitle>Pay with Stripe</PaymentMethodTitle>

//       {error && <ErrorContainer>{error}</ErrorContainer>}

//       <form onSubmit={handleSubmit}>
//         {clientSecret && <PaymentElement />}

//         <PaymentButtons>
//           <StripeButton
//             type="submit"
//             disabled={processing || !stripe || !elements || !clientSecret}
//           >
//             {processing
//               ? "Processing..."
//               : `Pay $${Math.ceil(selectedTier.price / 75)} USD`}
//           </StripeButton>
//           <BackButton type="button" onClick={onBack} disabled={processing}>
//             Back
//           </BackButton>
//         </PaymentButtons>
//       </form>
//     </div>
//   );
// };

// Main payment page component
const PaymentPage: React.FC = () => {
  const { fileId } = useParams<RouteParams>();
  const location = useLocation();
  const navigate = useNavigate();
  const [fileDetails, setFileDetails] = useState<FileDetails | null>(null);
  const [pricingTiers, setPricingTiers] = useState<PTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<PTier | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null); // null, 'razorpay', or 'stripe'
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

  // Initialize Stripe
  const stripePromise = loadStripe(
    process.env.REACT_APP_STRIPE_PUBLIC_KEY || ""
  );
  const params = new URLSearchParams(location.search);
  const tier = params.get("tier");
  const shouldOpen = params.get("shouldOpen");

  const removeShouldOpenParam = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("shouldOpen");
    window.history.replaceState({}, document.title, url.toString());
  }, []);

  // Extract tier ID from URL query parameters
  useEffect(() => {
    if (shouldOpen === "true") {
      startWithRazorpay();
    }
    setSelectedTierId(tier);
  }, [tier, shouldOpen]);

  //default start with razorpay
  const startWithRazorpay = async () => {
    removeShouldOpenParam();
    await handleRazorpayPayment();
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!fileId) {
        setError("File ID is missing");
        setLoading(false);
        return;
      }

      // Fetch file details
      const fileResponse = await fileService.getFileById(fileId);
      setFileDetails(fileResponse.data);

      // Fetch pricing tiers
      const pricingResponse = await paymentService.getPricingTiers();
      const activeTiers = pricingResponse.data.filter((tier) => tier.price > 0);
      setPricingTiers(activeTiers);

      // Pre-select tier from URL if provided
      if (selectedTierId) {
        const preselectedTier = activeTiers.find(
          (tier) => tier._id === selectedTierId
        );
        if (preselectedTier) {
          setSelectedTier(preselectedTier);
        }
      } else if (activeTiers.length > 0) {
        // Default to first tier
        setSelectedTier(activeTiers[0]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load payment information. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  // Fetch file details and pricing tiers
  useEffect(() => {
    fetchData();
  }, [fileId, selectedTierId]);

  useEffect(() => {
    console.error("error:", error);
  }, [error]);

  // Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    if (!selectedTier || !fileId) {
      setError("Missing file or pricing information");
      return;
    }

    try {
      setError(null);

      // Initialize Razorpay payment
      const response = await paymentService.initRazorpayPayment(
        fileId,
        selectedTier._id
      );

      const options = {
        key: response.data.keyId,
        amount: response.data.amount * 100, // Convert to paise
        currency: response.data.currency,
        name: "FileShare",
        description: `Upgrade to ${selectedTier.name}`,
        order_id: response.data.orderId,
        handler: async function (razorpayResponse: RazorpayResponse) {
          console.log({ razorpayResponse });
          try {
            // Verify payment with backend
            const verifyResponse = await paymentService.verifyRazorpayPayment(
              response.data.paymentId,
              razorpayResponse.razorpay_payment_id,
              razorpayResponse.razorpay_order_id,
              razorpayResponse.razorpay_signature
            );

            if (verifyResponse.data.success) {
              setPaymentSuccess(true);

              // Redirect to file page after 2 seconds
              setTimeout(() => {
                navigate(`/file/${fileId}`);
              }, 2000);
            } else {
              setError("Payment verification failed. Please contact support.");
            }
          } catch (err) {
            console.error("Payment verification failed:", err);
            setError("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "",
          email: fileDetails?.email || "",
        },
        theme: {
          color: "#3498db",
        },
      };

      // Open Razorpay payment modal
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Error initializing Razorpay payment:", err);
      setError("Failed to initialize payment. Please try again.");
    }
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);

    // Redirect to file page after 2 seconds
    setTimeout(() => {
      navigate(`/file/${fileId}`);
    }, 2000);
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <h2>Loading payment options...</h2>
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <PaymentCard>
        <Title>Upgrade Your File</Title>

        {error && <ErrorContainer>{error}</ErrorContainer>}

        {paymentSuccess ? (
          <SuccessContainer>
            <h2>Payment Successful!</h2>
            <p>
              Your file has been upgraded successfully. Redirecting you back to
              the file page...
            </p>
          </SuccessContainer>
        ) : (
          <>
            {fileDetails && (
              <div>
                <Subtitle>Select a Pricing Plan</Subtitle>

                <PricingTierList>
                  {pricingTiers.map((tier) => (
                    <PricingTier
                      key={tier._id}
                      selected={selectedTier?._id === tier._id}
                      onClick={() => setSelectedTier(tier)}
                    >
                      <TierName>{tier.name}</TierName>
                      <TierPrice>₹{tier.price}</TierPrice>
                      <TierFeature>
                        {tier.fileSizeLimit}GB File Size Limit
                      </TierFeature>
                      <TierFeature>
                        {tier.validityInHours} Hours Validity
                      </TierFeature>
                    </PricingTier>
                  ))}
                </PricingTierList>

                {selectedTier && !paymentMethod && (
                  <PaymentMethodContainer>
                    <PaymentMethodTitle>
                      Select Payment Method
                    </PaymentMethodTitle>
                    <PaymentButtons>
                      <RazorpayButton onClick={() => handleRazorpayPayment()}>
                        Pay with Razorpay (INR)
                      </RazorpayButton>
                      {/* <StripeButton onClick={() => setPaymentMethod("stripe")}>
                        Pay with Stripe (USD)
                      </StripeButton> */}
                    </PaymentButtons>
                  </PaymentMethodContainer>
                )}

                {selectedTier && paymentMethod === "stripe" && (
                  <Elements
                    stripe={stripePromise}
                    options={{ clientSecret: undefined }}
                  >
                    {/* <StripePaymentForm
                      fileId={fileId || ""}
                      selectedTier={selectedTier}
                      onPaymentSuccess={handlePaymentSuccess}
                      onBack={() => setPaymentMethod(null)}
                    /> */}
                  </Elements>
                )}
              </div>
            )}
          </>
        )}
      </PaymentCard>
    </Container>
  );
};

export default PaymentPage;
