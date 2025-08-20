import React, { useState, memo, useMemo, useCallback } from 'react';
import "./ProductCard.css";
import { useLocation, useNavigate } from "react-router-dom";
import { getImageUrl } from '../../../../config/api';
import { Box, Skeleton } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { addItemToCart } from '../../../../Redux/Customers/Cart/Action';
import AddToCartModal from '../../Cart/AddToCartModal';

const ProductCard = ({ product, onAddSuccess, onAddError }) => {
  const { title, brand, price, discountedPrice, color, discountPersent } = product;
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  const handleNavigate = useCallback(() => {
  if (showSizeModal) return; // prevent navigation when modal is open
  if (product?.slug) {
    navigate(`/product/${product.slug}`);
  } else {
    navigate(`/product/${product._id}`);
  }
}, [showSizeModal, product?.slug, product?._id, navigate]);

  // Memoize image URLs to prevent recalculation on every render
  const { primaryImage, secondaryImage } = useMemo(() => {
    const primary = product.colors?.[0]?.images?.[0];
    const secondary = product.colors?.[0]?.images?.[1] || primary;
    return { primaryImage: primary, secondaryImage: secondary };
  }, [product.colors]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const isNew = Boolean(product?.isNewArrival);
  const pctOff = typeof discountPersent === 'number' && discountPersent > 0 ? discountPersent : (
    product?.price && product?.discountedPrice && product.price > 0
      ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
      : 0
  );

  const firstAvailable = useMemo(() => {
    const firstColor = product?.colors?.find(c => Array.isArray(c?.sizes) && c.sizes.some(s => Number(s.quantity) > 0)) || product?.colors?.[0];
    const firstSize = firstColor?.sizes?.find(s => Number(s.quantity) > 0) || firstColor?.sizes?.[0];
    return {
      color: firstColor?.name || null,
      size: firstSize?.name || null
    };
  }, [product?.colors]);

  const handleAddToCart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSizeModal(true);
  }, []);

  const handleConfirmAdd = useCallback(async (selectedSize) => {
    try {
      // Find a color that has the selected size available
      let chosenColor = firstAvailable.color;
      const colorWithSize = product?.colors?.find(c => (c?.sizes || []).some(s => s?.name === selectedSize && (Number(s?.quantity) > 0 || s?.quantity === undefined)));
      if (colorWithSize?.name) chosenColor = colorWithSize.name;

      if (auth?.user) {
        await dispatch(addItemToCart({
          productId: product._id,
          color: chosenColor || 'Default',
          size: selectedSize,
          price: product.price,
          discountedPrice: product.discountedPrice || product.price,
          product
        }));
      } else {
        // Guest flow mirrors CategoryProductPage
        const existingCart = JSON.parse(localStorage.getItem('guestCartItems') || '[]');
        const existingItemIndex = existingCart.findIndex(item => 
          item.productId === product._id && 
          item.color === (chosenColor || 'Default') &&
          item.size === selectedSize
        );

        const productSnapshot = {
          _id: product._id,
          title: product.title,
          price: product.price,
          discountedPrice: product.discountedPrice ?? product.price,
          imageUrl: product.images?.[0] || null,
          selectedColorImages: product.colors?.[0]?.images || (product.images ? [product.images?.[0]].filter(Boolean) : []),
          colors: product.colors || [],
          category: product.category || null
        };

        if (existingItemIndex >= 0) {
          existingCart[existingItemIndex].quantity += 1;
        } else {
          existingCart.push({
            productId: product._id,
            product: productSnapshot,
            quantity: 1,
            color: chosenColor || 'Default',
            size: selectedSize
          });
        }
        localStorage.setItem('guestCartItems', JSON.stringify(existingCart));
      }
      onAddSuccess && onAddSuccess();
    } catch (err) {
      onAddError && onAddError(err?.message || 'Failed to add to cart');
    } finally {
      setShowSizeModal(false);
    }
  }, [dispatch, auth?.user, product, firstAvailable, onAddSuccess, onAddError]);

  return (
    <div onClick={handleNavigate} className='productCard w-[16rem] m-3 cursor-pointer rounded-lg shadow-sm bg-white border border-gray-200' role="button">
      <div className='h-[24rem] relative overflow-hidden rounded-t-lg'>
        {!imageLoaded && (
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height="100%" 
            animation="wave"
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              backgroundColor: '#69af5a',
              opacity: 0.2,
              zIndex: 1
            }}
          />
        )}
        {/* Top badges */}
        {(isNew || pctOff > 0) && (
          <div className='absolute top-2 left-2 right-2 z-10 flex justify-between items-start pointer-events-none'>
            {isNew && (
              <span className='bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-sm'>NEW</span>
            )}
            {pctOff > 0 && (
              <span className='bg-black/80 text-white text-xs font-semibold px-2 py-1 rounded-sm'>{pctOff}% OFF</span>
            )}
          </div>
        )}

        <img 
          className='primary-image h-full w-full object-cover object-left-top absolute top-0 left-0 transition-opacity duration-300'
          src={primaryImage ? getImageUrl(primaryImage) : 'https://via.placeholder.com/400x600'}
          alt={title}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          width="400"
          height="600"
          onLoad={handleImageLoad}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x600';
          }}
          style={{ 
            opacity: imageLoaded ? 1 : 0, 
            zIndex: 2,
            objectFit: 'cover',
            objectPosition: 'center center' 
          }}
        />
        <img 
          className='secondary-image h-full w-full object-cover object-left-top absolute top-0 left-0 transition-opacity duration-300 opacity-0'
          src={secondaryImage ? getImageUrl(secondaryImage) : 'https://via.placeholder.com/400x600'}
          alt={`${title} - hover`}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          width="400"
          height="600"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x600';
          }}
          style={{ 
            zIndex: 2,
            objectFit: 'cover',
            objectPosition: 'center center'  
          }}
        />
      </div>
      <div className='textPart bg-white px-3 pt-3 pb-3'>
        {!imageLoaded ? (
          <div>
            <Skeleton 
              variant="text" 
              width="40%" 
              height={24} 
              sx={{ backgroundColor: '#69af5a', opacity: 0.2 }}
            />
            <Skeleton 
              variant="text" 
              width="70%" 
              height={24} 
              sx={{ backgroundColor: '#69af5a', opacity: 0.2 }}
            />
            <Skeleton 
              variant="text" 
              width="30%" 
              height={24} 
              sx={{ backgroundColor: '#69af5a', opacity: 0.2 }}
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Skeleton 
                variant="text" 
                width="30%" 
                height={24} 
                sx={{ backgroundColor: '#69af5a', opacity: 0.2 }}
              />
              <Skeleton 
                variant="text" 
                width="20%" 
                height={24} 
                sx={{ backgroundColor: '#69af5a', opacity: 0.2 }}
              />
              <Skeleton 
                variant="text" 
                width="25%" 
                height={24} 
                sx={{ backgroundColor: '#69af5a', opacity: 0.2 }}
              />
            </Box>
          </div>
        ) : (
          <>
            <div>
              <p className='font-bold opacity-60'>{brand}</p>
              <p className='truncate block' title={title}>{title}</p>
              <p className='font-semibold opacity-50'>{color}</p>
            </div>
            
            <div className='flex space-x-2 items-center'>
              <p className='font-semibold'>Tk. {discountedPrice}</p>
              <p className='opacity-50 line-through'>Tk. {price}</p>
              {pctOff > 0 && (
                <p className='text-green-600 font-semibold'>- {pctOff}%</p>
              )}
            </div>

            <div className='mt-3 mb-0'>
              <button
                onClick={handleAddToCart}
                className='w-full bg-black text-white text-sm font-semibold py-2 rounded-md'
                disabled={!firstAvailable.color || !firstAvailable.size}
              >
                {firstAvailable.color && firstAvailable.size ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </>
        )}
      </div>
      <AddToCartModal
        open={showSizeModal}
        onClose={() => setShowSizeModal(false)}
        product={product}
        onConfirm={handleConfirmAdd}
      />
    </div>
  );
};

export default memo(ProductCard);
