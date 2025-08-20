import React from 'react';
import { Box, Container, Typography, Paper, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';

const FAQ = () => {
  const faqs = [
    {
      category: "Orders & Shipping",
      questions: [
        {
          question: "How can I track my order?",
          answer: "Once your order is shipped, you&apos;ll receive a tracking number via email and SMS. You can use this number to track your order through our website or contact our customer service."
        },
        {
          question: "How long does shipping take?",
          answer: "Delivery times vary by location: 1-2 days for Dhaka City, 2-3 days for other major cities, and 3-5 days for remote areas."
        },
        {
          question: "What are the shipping costs?",
          answer: "Inside Dhaka: ৳60, Outside Dhaka: ৳110. We offer free shipping on orders above ৳2200."
        }
      ]
    },
    {
      category: "Returns & Exchanges",
      questions: [
        {
          question: "What is your return policy?",
          answer: "We offer a 7-day return policy for unused items in their original packaging. Please contact our customer service to initiate a return."
        },
        {
          question: "Do you offer size exchanges?",
          answer: "Yes, we offer free size exchanges within 7 days of delivery, subject to availability of the desired size."
        },
        {
          question: "How do I request a return or exchange?",
          answer: "Contact our customer service team via email at tweestbd@gmail.com or WhatsApp at +88 01611-101430 with your order number and return/exchange request details."
        }
      ]
    },
    {
      category: "Payment & Pricing",
      questions: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept bKash, Nagad, Rocket, all major credit/debit cards, and cash on delivery for orders within Bangladesh."
        },
        {
          question: "Is cash on delivery available?",
          answer: "Yes, cash on delivery is available across Bangladesh. Additional charges may apply for certain locations."
        },
        {
          question: "Do you offer discounts?",
          answer: "We regularly offer seasonal discounts and promotions. Follow our social media channels or subscribe to our newsletter to stay updated."
        }
      ]
    },
    {
      category: "Customer Service",
      questions: [
        {
          question: "What are your business hours?",
          answer: "We are available from 10:00 AM to 10:00 PM (Bangladesh Time), seven days a week."
        },
        {
          question: "How can I contact customer service?",
          answer: "You can reach us through phone (+88 01611-101430), WhatsApp, or email (tweestbd@gmail.com). We typically respond within 1-2 hours during business hours."
        },
        {
          question: "Do you have a physical store?",
          answer: "Currently, we operate exclusively online to provide you with the best prices and convenience of home delivery."
        }
      ]
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 3, md: 6 }, 
            backgroundColor: '#1a1a1a',
            color: 'white',
            borderRadius: 2
          }}
        >
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              mb: 6,
              color: '#69af5a',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textAlign: 'center'
            }}
          >
            Frequently Asked Questions
          </Typography>

          {faqs.map((category, categoryIndex) => (
            <Box key={categoryIndex} sx={{ mb: 6 }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600,
                  color: '#69af5a',
                  mb: 3,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {category.category}
              </Typography>

              {category.questions.map((faq, faqIndex) => (
                <Accordion 
                  key={faqIndex}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    mb: 2,
                    '&:before': {
                      display: 'none',
                    },
                    '&.Mui-expanded': {
                      margin: '0 0 16px 0',
                    }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore sx={{ color: '#69af5a' }} />}
                    sx={{
                      '&.Mui-expanded': {
                        minHeight: 48,
                      }
                    }}
                  >
                    <Typography 
                      sx={{ 
                        fontWeight: 600,
                        color: '#69af5a'
                      }}
                    >
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography 
                      sx={{ 
                        color: 'rgba(255,255,255,0.9)',
                        lineHeight: 1.8
                      }}
                    >
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ))}
        </Paper>
      </Box>
    </Container>
  );
};

export default FAQ; 