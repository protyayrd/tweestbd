import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InventoryIcon from '@mui/icons-material/Inventory';
import HomeIcon from '@mui/icons-material/Home';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const QontoConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#00503a',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#00503a',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderTopWidth: 3,
    borderRadius: 1,
  },
}));

const QontoStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  color: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#eaeaf0',
  display: 'flex',
  height: 22,
  alignItems: 'center',
  ...(ownerState.active && {
    color: '#00503a',
  }),
  '& .QontoStepIcon-completedIcon': {
    color: '#00503a',
    zIndex: 1,
    fontSize: 24,
  },
  '& .QontoStepIcon-circle': {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: 'currentColor',
  },
  '& .QontoStepIcon-icon': {
    color: ownerState.active ? '#00503a' : ownerState.completed ? '#00503a' : '#aaa',
    fontSize: 24,
  },
}));

function QontoStepIcon(props) {
  const { active, completed, className, icon } = props;

  const icons = {
    1: <ShoppingCartIcon className="QontoStepIcon-icon" />,
    2: <InventoryIcon className="QontoStepIcon-icon" />,
    3: <LocalShippingIcon className="QontoStepIcon-icon" />,
    4: <LocalShippingIcon className="QontoStepIcon-icon" />,
    5: <HomeIcon className="QontoStepIcon-icon" />,
  };

  return (
    <QontoStepIconRoot ownerState={{ completed, active }} className={className}>
      {completed ? (
        <CheckCircleIcon className="QontoStepIcon-completedIcon" />
      ) : (
        icons[String(icon)]
      )}
    </QontoStepIconRoot>
  );
}

const steps = [
  "Placed",
  'Order Confirmed',
  'Shipped',
  'Out For Delivery',
  'Delivered'
];

export default function OrderTraker({activeStep}) {
  return (
    <Box sx={{ width: '100%', p: 1 }}>
      <Stepper activeStep={activeStep} alternativeLabel connector={<QontoConnector />}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel StepIconComponent={QontoStepIcon}>
              <Typography 
                sx={{ 
                  color: activeStep >= index ? '#00503a' : 'text.secondary',
                  fontWeight: activeStep >= index ? 600 : 400,
                  fontSize: '0.9rem'
                }}
              >
                {label}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
