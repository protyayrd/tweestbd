import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { updateCategory } from '../../../Redux/Admin/Category/Action';
import { selectCategories } from '../../../Redux/Admin/Category/Selectors';
import api from '../../../Services/api';

const EditCategoryForm = ({ category, onClose }) => {
  const dispatch = useDispatch();
  const categories = useSelector(selectCategories);
  const jwt = localStorage.getItem("jwt");

  const [formData, setFormData] = useState({
    name: category.name,
    parentCategory: category.parentCategory?._id || '',
    level: category.level,
    imageUrl: category.imageUrl,
    description: category.description || '',
    featuredInCarousel: category.featuredInCarousel || false
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(
    category.imageUrl ? `${process.env.REACT_APP_API_URL}${category.imageUrl}` : ''
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create the category data object
      const categoryData = {
        name: formData.name,
        level: parseInt(formData.level),
        description: formData.description || ''
      };

      // Only include parentCategory if level > 1 and it exists
      if (formData.level > 1 && formData.parentCategory) {
        categoryData.parentCategory = formData.parentCategory;
      }

      console.log('Updating category:', {
        categoryId: category._id,
        categoryData
      });

      // First update the category data
      await dispatch(updateCategory({ 
        categoryId: category._id, 
        data: categoryData,  // Send as JSON
        jwt 
      }));

      // If there's a new image, upload it separately
      if (imageFile) {
        const imageData = new FormData();
        imageData.append('image', imageFile);
        
        await api.post(`/api/categories/${category._id}/image`, imageData, {
          headers: {
            'Authorization': `Bearer ${jwt}`
          }
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const parentCategories = categories?.filter(cat => 
    cat.level < formData.level && cat._id !== category._id
  ) || [];

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          name="name"
          label="Category Name"
          value={formData.name}
          onChange={handleInputChange}
          required
          fullWidth
        />

        <FormControl fullWidth>
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
          <FormControl fullWidth>
            <InputLabel>Parent Category</InputLabel>
            <Select
              name="parentCategory"
              value={formData.parentCategory}
              onChange={handleInputChange}
              required
            >
              {parentCategories.map((cat) => (
                <MenuItem key={cat._id} value={cat._id}>
                  {cat.name}
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
          />
          <label htmlFor="image-upload">
            <Button variant="outlined" component="span">
              Change Image
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

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
          >
            Update Category
          </Button>
        </Box>
      </Box>
    </form>
  );
};

export default EditCategoryForm; 