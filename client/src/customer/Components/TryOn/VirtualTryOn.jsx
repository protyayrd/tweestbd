import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  IconButton,
  Paper,
  LinearProgress,
  Snackbar,
  Backdrop,
} from '@mui/material';
import {
  CloudUpload,
  Person,
  Checkroom,
  AutoAwesome,
  Download,
  Share,
  Refresh,
  Close,
  PhotoCamera,
  Warning,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import tryOnService from '../../../services/tryonService';

const StyledContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
}));

const UploadBox = styled(Paper)(({ theme, isDragOver, hasImage, isError }) => ({
  border: `2px dashed ${
    isError 
      ? theme.palette.error.main 
      : isDragOver 
        ? theme.palette.primary.main 
        : theme.palette.grey[300]
  }`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backgroundColor: hasImage 
    ? theme.palette.grey[50] 
    : isError 
      ? theme.palette.error.light + '10'
      : 'transparent',
  minHeight: 200,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    borderColor: isError ? theme.palette.error.main : theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
}));

const PreviewImage = styled('img')({
  maxWidth: '100%',
  maxHeight: 180,
  borderRadius: 8,
  objectFit: 'cover',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
});

const ResultCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(3),
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  overflow: 'hidden',
  border: `1px solid ${theme.palette.divider}`,
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
  border: 0,
  borderRadius: 25,
  boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
  color: 'white',
  height: 48,
  padding: '0 30px',
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  '&:hover': {
    background: 'linear-gradient(45deg, #FE6B8B 60%, #FF8E53 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px 2px rgba(255, 105, 135, .4)',
  },
  '&:disabled': {
    background: 'linear-gradient(45deg, #ccc 30%, #999 90%)',
    color: 'white',
    opacity: 0.7,
  },
}));

const StatusChip = styled(Chip)(({ status, theme }) => ({
  fontWeight: 600,
  ...(status === 'success' && {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.dark,
  }),
  ...(status === 'error' && {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
  }),
  ...(status === 'processing' && {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.dark,
  }),
}));

const VirtualTryOn = () => {
  const [personImage, setPersonImage] = useState(null);
  const [clothingImage, setClothingImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragStates, setDragStates] = useState({ person: false, clothing: false });
  const [uploadErrors, setUploadErrors] = useState({ person: null, clothing: null });
  const [processingStatus, setProcessingStatus] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const personInputRef = useRef();
  const clothingInputRef = useRef();

  const showMessage = (message, isError = false) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
    if (isError) {
      toast.error(message);
    } else {
      toast.success(message);
    }
  };

  const validateAndUploadImage = useCallback((file, type) => {
    // Clear previous errors
    setUploadErrors(prev => ({ ...prev, [type]: null }));
    
    if (!file) {
      const errorMsg = 'No file selected';
      setUploadErrors(prev => ({ ...prev, [type]: errorMsg }));
      return false;
    }

    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Please select a valid image file (JPEG, PNG, WebP)';
      setUploadErrors(prev => ({ ...prev, [type]: errorMsg }));
      toast.error(errorMsg);
      return false;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const errorMsg = 'Image size must be less than 10MB';
      setUploadErrors(prev => ({ ...prev, [type]: errorMsg }));
      toast.error(errorMsg);
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'person') {
        setPersonImage({ file, preview: e.target.result });
      } else {
        setClothingImage({ file, preview: e.target.result });
      }
    };
    reader.readAsDataURL(file);
    setError(null);
    
    return true;
  }, []);

  const handleImageUpload = useCallback((file, type) => {
    validateAndUploadImage(file, type);
  }, [validateAndUploadImage]);

  const handleDrop = useCallback((e, type) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [type]: false }));
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleImageUpload(files[0], type);
    }
  }, [handleImageUpload]);

  const handleDragOver = useCallback((e, type) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [type]: true }));
  }, []);

  const handleDragLeave = useCallback((e, type) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [type]: false }));
  }, []);

  const handleFileSelect = useCallback((e, type) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file, type);
    }
  }, [handleImageUpload]);

  const removeImage = useCallback((type) => {
    if (type === 'person') {
      setPersonImage(null);
    } else {
      setClothingImage(null);
    }
    setUploadErrors(prev => ({ ...prev, [type]: null }));
  }, []);

  const updateProgress = useCallback((message, progressValue) => {
    setProcessingStatus(message);
    setProgress(progressValue);
  }, []);

  const handleTryOn = async () => {
    if (!personImage || !clothingImage) {
      toast.error('Please upload both person and clothing images');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResultImage(null);
    setProcessingStatus('Initializing...');

    try {
      // Simulate progress updates with more detailed messages
      const progressSteps = [
        { message: 'Uploading images...', progress: 10 },
        { message: 'Preparing AI model...', progress: 25 },
        { message: 'Processing virtual try-on...', progress: 40 },
        { message: 'Generating result...', progress: 70 },
        { message: 'Finalizing...', progress: 90 }
      ];

      let currentStep = 0;
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          const step = progressSteps[currentStep];
          updateProgress(step.message, step.progress);
          currentStep++;
        }
      }, 3000);

      const result = await tryOnService.performTryOn(
        personImage.file,
        clothingImage.file,
        {
          garmentDescription: "clothing item",
          denoiseSteps: 30
        }
      );

      clearInterval(progressInterval);
      updateProgress('Complete!', 100);

      if (result.success) {
        setResultImage(result.resultImage);
        showMessage('Virtual try-on completed successfully! 🎉');
      } else {
        let errorMessage = result.error || 'Unknown error occurred';
        
        // Provide more user-friendly error messages
        if (errorMessage.includes('CORS')) {
          errorMessage = 'Network configuration issue. Please try again or contact support.';
        } else if (errorMessage.includes('token')) {
          errorMessage = 'Service configuration issue. Please contact support.';
        } else if (errorMessage.includes('timeout')) {
          errorMessage = 'Processing took too long. Please try with smaller images.';
        } else if (errorMessage.includes('Backend Error')) {
          errorMessage = 'Server processing error. Please try again later.';
        }
        
        setError(errorMessage);
        showMessage(errorMessage, true);
      }
    } catch (err) {
      console.error('Try-on error:', err);
      const errorMessage = err.message || 'Failed to process virtual try-on';
      setError(errorMessage);
      showMessage(errorMessage, true);
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProcessingStatus('');
    }
  };

  const downloadResult = () => {
    if (resultImage) {
      try {
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `tweest-virtual-tryon-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showMessage('Image downloaded successfully!');
      } catch (error) {
        showMessage('Failed to download image', true);
      }
    }
  };

  const shareResult = async () => {
    if (navigator.share && resultImage) {
      try {
        await navigator.share({
          title: 'My Virtual Try-On Result',
          text: 'Check out my virtual try-on result from Tweest!',
          url: window.location.href,
        });
        showMessage('Shared successfully!');
      } catch (err) {
        if (err.name !== 'AbortError') {
          showMessage('Sharing failed', true);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showMessage('Link copied to clipboard!');
      } catch (error) {
        showMessage('Failed to copy link', true);
      }
    }
  };

  const resetAll = () => {
    setPersonImage(null);
    setClothingImage(null);
    setResultImage(null);
    setError(null);
    setProgress(0);
    setProcessingStatus('');
    setUploadErrors({ person: null, clothing: null });
    showMessage('Reset complete - ready for new try-on!');
  };

  return (
    <StyledContainer maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box textAlign="center" mb={6}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #fff 30%, #f0f0f0 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            Virtual Try-On
          </Typography>
          <Typography variant="h6" color="white" sx={{ opacity: 0.9, mb: 4 }}>
            See how clothes look on you with AI-powered virtual fitting
          </Typography>
          
          {/* Status Indicator */}
          {isProcessing && (
            <StatusChip 
              icon={<AutoAwesome />}
              label={processingStatus || 'Processing...'}
              status="processing"
              sx={{ mb: 2 }}
            />
          )}
          
          {resultImage && !isProcessing && (
            <StatusChip 
              icon={<CheckCircle />}
              label="Try-on Complete!"
              status="success"
              sx={{ mb: 2 }}
            />
          )}
          
          {error && !isProcessing && (
            <StatusChip 
              icon={<Error />}
              label="Try-on Failed"
              status="error"
              sx={{ mb: 2 }}
            />
          )}
        </Box>

        <Grid container spacing={4}>
          {/* Person Image Upload */}
          <Grid item xs={12} md={6}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Person sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Upload Your Photo
                    </Typography>
                    {personImage && (
                      <CheckCircle sx={{ ml: 'auto', color: 'success.main' }} />
                    )}
                  </Box>
                  
                  <UploadBox
                    isDragOver={dragStates.person}
                    hasImage={!!personImage}
                    isError={!!uploadErrors.person}
                    onDrop={(e) => handleDrop(e, 'person')}
                    onDragOver={(e) => handleDragOver(e, 'person')}
                    onDragLeave={(e) => handleDragLeave(e, 'person')}
                    onClick={() => personInputRef.current?.click()}
                  >
                    {personImage ? (
                      <Box position="relative">
                        <PreviewImage src={personImage.preview} alt="Person" />
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            bgcolor: 'error.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'error.dark' },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage('person');
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <>
                        <CloudUpload
                          sx={{ 
                            fontSize: 48, 
                            color: uploadErrors.person ? 'error.main' : 'primary.main', 
                            mb: 2 
                          }}
                        />
                        <Typography variant="h6" gutterBottom>
                          Drop your photo here
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          or click to browse
                        </Typography>
                        <Typography variant="caption" display="block" mt={1}>
                          JPG, PNG, WebP up to 10MB
                        </Typography>
                      </>
                    )}
                  </UploadBox>
                  
                  {uploadErrors.person && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {uploadErrors.person}
                    </Alert>
                  )}
                  
                  <input
                    ref={personInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(e, 'person')}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Clothing Image Upload */}
          <Grid item xs={12} md={6}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Checkroom sx={{ mr: 1, color: 'secondary.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Upload Clothing Item
                    </Typography>
                    {clothingImage && (
                      <CheckCircle sx={{ ml: 'auto', color: 'success.main' }} />
                    )}
                  </Box>
                  
                  <UploadBox
                    isDragOver={dragStates.clothing}
                    hasImage={!!clothingImage}
                    isError={!!uploadErrors.clothing}
                    onDrop={(e) => handleDrop(e, 'clothing')}
                    onDragOver={(e) => handleDragOver(e, 'clothing')}
                    onDragLeave={(e) => handleDragLeave(e, 'clothing')}
                    onClick={() => clothingInputRef.current?.click()}
                  >
                    {clothingImage ? (
                      <Box position="relative">
                        <PreviewImage src={clothingImage.preview} alt="Clothing" />
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            bgcolor: 'error.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'error.dark' },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage('clothing');
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <>
                        <CloudUpload
                          sx={{ 
                            fontSize: 48, 
                            color: uploadErrors.clothing ? 'error.main' : 'secondary.main', 
                            mb: 2 
                          }}
                        />
                        <Typography variant="h6" gutterBottom>
                          Drop clothing item here
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          or click to browse
                        </Typography>
                        <Typography variant="caption" display="block" mt={1}>
                          JPG, PNG, WebP up to 10MB
                        </Typography>
                      </>
                    )}
                  </UploadBox>
                  
                  {uploadErrors.clothing && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {uploadErrors.clothing}
                    </Alert>
                  )}
                  
                  <input
                    ref={clothingInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(e, 'clothing')}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box textAlign="center" my={4}>
          <GradientButton
            size="large"
            onClick={handleTryOn}
            disabled={!personImage || !clothingImage || isProcessing || uploadErrors.person || uploadErrors.clothing}
            startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
            sx={{ mr: 2 }}
          >
            {isProcessing ? 'Processing...' : 'Try It On'}
          </GradientButton>
          
          {(personImage || clothingImage || resultImage) && (
            <Button
              variant="outlined"
              onClick={resetAll}
              startIcon={<Refresh />}
              disabled={isProcessing}
              sx={{ 
                color: 'white', 
                borderColor: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderColor: 'white',
                }
              }}
            >
              Reset All
            </Button>
          )}
        </Box>

        {/* Progress Bar */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Card sx={{ mb: 4, borderRadius: 3 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <AutoAwesome sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">
                      {processingStatus || 'AI is working its magic...'}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                      },
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    This may take up to 2 minutes... Please keep this tab open.
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert 
                severity="error" 
                sx={{ mb: 4, borderRadius: 2 }}
                action={
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={() => setError(null)}
                  >
                    Dismiss
                  </Button>
                }
              >
                <strong>Try-on Failed:</strong> {error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Display */}
        <AnimatePresence>
          {resultImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <ResultCard>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" gutterBottom fontWeight={600} textAlign="center">
                    Your Virtual Try-On Result
                  </Typography>
                  <Divider sx={{ my: 3 }} />
                  
                  <Box textAlign="center">
                    <img
                      src={resultImage}
                      alt="Virtual Try-On Result"
                      style={{
                        maxWidth: '100%',
                        maxHeight: 600,
                        borderRadius: 16,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                      }}
                    />
                  </Box>
                  
                  <Box display="flex" justifyContent="center" gap={2} mt={4}>
                    <Button
                      variant="contained"
                      startIcon={<Download />}
                      onClick={downloadResult}
                      sx={{ borderRadius: 2 }}
                    >
                      Download
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Share />}
                      onClick={shareResult}
                      sx={{ borderRadius: 2 }}
                    >
                      Share
                    </Button>
                  </Box>
                </CardContent>
              </ResultCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Backdrop */}
        <Backdrop
          sx={{ 
            color: '#fff', 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)',
          }}
          open={isProcessing}
        >
          <Box textAlign="center">
            <CircularProgress color="inherit" size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              {processingStatus || 'Processing your virtual try-on...'}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
              Please don&apos;t close this tab
            </Typography>
          </Box>
        </Backdrop>

        {/* Snackbar for notifications */}
        <Snackbar
          open={showSnackbar}
          autoHideDuration={4000}
          onClose={() => setShowSnackbar(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setShowSnackbar(false)}
            severity={snackbarMessage.includes('successfully') || snackbarMessage.includes('complete') ? 'success' : 'info'}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </motion.div>
    </StyledContainer>
  );
};

export default VirtualTryOn; 