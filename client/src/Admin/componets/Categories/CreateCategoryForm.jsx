import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  Alert
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { createCategory } from '../../../Redux/Admin/Category/Action';

const CreateCategoryForm = () => {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.category);
  const jwt = localStorage.getItem("jwt");

  const [formData, setFormData] = useState({
    name: '',
    parentCategory: '',
    level: 1,
    description: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear any previous errors when user makes changes
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size should be less than 5MB');
        return;
      }
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
        setError('Only JPG, PNG and GIF images are allowed');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!imageFile) {
      setError('Please select an image');
      return;
    }

    // Create FormData object for file upload
    const data = new FormData();
    data.append('name', formData.name.trim());
    data.append('level', formData.level);
    data.append('description', formData.description.trim());
    
    if (formData.level > 1 && formData.parentCategory) {
      data.append('parentCategory', formData.parentCategory);
    }
    
    data.append('image', imageFile);

    try {
        name: formData.name,
        level: formData.level,
        description: formData.description,
        parentCategory: formData.parentCategory,
        imageFile: imageFile.name
      });
      
      await dispatch(createCategory({ data, jwt }));
      
      // Reset form on success
      setFormData({
        name: '',
        parentCategory: '',
        level: 1,
        description: ''
      });
      setImageFile(null);
      setPreviewUrl('');
      setSuccess('Category created successfully!');
    } catch (error) {
      console.error('Error creating category:', error);
      setError(error.response?.data?.message || 'Failed to create category. Please try again.');
    }
  };

  const parentCategories = categories?.filter(cat => cat.level < formData.level) || [];

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Create New Category
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            name="name"
            label="Category Name"
            value={formData.name}
            onChange={handleInputChange}
            required
            fullWidth
            error={!!error && error.includes('name')}
          />

          <FormControl fullWidth required>
            <InputLabel>Level</InputLabel>
            <Select
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              required
            >
              <MenuItem value={1}>Level 1</MenuItem>
              <MenuItem value={2}>Level 2</MenuItem>
              <MenuItem value={3}>Level 3</MenuItem>
            </Select>
          </FormControl>

          {formData.level > 1 && (
            <FormControl fullWidth required>
              <InputLabel>Parent Category</InputLabel>
              <Select
                name="parentCategory"
                value={formData.parentCategory}
                onChange={handleInputChange}
                required
              >
                {parentCategories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={3}
            fullWidth
          />

          <Box>
            <input
              accept="image/*"
              type="file"
              id="image-upload"
              style={{ display: 'none' }}
              onChange={handleImageChange}
              required
            />
            <label htmlFor="image-upload">
              <Button variant="outlined" component="span">
                {imageFile ? 'Change Image' : 'Upload Image'}
              </Button>
            </label>
            {previewUrl && (
              <Box sx={{ mt: 2 }}>
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }}
                />
              </Box>
            )}
          </Box>

          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            sx={{ mt: 2 }}
          >
            Create Category
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default CreateCategoryForm; 