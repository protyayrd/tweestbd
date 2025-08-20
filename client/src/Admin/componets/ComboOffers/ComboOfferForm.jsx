import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  FormControlLabel,
  Switch,
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { getCategories } from '../../../Redux/Admin/Category/Action';
import api from '../../../config/api';

const ComboOfferForm = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const { category } = useSelector((store) => store);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    minimumQuantity: 2,
    comboPrice: '',
    isActive: true,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fetchingData, setFetchingData] = useState(isEdit);

  // Calculate per-unit price
  const perUnitPrice = formData.comboPrice && formData.minimumQuantity 
    ? (parseFloat(formData.comboPrice) / parseInt(formData.minimumQuantity)).toFixed(2)
    : 0;

  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  useEffect(() => {
    if (isEdit && id) {
      fetchComboOffer();
    }
  }, [isEdit, id]);

  const fetchComboOffer = async () => {
    try {
      setFetchingData(true);
      const response = await api.get(`/api/combo-offers/${id}`);
      const offer = response.data.data;
      
      setFormData({
        name: offer.name || '',
        description: offer.description || '',
        category: offer.category?._id || '',
        minimumQuantity: offer.minimumQuantity || 2,
        comboPrice: offer.comboPrice || '',
        isActive: offer.isActive !== undefined ? offer.isActive : true,
        validFrom: offer.validFrom ? new Date(offer.validFrom).toISOString().split('T')[0] : '',
        validUntil: offer.validUntil ? new Date(offer.validUntil).toISOString().split('T')[0] : ''
      });
    } catch (error) {
      console.error('Error fetching combo offer:', error);
      setError('Failed to fetch combo offer data');
    } finally {
      setFetchingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation
    if (!formData.name.trim()) {
      setError('Offer name is required');
      return;
    }
    if (!formData.category) {
      setError('Category is required');
      return;
    }
    if (!formData.comboPrice || parseFloat(formData.comboPrice) <= 0) {
      setError('Valid combo price is required');
      return;
    }
    if (!formData.minimumQuantity || parseInt(formData.minimumQuantity) < 2) {
      setError('Minimum quantity must be at least 2');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        comboPrice: parseFloat(formData.comboPrice),
        minimumQuantity: parseInt(formData.minimumQuantity),
        validUntil: formData.validUntil || null
      };

      if (isEdit) {
        await api.put(`/api/combo-offers/${id}`, submitData);
        setSuccess('Combo offer updated successfully!');
      } else {
        await api.post('/api/combo-offers', submitData);
        setSuccess('Combo offer created successfully!');
      }

      setTimeout(() => {
        navigate('/admin/combo-offers');
      }, 1500);

    } catch (error) {
      console.error('Error saving combo offer:', error);
      setError(error.response?.data?.message || 'Failed to save combo offer');
    } finally {
      setLoading(false);
    }
  };

  const level3Categories = category?.categories?.filter(cat => cat.level === 3) || [];

  if (fetchingData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth="800px" mx="auto">
      <Card>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={2}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/admin/combo-offers')}
                variant="outlined"
                size="small"
              >
                Back
              </Button>
              <Typography variant="h6">
                {isEdit ? 'Edit Combo Offer' : 'Create New Combo Offer'}
              </Typography>
            </Box>
          }
        />

        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Offer Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Buy 2 Semidrop Shoulder T-shirts"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    label="Category"
                  >
                    {level3Categories.map((cat) => (
                      <MenuItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  placeholder="Brief description of the combo offer"
                />
              </Grid>

              {/* Pricing Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Pricing Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Quantity"
                  name="minimumQuantity"
                  type="number"
                  value={formData.minimumQuantity}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 2 }}
                  helperText="Minimum number of items required for combo pricing"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Combo Price"
                  name="comboPrice"
                  type="number"
                  value={formData.comboPrice}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>৳</Typography>,
                  }}
                  helperText={`Total price for ${formData.minimumQuantity} items`}
                />
              </Grid>

              {/* Pricing Preview */}
              {formData.comboPrice && formData.minimumQuantity && (
                <Grid item xs={12}>
                  <Paper elevation={1} sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <Typography variant="h6" gutterBottom>
                      Pricing Preview
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2">
                          <strong>Per Unit Price:</strong> ৳{perUnitPrice}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2">
                          <strong>For {formData.minimumQuantity} items:</strong> ৳{formData.comboPrice}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2">
                          <strong>For 3 items:</strong> ৳{(perUnitPrice * 3).toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {/* Validity Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Validity & Status
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Valid From"
                  name="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Valid Until (Optional)"
                  name="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  helperText="Leave empty for no expiration"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={handleChange}
                      name="isActive"
                      color="primary"
                    />
                  }
                  label="Active (customers can use this offer)"
                />
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/admin/combo-offers')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                  >
                    {loading ? (
                      <CircularProgress size={20} />
                    ) : (
                      isEdit ? 'Update Offer' : 'Create Offer'
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ComboOfferForm; 