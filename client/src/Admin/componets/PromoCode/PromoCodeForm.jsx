import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  FormControlLabel,
  Grid,
  Button,
  Autocomplete,
} from '@mui/material';
import api from '../../../config/api';

const PromoCodeForm = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'FIXED',
    discountAmount: '',
    maxDiscountAmount: '',
    minOrderAmount: '0',
    applicableOn: 'ALL',
    applicableProducts: [],
    applicableCategories: [],
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isActive: true,
    usageLimit: '',
  });

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        validFrom: new Date(initialData.validFrom).toISOString().slice(0, 16),
        validUntil: new Date(initialData.validUntil).toISOString().slice(0, 16),
      });
    }
  }, [initialData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/api/admin/products'),
          api.get('/api/categories'),
        ]);
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear related errors
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length === 0) {
      // Convert dates back to Date objects before submitting
      const submissionData = {
        ...formData,
        validFrom: new Date(formData.validFrom),
        validUntil: new Date(formData.validUntil),
      };
      onSubmit(submissionData);
    } else {
      setErrors(validationErrors);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.code) errors.code = 'Code is required';
    if (!formData.description) errors.description = 'Description is required';
    if (!formData.discountAmount) errors.discountAmount = 'Discount amount is required';
    if (formData.discountType === 'PERCENTAGE') {
      if (formData.discountAmount > 100) {
        errors.discountAmount = 'Percentage cannot be greater than 100';
      }
      if (!formData.maxDiscountAmount) {
        errors.maxDiscountAmount = 'Max discount amount is required for percentage discount';
      }
    }
    if (new Date(formData.validUntil) <= new Date(formData.validFrom)) {
      errors.validUntil = 'End date must be after start date';
    }
    if (formData.applicableOn === 'PRODUCT' && (!formData.applicableProducts || formData.applicableProducts.length === 0)) {
      errors.applicableProducts = 'Please select at least one product';
    }
    if (formData.applicableOn === 'CATEGORY' && (!formData.applicableCategories || formData.applicableCategories.length === 0)) {
      errors.applicableCategories = 'Please select at least one category';
    }
    return errors;
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Promo Code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            error={!!errors.code}
            helperText={errors.code}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Discount Type</InputLabel>
            <Select
              name="discountType"
              value={formData.discountType}
              onChange={handleChange}
              label="Discount Type"
            >
              <MenuItem value="FIXED">Fixed Amount</MenuItem>
              <MenuItem value="PERCENTAGE">Percentage</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Discount Amount"
            name="discountAmount"
            type="number"
            value={formData.discountAmount}
            onChange={handleChange}
            error={!!errors.discountAmount}
            helperText={errors.discountAmount}
            required
            InputProps={{
              startAdornment: formData.discountType === 'FIXED' ? 'Tk. ' : '',
              endAdornment: formData.discountType === 'PERCENTAGE' ? '%' : '',
            }}
          />
        </Grid>
        {formData.discountType === 'PERCENTAGE' && (
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Maximum Discount Amount"
              name="maxDiscountAmount"
              type="number"
              value={formData.maxDiscountAmount}
              onChange={handleChange}
              error={!!errors.maxDiscountAmount}
              helperText={errors.maxDiscountAmount}
              required
              InputProps={{ startAdornment: 'Tk. ' }}
            />
          </Grid>
        )}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            error={!!errors.description}
            helperText={errors.description}
            required
            multiline
            rows={2}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Minimum Order Amount"
            name="minOrderAmount"
            type="number"
            value={formData.minOrderAmount}
            onChange={handleChange}
            InputProps={{ startAdornment: 'Tk. ' }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Usage Limit (Optional)"
            name="usageLimit"
            type="number"
            value={formData.usageLimit}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Applicable On</InputLabel>
            <Select
              name="applicableOn"
              value={formData.applicableOn}
              onChange={handleChange}
              label="Applicable On"
            >
              <MenuItem value="ALL">All Products</MenuItem>
              <MenuItem value="CATEGORY">Selected Categories</MenuItem>
              <MenuItem value="PRODUCT">Selected Products</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {formData.applicableOn === 'PRODUCT' && (
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={products}
              getOptionLabel={(option) => option.title}
              value={products.filter((product) =>
                formData.applicableProducts.includes(product._id)
              )}
              onChange={(_, newValue) => {
                setFormData((prev) => ({
                  ...prev,
                  applicableProducts: newValue.map((item) => item._id),
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Products"
                  error={!!errors.applicableProducts}
                  helperText={errors.applicableProducts}
                />
              )}
            />
          </Grid>
        )}

        {formData.applicableOn === 'CATEGORY' && (
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={categories}
              getOptionLabel={(option) => option.name}
              value={categories.filter((category) =>
                formData.applicableCategories.includes(category._id)
              )}
              onChange={(_, newValue) => {
                setFormData((prev) => ({
                  ...prev,
                  applicableCategories: newValue.map((item) => item._id),
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Categories"
                  error={!!errors.applicableCategories}
                  helperText={errors.applicableCategories}
                />
              )}
            />
          </Grid>
        )}

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Valid From"
            name="validFrom"
            type="datetime-local"
            value={formData.validFrom}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Valid Until"
            name="validUntil"
            type="datetime-local"
            value={formData.validUntil}
            onChange={handleChange}
            error={!!errors.validUntil}
            helperText={errors.validUntil}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                }
              />
            }
            label="Active"
          />
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button type="submit" variant="contained" color="primary">
              {initialData ? 'Update' : 'Create'} Promo Code
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PromoCodeForm; 
