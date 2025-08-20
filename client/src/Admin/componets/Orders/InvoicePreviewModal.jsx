import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import { previewInvoicePDF } from './InvoiceImage';
import generateInvoicePDF from './InvoiceImage';

const InvoicePreviewModal = ({ open, onClose, order }) => {
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && order) {
      setLoading(true);
      setError(null);
      
      previewInvoicePDF(order)
        .then(data => {
          setPdfData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error generating invoice preview:', err);
          setError(err.message || 'Failed to generate invoice preview');
          setLoading(false);
        });
    } else {
      // Clear data when modal closes
      setPdfData(null);
      setError(null);
    }
  }, [open, order]);

  const handleDownload = () => {
    if (order) {
      try {
        // Use direct download instead of generating again
        if (pdfData) {
          const link = document.createElement('a');
          link.href = pdfData;
          link.download = `TweestBD_Invoice_${order.formattedOrderId || order._id.substring(0, 8)}.pdf`;
          link.click();
        } else {
          // Fallback to generating new PDF
          generateInvoicePDF(order)
            .then(() => {
              // Successfully downloaded
            })
            .catch(err => {
              console.error('Error downloading invoice:', err);
            });
        }
      } catch (err) {
        console.error('Error in download handler:', err);
      }
    }
  };

  const handlePrint = () => {
    if (pdfData) {
      try {
        // Open PDF in new window and print
        const printWindow = window.open(pdfData, '_blank');
        if (printWindow) {
          printWindow.addEventListener('load', () => {
            setTimeout(() => {
              try {
                printWindow.print();
              } catch (err) {
                console.error('Error printing PDF:', err);
              }
            }, 1000); // Delay to ensure PDF is loaded
          });
        } else {
          console.warn('Could not open print window. Pop-up blocker may be enabled.');
        }
      } catch (err) {
        console.error('Error in print handler:', err);
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          bgcolor: '#1e1e1e',
          color: 'white',
          minHeight: '80vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: '#121212',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Invoice Preview
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            disabled={loading || !pdfData}
            sx={{ 
              borderColor: 'rgba(255,255,255,0.3)',
              color: 'white',
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255,255,255,0.05)'
              }
            }}
          >
            Download
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={loading || !pdfData}
            sx={{ 
              borderColor: 'rgba(255,255,255,0.3)',
              color: 'white',
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255,255,255,0.05)'
              }
            }}
          >
            Print
          </Button>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ 
        p: 0, 
        bgcolor: '#252525',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            py: 10
          }}>
            <CircularProgress sx={{ mb: 2, color: '#bb86fc' }} />
            <Typography variant="body1" color="text.secondary">
              Generating invoice preview...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ 
            p: 4, 
            textAlign: 'center',
            color: 'error.main'
          }}>
            <Typography variant="body1" component="p" sx={{ mb: 1 }}>
              {error}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please try again later or contact support
            </Typography>
          </Box>
        ) : pdfData ? (
          <Box sx={{ 
            width: '100%', 
            height: '70vh',
            overflow: 'hidden',
            bgcolor: '#f5f5f5',
            display: 'flex',
            justifyContent: 'center',
            p: 0
          }}>
            <iframe 
              src={pdfData} 
              title="Invoice Preview" 
              style={{ 
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: 'white'
              }} 
              onError={(e) => {
                console.error('Error loading PDF in iframe:', e);
                setError('Failed to display PDF preview');
              }}
            />
          </Box>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body1">
              No invoice data available
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InvoicePreviewModal; 