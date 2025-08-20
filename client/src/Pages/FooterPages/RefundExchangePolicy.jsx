import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';

const RefundExchangePolicy = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 8 }}>
        <Paper elevation={0} sx={{ p: 4, backgroundColor: '#f8f8f8' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
            Refund & Exchange Policy
          </Typography>

          <Typography variant="body1" paragraph sx={{ mb: 3, lineHeight: 1.8 }}>
            We want you to love your purchase! If you&apos;re not satisfied, we&apos;re here to help.
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Returns & Exchanges
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              <strong>Eligibility:</strong> Items must be unused, unwashed, and in their original packaging with tags attached.
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              <strong>Timeframe:</strong> You can return or exchange items within 3 days of delivery, subject to stock availability.
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              <strong>Non-Eligible Items:</strong> Sale items, discounted products, and accessories are non-refundable and non-exchangeable.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Process
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              <strong>Initiate Return/Exchange:</strong> Contact us at 01611101430 with your order number and reason for return/exchange within 3 days of delivery.
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              <strong>Shipping Returns:</strong> Ship your return to 147/C, Green Road, Dhaka-1205. Please note that the customer is responsible for the return shipping costs.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Refunds
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              <strong>Method:</strong> Refunds will be issued as online credit, allowing you to choose a similar product in the same or higher price range. No direct monetary refunds will be provided.
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              <strong>Processing Time:</strong> Once we receive and inspect your return, we will notify you of the approval or rejection. If approved, the online credit will be issued within 7 business days.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Faulty or Damaged Items
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
              If you receive a faulty or damaged item, please contact us within 24 hours of delivery. We will arrange for a replacement or provide online credit after assessing the issue.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RefundExchangePolicy; 