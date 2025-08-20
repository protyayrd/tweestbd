import React, { useState, useEffect } from 'react';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';

import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  Add as AddIcon,
  SwapVert as SwapVertIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import popupImageService from '../../../services/popupImage.service';

const PopupImageManager = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    isActive: true,
    startDate: null,
    endDate: null,
    image: null,
  });
  const [imagePreview, setImagePreview] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = () => {
    setLoading(true);
    popupImageService.getAllImages()
      .then(response => {
        setImages(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading popup images:', error);
        setSnackbar({
          open: true,
          message: 'Error loading popup images',
          severity: 'error'
        });
        setLoading(false);
      });
  };

  const handleOpenDialog = (image = null) => {
    if (image) {
      // Edit mode
      setEditMode(true);
      setFormData({
        title: image.title,
        description: image.description || '',
        link: image.link || '',
        isActive: image.isActive,
        startDate: image.startDate ? new Date(image.startDate) : null,
        endDate: image.endDate ? new Date(image.endDate) : null,
        image: null
      });
      setCurrentImage(image);
      setImagePreview(image.imagePath ? `${process.env.REACT_APP_API_URL}${image.imagePath}` : '');
    } else {
      // Add mode
      setEditMode(false);
      setFormData({
        title: '',
        description: '',
        link: '',
        isActive: true,
        startDate: null,
        endDate: null,
        image: null
      });
      setCurrentImage(null);
      setImagePreview('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setFormData({
      title: '',
      description: '',
      link: '',
      isActive: true,
      startDate: null,
      endDate: null,
      image: null
    });
    setImagePreview('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDateChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!formData.title) {
      setSnackbar({
        open: true,
        message: 'Title is required',
        severity: 'error'
      });
      return;
    }

    if ((!editMode || (editMode && formData.image)) && !formData.image && !imagePreview) {
      setSnackbar({
        open: true,
        message: 'Image is required',
        severity: 'error'
      });
      return;
    }

    setLoading(true);

    if (editMode && currentImage) {
      // Update existing image
      popupImageService.updateImage(currentImage._id, formData)
        .then(response => {
          loadImages();
          setSnackbar({
            open: true,
            message: 'Popup image updated successfully',
            severity: 'success'
          });
          handleCloseDialog();
        })
        .catch(error => {
          console.error('Error updating popup image:', error);
          setSnackbar({
            open: true,
            message: 'Error updating popup image',
            severity: 'error'
          });
          setLoading(false);
        });
    } else {
      // Create new image
      popupImageService.createImage(formData)
        .then(response => {
          loadImages();
          setSnackbar({
            open: true,
            message: 'Popup image created successfully',
            severity: 'success'
          });
          handleCloseDialog();
        })
        .catch(error => {
          console.error('Error creating popup image:', error);
          setSnackbar({
            open: true,
            message: 'Error creating popup image',
            severity: 'error'
          });
          setLoading(false);
        });
    }
  };

  const handleDeleteConfirm = (image) => {
    setCurrentImage(image);
    setOpenDeleteDialog(true);
  };

  const handleDelete = () => {
    if (!currentImage) {
      setOpenDeleteDialog(false);
      return;
    }

    setLoading(true);
    popupImageService.deleteImage(currentImage._id)
      .then(response => {
        loadImages();
        setSnackbar({
          open: true,
          message: 'Popup image deleted successfully',
          severity: 'success'
        });
        setOpenDeleteDialog(false);
      })
      .catch(error => {
        console.error('Error deleting popup image:', error);
        setSnackbar({
          open: true,
          message: 'Error deleting popup image',
          severity: 'error'
        });
        setLoading(false);
        setOpenDeleteDialog(false);
      });
  };

  const handleToggleActive = (image) => {
    const updatedImage = {
      ...image,
      isActive: !image.isActive
    };

    setLoading(true);
    popupImageService.updateImage(image._id, updatedImage)
      .then(response => {
        loadImages();
        setSnackbar({
          open: true,
          message: `Image ${updatedImage.isActive ? 'activated' : 'deactivated'} successfully`,
          severity: 'success'
        });
      })
      .catch(error => {
        console.error('Error updating image status:', error);
        setSnackbar({
          open: true,
          message: 'Error updating image status',
          severity: 'error'
        });
        setLoading(false);
      });
  };

  const handleReorder = () => {
    setReorderMode(!reorderMode);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sequence numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      sequence: index
    }));

    setImages(updatedItems);
  };

  const handleSaveOrder = () => {
    setLoading(true);
    const sequenceData = images.map((item, index) => ({
      id: item._id,
      sequence: index
    }));

    popupImageService.updateSequence(sequenceData)
      .then(response => {
        loadImages();
        setSnackbar({
          open: true,
          message: 'Image order updated successfully',
          severity: 'success'
        });
        setReorderMode(false);
      })
      .catch(error => {
        console.error('Error updating image order:', error);
        setSnackbar({
          open: true,
          message: 'Error updating image order',
          severity: 'error'
        });
        setLoading(false);
      });
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    
    const items = Array.from(images);
    const temp = items[index];
    items[index] = items[index - 1];
    items[index - 1] = temp;
    
    setImages(items);
  };

  const handleMoveDown = (index) => {
    if (index === images.length - 1) return;
    
    const items = Array.from(images);
    const temp = items[index];
    items[index] = items[index + 1];
    items[index + 1] = temp;
    
    setImages(items);
  };

  const handleOpenPreview = (index) => {
    setPreviewIndex(index);
    setOpenPreviewDialog(true);
  };

  const handlePrevPreview = (e) => {
    if (e) e.stopPropagation();
    setPreviewIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextPreview = (e) => {
    if (e) e.stopPropagation();
    setPreviewIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // Handle keyboard navigation in preview mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!openPreviewDialog) return;
      
      if (e.key === 'ArrowLeft') {
        handlePrevPreview();
      } else if (e.key === 'ArrowRight') {
        handleNextPreview();
      } else if (e.key === 'Escape') {
        setOpenPreviewDialog(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openPreviewDialog, images.length]);

  return (
    <Container>
      <Box sx={{ mb: 4, mt: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Popup Image Manager
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage popup images that will be shown when users visit the website.
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add New Popup Image
          </Button>

          {reorderMode ? (
            <Box>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveOrder}
                sx={{ mr: 1 }}
              >
                Save Order
              </Button>
              <Button 
                variant="outlined" 
                color="secondary"
                startIcon={<CancelIcon />}
                onClick={() => setReorderMode(false)}
              >
                Cancel
              </Button>
            </Box>
          ) : (
            <Button 
              variant="outlined" 
              startIcon={<SwapVertIcon />}
              onClick={handleReorder}
            >
              Reorder Images
            </Button>
          )}
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper elevation={3}>
            {reorderMode ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="droppable">
                  {(provided) => (
                    <TableContainer {...provided.droppableProps} ref={provided.innerRef}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Order</TableCell>
                            <TableCell>Image</TableCell>
                            <TableCell>Title</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {images.map((image, index) => (
                            <Draggable key={image._id} draggableId={image._id} index={index}>
                              {(provided) => (
                                <TableRow
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  sx={{ 
                                    cursor: 'grab',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                                  }}
                                >
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>
                                    <Box
                                      component="img"
                                      src={`${process.env.REACT_APP_API_URL}${image.imagePath}`}
                                      alt={image.title}
                                      sx={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 1 }}
                                    />
                                  </TableCell>
                                  <TableCell>{image.title}</TableCell>
                                  <TableCell>
                                    {image.isActive ? (
                                      <Tooltip title="Active">
                                        <VisibilityIcon color="success" />
                                      </Tooltip>
                                    ) : (
                                      <Tooltip title="Inactive">
                                        <VisibilityOffIcon color="error" />
                                      </Tooltip>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <IconButton onClick={() => handleMoveUp(index)} disabled={index === 0}>
                                      <ArrowUpwardIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleMoveDown(index)} disabled={index === images.length - 1}>
                                      <ArrowDownwardIcon />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Image</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Link</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date Range</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {images.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body1" color="text.secondary">
                            No popup images found. Create one by clicking &quot;Add New Popup Image&quot;.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      images.map((image, index) => (
                        <TableRow key={image._id}>
                          <TableCell>
                            <Box
                              component="img"
                              src={`${process.env.REACT_APP_API_URL}${image.imagePath}`}
                              alt={image.title}
                              sx={{ 
                                width: 80, 
                                height: 50, 
                                objectFit: 'cover', 
                                borderRadius: 1,
                                cursor: 'pointer'
                              }}
                              onClick={() => handleOpenPreview(index)}
                            />
                          </TableCell>
                          <TableCell>{image.title}</TableCell>
                          <TableCell>{image.description}</TableCell>
                          <TableCell>
                            {image.link ? (
                              <a href={image.link} target="_blank" rel="noopener noreferrer">
                                {image.link.length > 20 ? `${image.link.substring(0, 20)}...` : image.link}
                              </a>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <IconButton onClick={() => handleToggleActive(image)}>
                              {image.isActive ? (
                                <Tooltip title="Active - Click to deactivate">
                                  <VisibilityIcon color="success" />
                                </Tooltip>
                              ) : (
                                <Tooltip title="Inactive - Click to activate">
                                  <VisibilityOffIcon color="error" />
                                </Tooltip>
                              )}
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            {image.startDate ? new Date(image.startDate).toLocaleDateString() : '-'}
                            {' to '}
                            {image.endDate ? new Date(image.endDate).toLocaleDateString() : 'No End Date'}
                          </TableCell>
                          <TableCell>
                            <IconButton color="primary" onClick={() => handleOpenDialog(image)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton color="error" onClick={() => handleDeleteConfirm(image)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Popup Image' : 'Add New Popup Image'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  name="title"
                  label="Title"
                  fullWidth
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  variant="outlined"
                  margin="normal"
                />
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  variant="outlined"
                  margin="normal"
                />
                <TextField
                  name="link"
                  label="Link URL (optional)"
                  fullWidth
                  value={formData.link}
                  onChange={handleInputChange}
                  variant="outlined"
                  margin="normal"
                  placeholder="https://example.com"
                />
                <FormControlLabel
                  control={
                    <Switch
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      color="primary"
                    />
                  }
                  label="Active"
                  sx={{ mt: 2 }}
                />
                <TextField
                  name="startDate"
                  label="Start Date (optional)"
                  type="datetime-local"
                  fullWidth
                  value={formData.startDate ? new Date(formData.startDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleDateChange('startDate', e.target.value ? new Date(e.target.value) : null)}
                  variant="outlined"
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <TextField
                  name="endDate"
                  label="End Date (optional)"
                  type="datetime-local"
                  fullWidth
                  value={formData.endDate ? new Date(formData.endDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleDateChange('endDate', e.target.value ? new Date(e.target.value) : null)}
                  variant="outlined"
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    sx={{ height: 56 }}
                  >
                    {editMode ? 'Change Image' : 'Upload Image'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                </Box>
                {imagePreview && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: 300, 
                        objectFit: 'contain',
                        border: '1px solid #ddd',
                        borderRadius: 4
                      }}
                    />
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{currentImage?.title}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog 
        open={openPreviewDialog} 
        onClose={() => setOpenPreviewDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#111',
            color: 'white',
            maxHeight: '90vh',
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={() => setOpenPreviewDialog(false)}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 10,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            position: 'relative',
            height: '70vh',
            width: '100%',
            overflow: 'hidden'
          }}>
            {images.length > 0 && (
              <Box sx={{ 
                position: 'relative',
                height: '100%',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <img
                  src={`${process.env.REACT_APP_API_URL}${images[previewIndex].imagePath}`}
                  alt={images[previewIndex].title}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
                
                {images.length > 1 && (
                  <>
                    <IconButton
                      onClick={handlePrevPreview}
                      sx={{
                        position: 'absolute',
                        left: 20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        },
                        width: 40,
                        height: 40,
                        zIndex: 5
                      }}
                    >
                      <ArrowBackIosNewIcon />
                    </IconButton>
                    <IconButton
                      onClick={handleNextPreview}
                      sx={{
                        position: 'absolute',
                        right: 20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        },
                        width: 40,
                        height: 40,
                        zIndex: 5
                      }}
                    >
                      <ArrowForwardIosIcon />
                    </IconButton>
                  </>
                )}
              </Box>
            )}
          </Box>
          
          <Box sx={{ 
            p: 2, 
            bgcolor: '#222',
            borderTop: '1px solid #333'
          }}>
            <Typography variant="h6" gutterBottom>
              {images[previewIndex]?.title}
            </Typography>
            
            {images[previewIndex]?.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {images[previewIndex].description}
              </Typography>
            )}
            
            {images[previewIndex]?.link && (
              <Typography variant="body2">
                Link: <a href={images[previewIndex].link} target="_blank" rel="noopener noreferrer" style={{ color: '#90caf9' }}>{images[previewIndex].link}</a>
              </Typography>
            )}
            
            {/* Thumbnail navigation for all images */}
            {images.length > 1 && (
              <Box sx={{ 
                mt: 2, 
                display: 'flex', 
                gap: 1, 
                overflowX: 'auto',
                pb: 1,
                '&::-webkit-scrollbar': {
                  height: 8,
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderRadius: 4,
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: 'rgba(255,255,255,0.3)',
                  borderRadius: 4,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' }
                }
              }}>
                {images.map((image, index) => (
                  <Box 
                    key={index} 
                    onClick={() => setPreviewIndex(index)}
                    sx={{ 
                      border: index === previewIndex ? '2px solid #1976d2' : '2px solid transparent',
                      height: 60,
                      minWidth: 80,
                      borderRadius: 1,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      opacity: index === previewIndex ? 1 : 0.6,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        opacity: 1,
                      }
                    }}
                  >
                    <img 
                      src={`${process.env.REACT_APP_API_URL}${image.imagePath}`}
                      alt={image.title}
                      style={{ 
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }} 
                    />
                  </Box>
                ))}
              </Box>
            )}
            
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                display: 'block', 
                textAlign: 'center', 
                mt: 1 
              }}
            >
              {previewIndex + 1} of {images.length} • Use arrow keys to navigate
            </Typography>
          </Box>
        </Box>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PopupImageManager; 