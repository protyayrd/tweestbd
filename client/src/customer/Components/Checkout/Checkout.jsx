import * as React from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import AddDeliveryAddressForm from "./AddAddress";
import { useLocation, useNavigate } from "react-router-dom";
import OrderSummary from "./OrderSummary";
import PaymentForm from "./PaymentForm";

const steps = [
  "Login",
  "Delivery Address",
  "Order Summary",
  "Payment",
];

export default function Checkout() {
  const [activeStep, setActiveStep] = React.useState(1);
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const step = parseInt(queryParams.get('step') || "2");

  const handleNext = () => {
    navigate(`/checkout?step=${step + 1}`);
  };

  const handleBack = () => {
    navigate(`/checkout?step=${step - 1}`);
  };

  const renderStepContent = () => {
    switch (step) {
      case 2:
        return <AddDeliveryAddressForm handleNext={handleNext} />;
      case 3:
        return <OrderSummary handleNext={handleNext} />;
      case 4:
        return <PaymentForm handleNext={handleNext} />;
      default:
        return <AddDeliveryAddressForm handleNext={handleNext} />;
    }
  };

  return (
    <Box className="px-5 lg:px-32" sx={{ width: "100%", bgcolor: "#ffffff" }}>
      <Stepper 
        activeStep={step - 1}
        sx={{
          pt: 4,
          pb: 2,
          '& .MuiStepLabel-root .Mui-completed': {
            color: '#000000', 
          },
          '& .MuiStepLabel-root .Mui-active': {
            color: '#000000',
          },
          '& .MuiStepLabel-root .Mui-active .MuiStepIcon-text': {
            fill: '#ffffff',
          },
          '& .MuiStepConnector-line': {
            borderColor: '#000000',
          }
        }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel 
              sx={{
                '& .MuiStepLabel-label': {
                  color: '#000000',
                  '&.Mui-active': {
                    color: '#000000',
                    fontWeight: 'bold',
                  },
                  '&.Mui-completed': {
                    color: '#000000',
                  }
                }
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <div className="my-5">
        {renderStepContent()}
      </div>

      <Box sx={{ display: "flex", flexDirection: "row", pt: 2, pb: 4 }}>
        <Button
          variant="outlined"
          disabled={step === 2}
          onClick={handleBack}
          sx={{ 
            mr: 1, 
            color: '#000000', 
            borderColor: '#000000',
            '&:hover': {
              borderColor: '#333333',
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            },
            '&.Mui-disabled': {
              borderColor: '#cccccc',
              color: '#cccccc'
            }
          }}
        >
          Back
        </Button>
        <Box sx={{ flex: "1 1 auto" }} />
      </Box>
    </Box>
  );
}
