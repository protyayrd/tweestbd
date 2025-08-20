import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../../config/api';

const ComboOffersTable = () => {
  const navigate = useNavigate();
  const [comboOffers, setComboOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, offerId: null });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchComboOffers();
  }, [refreshKey]);

  const fetchComboOffers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/combo-offers');
      setComboOffers(response.data.data || []);
      setError('');
    } catch (error) {
      console.error('Error fetching combo offers:', error);
      setError('Failed to fetch combo offers');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (offerId, currentStatus) => {
    try {
      await api.patch(`/api/combo-offers/${offerId}/toggle-status`, {
        isActive: !currentStatus
      });
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error toggling status:', error);
      setError('Failed to update status');
    }
  };

  const handleDeleteOffer = async () => {
    try {
      await api.delete(`/api/combo-offers/${deleteDialog.offerId}`);
      setDeleteDialog({ open: false, offerId: null });
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting offer:', error);
      setError('Failed to delete offer');
    }
  };

  const formatCurrency = (amount) => {
    return `৳${Number(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No expiry';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardHeader
          title={
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Combo Offers Management</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/admin/combo-offers/create')}
                sx={{ textTransform: 'none' }}
              >
                Create New Combo Offer
              </Button>
            </Box>
          }
        />

        {error && (
          <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>Offer Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Combo Price</TableCell>
                <TableCell>Per Unit Price</TableCell>
                <TableCell>Min Quantity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Valid Until</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comboOffers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No combo offers found. Create your first combo offer to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                comboOffers.map((offer) => (
                  <TableRow key={offer._id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="500">
                          {offer.name}
                        </Typography>
                        {offer.description && (
                          <Typography variant="caption" color="text.secondary">
                            {offer.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={offer.category?.name || 'Unknown Category'} 
                        size="small" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="500">
                        {formatCurrency(offer.comboPrice)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="success.main" fontWeight="500">
                        {formatCurrency(offer.comboPrice / offer.minimumQuantity)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        (for {offer.minimumQuantity}+ items)
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${offer.minimumQuantity} items`} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={offer.isActive}
                            onChange={() => handleToggleStatus(offer._id, offer.isActive)}
                            size="small"
                          />
                        }
                        label={
                          <Chip 
                            label={offer.isActive ? 'Active' : 'Inactive'} 
                            size="small" 
                            color={offer.isActive ? 'success' : 'default'}
                          />
                        }
                        labelPlacement="end"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(offer.validUntil)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`/admin/combo-offers/${offer._id}`)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`/admin/combo-offers/${offer._id}/edit`)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            onClick={() => setDeleteDialog({ open: true, offerId: offer._id })}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, offerId: null })}
      >
        <DialogTitle>Delete Combo Offer</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this combo offer? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, offerId: null })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteOffer} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComboOffersTable; 