import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../../config/api';
import PromoCodeForm from './PromoCodeForm';

const PromoCodeList = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [selectedPromoCode, setSelectedPromoCode] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPromoCodes = async () => {
    try {
      const response = await api.get('/api/promo-codes/admin/all');
      setPromoCodes(response.data);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const handleAddNew = () => {
    setSelectedPromoCode(null);
    setOpenForm(true);
  };

  const handleEdit = (promoCode) => {
    setSelectedPromoCode(promoCode);
    setOpenForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this promo code?')) {
      try {
        await api.delete(`/api/promo-codes/${id}`);
        fetchPromoCodes();
      } catch (error) {
        console.error('Error deleting promo code:', error);
      }
    }
  };

  const handleFormClose = () => {
    setOpenForm(false);
    setSelectedPromoCode(null);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedPromoCode) {
        await api.put(`/api/promo-codes/${selectedPromoCode._id}`, formData);
      } else {
        await api.post('/api/promo-codes', formData);
      }
      fetchPromoCodes();
      handleFormClose();
    } catch (error) {
      console.error('Error saving promo code:', error);
    }
  };

  if (loading) {
    return <Box p={3}>Loading...</Box>;
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Promo Codes</Typography>
        <Button variant="contained" color="primary" onClick={handleAddNew}>
          Add New Promo Code
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Valid From</TableCell>
              <TableCell>Valid Until</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {promoCodes.map((promoCode) => (
              <TableRow key={promoCode._id}>
                <TableCell>{promoCode.code}</TableCell>
                <TableCell>{promoCode.discountType}</TableCell>
                <TableCell>
                  {promoCode.discountType === 'FIXED'
                    ? `Tk. ${promoCode.discountAmount}`
                    : `${promoCode.discountAmount}%`}
                </TableCell>
                <TableCell>{new Date(promoCode.validFrom).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(promoCode.validUntil).toLocaleDateString()}</TableCell>
                <TableCell>{promoCode.isActive ? 'Active' : 'Inactive'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(promoCode)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(promoCode._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openForm} onClose={handleFormClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPromoCode ? 'Edit Promo Code' : 'Add New Promo Code'}
        </DialogTitle>
        <DialogContent>
          <PromoCodeForm
            initialData={selectedPromoCode}
            onSubmit={handleFormSubmit}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFormClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PromoCodeList; 
