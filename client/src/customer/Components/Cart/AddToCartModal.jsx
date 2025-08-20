import React, { useMemo, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Rating,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableRow
} from '@mui/material';
import { InfoOutlined, Close } from '@mui/icons-material';
import { getImageUrl } from '../../../config/api';

const AddToCartModal = ({ open, onClose, product, onConfirm }) => {
  const [selectedSize, setSelectedSize] = useState(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [sizeGuideData, setSizeGuideData] = useState(null);

  useEffect(() => {
    if (open) {
      setSelectedSize(null);
    }
  }, [open, product?._id]);

  useEffect(() => {
    if (product?.sizeGuide) {
      const transformedData = Object.entries(product.sizeGuide).map(([size, measurements]) => {
        const lengthValue = measurements.length || measurements.bodyLength;
        return { size, chest: measurements.chest, length: lengthValue, shoulder: measurements.shoulder };
      });
      setSizeGuideData(transformedData);
    } else {
      setSizeGuideData(null);
    }
  }, [product?.sizeGuide]);

  const primaryImage = useMemo(() => {
    const firstColor = Array.isArray(product?.colors) ? product.colors[0] : null;
    if (firstColor?.images?.[0]) return firstColor.images[0];
    if (Array.isArray(product?.images) && product.images.length > 0) return product.images[0];
    if (product?.imageUrl) return product.imageUrl;
    return null;
  }, [product]);

  const availableSizes = useMemo(() => {
    const sizes = new Set();
    if (Array.isArray(product?.colors)) {
      product.colors.forEach((colorVariant) => {
        (colorVariant?.sizes || []).forEach((sizeObj) => {
          const isAvailable = Number(sizeObj?.quantity) > 0 || sizeObj?.quantity === undefined;
          if (sizeObj?.name && isAvailable) sizes.add(sizeObj.name);
        });
      });
    } else if (Array.isArray(product?.sizes)) {
      product.sizes.forEach((s) => {
        const isAvailable = Number(s?.quantity) > 0 || s?.quantity === undefined;
        if (s?.name && isAvailable) sizes.add(s.name);
      });
    }
    return Array.from(sizes);
  }, [product]);

  const handleConfirm = () => {
    if (!selectedSize) return;
    onConfirm?.(selectedSize);
  };

  const pctOff = useMemo(() => {
    if (!product) return 0;
    const base = Number(product?.price) || 0;
    const sale = Number(product?.discountedPrice ?? product?.price) || 0;
    if (!base || sale >= base) return 0;
    return Math.round(((base - sale) / base) * 100);
  }, [product]);

  const displayColorName = useMemo(() => {
    if (!product) return null;
    const firstColor = Array.isArray(product?.colors) ? product.colors[0] : null;
    return firstColor?.name || product?.color || null;
  }, [product]);

  const totalStock = useMemo(() => {
    if (!product) return 0;
    let total = 0;
    if (Array.isArray(product?.colors)) {
      product.colors.forEach((c) => (c?.sizes || []).forEach((s) => { total += Number(s?.quantity) || 0; }));
    } else if (Array.isArray(product?.sizes)) {
      product.sizes.forEach((s) => { total += Number(s?.quantity) || 0; });
    } else if (typeof product?.quantity === 'number') {
      total = product.quantity;
    }
    return total;
  }, [product]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        PaperProps={{ sx: { borderRadius: '12px', maxWidth: '900px' } }}
      >
        <DialogContent onClick={(e) => e.stopPropagation()} sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px 1fr' }, gap: 2.5, alignItems: 'flex-start' }}>
            {/* Image with 683x1024 aspect ratio (≈150% padding trick) */}
            <Box>
              <Box sx={{ position: 'relative', width: '100%', pt: '150%', borderRadius: '6px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <Box
                  component="img"
                  src={primaryImage ? getImageUrl(primaryImage) : 'https://via.placeholder.com/683x1024?text=No+Image'}
                  alt={product?.title || 'Product'}
                  loading="lazy"
                  sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            </Box>

            {/* Right content */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{product?.title}</Typography>
                {product?.brand && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{product.brand}</Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>Tk. {product?.discountedPrice ?? product?.price}</Typography>
                {product?.price && product?.discountedPrice && product.discountedPrice < product.price && (
                  <>
                    <Typography variant="body2" sx={{ textDecoration: 'line-through' }}>Tk. {product.price}</Typography>
                    {pctOff > 0 && (
                      <Typography variant="body2">-{pctOff}%</Typography>
                    )}
                  </>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {typeof product?.ratings === 'number' && (
                  <Rating size="small" precision={0.1} value={Number(product.ratings) || 0} readOnly />
                )}
                {typeof product?.numRatings === 'number' && (
                  <Typography variant="caption" color="text.secondary">({product.numRatings} reviews)</Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 0.5 }}>
                {displayColorName && (
                  <Typography variant="body2"><strong>Color:</strong> {displayColorName}</Typography>
                )}
                {product?.sku && (
                  <Typography variant="body2"><strong>SKU:</strong> {product.sku}</Typography>
                )}
                <Typography variant="body2"><strong>Stock:</strong> {totalStock > 0 ? 'In Stock' : 'Out of Stock'}</Typography>
              </Box>

              {/* Row: Choose Size (left) and Size Guide (right) */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Choose Size</Typography>
                {product?.sizeGuide && (
                  <Button
                    startIcon={<InfoOutlined />}
                    onClick={() => setSizeGuideOpen(true)}
                    size="small"
                    variant="outlined"
                    sx={{ color: '#000', borderColor: '#000' }}
                  >
                    Size Guide
                  </Button>
                )}
              </Box>

              {/* Size buttons */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableSizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? 'contained' : 'outlined'}
                    onClick={() => setSelectedSize(size)}
                    sx={{
                      minWidth: 64,
                      height: 40,
                      borderRadius: '6px',
                      fontWeight: 700,
                      color: selectedSize === size ? '#fff' : '#000',
                      backgroundColor: selectedSize === size ? '#000' : 'transparent',
                      borderColor: '#000',
                      '&:hover': {
                        backgroundColor: selectedSize === size ? '#111' : '#f5f5f5',
                        borderColor: '#000'
                      }
                    }}
                  >
                    {size}
                  </Button>
                ))}
                {availableSizes.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No sizes available</Typography>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 3, borderTop: '1px solid #e5e7eb' }}>
          <Button onClick={onClose} variant="outlined" sx={{ color: '#000', borderColor: '#000' }}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!selectedSize} variant="contained" sx={{ backgroundColor: '#000', '&:hover': { backgroundColor: '#111' } }}>Add to Cart</Button>
        </DialogActions>
      </Dialog>

      {/* Size Guide Dialog */}
      <Dialog
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', maxWidth: '800px' } }}
      >
        <DialogContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Size Guide</Typography>
            <IconButton onClick={() => setSizeGuideOpen(false)} size="small">
              <Close />
            </IconButton>
          </Box>
          {sizeGuideData ? (
            <Box>
              <Table size="small" sx={{ minWidth: 400 }}>
                <TableBody>
                  <TableRow>
                    <TableCell component="th">Measurements</TableCell>
                    {sizeGuideData.map((row) => (
                      <TableCell key={row.size} align="center">{row.size}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell component="th">Chest (in)</TableCell>
                    {sizeGuideData.map((row) => (
                      <TableCell key={row.size} align="center">{row.chest}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell component="th">Length (in)</TableCell>
                    {sizeGuideData.map((row) => (
                      <TableCell key={row.size} align="center">{row.length || '-'}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell component="th">Shoulder (in)</TableCell>
                    {sizeGuideData.map((row) => (
                      <TableCell key={row.size} align="center">{row.shoulder || '-'}</TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Box p={4} textAlign="center">
              <Typography variant="body2" color="text.secondary">No size guide available for this product.</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddToCartModal;


