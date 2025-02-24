import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  Button,
  Typography,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import EditCategoryForm from './EditCategoryForm';
import { selectCategories } from '../../../Redux/Admin/Category/Selectors';

const CategoryList = () => {
  const categories = useSelector(selectCategories);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleEditClick = (category) => {
    setSelectedCategory(category);
    setEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setSelectedCategory(null);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Categories
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Parent Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories?.map((category) => (
              <TableRow key={category._id}>
                <TableCell>
                  <img 
                    src={category.imageUrl} 
                    alt={category.name}
                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                  />
                </TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.level}</TableCell>
                <TableCell>
                  {category.parentCategory?.name || '-'}
                </TableCell>
                <TableCell>{category.description || '-'}</TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => handleEditClick(category)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={editDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Edit Category
          </Typography>
          {selectedCategory && (
            <EditCategoryForm 
              category={selectedCategory} 
              onClose={handleCloseDialog}
            />
          )}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleCloseDialog}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default CategoryList; 