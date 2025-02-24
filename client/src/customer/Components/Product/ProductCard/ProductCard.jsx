import React from 'react';
import "./ProductCard.css";
import { useLocation, useNavigate } from "react-router-dom";
import { getImageUrl } from '../../../../config/api';

const ProductCard = ({ product }) => {
  const { title, brand, price, discountedPrice, color, discountPersent } = product;
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(`/product/${product?._id}`)
  }

  // Get the first two images from the first color
  const primaryImage = product.colors?.[0]?.images?.[0];
  const secondaryImage = product.colors?.[0]?.images?.[1] || primaryImage; // Fallback to primary if no second image

  return (
    <div onClick={handleNavigate} className='productCard w-[15rem] border m-3 transition-all cursor-pointer'>
      <div className='h-[20rem] relative overflow-hidden'>
        <img 
          className='primary-image h-full w-full object-cover object-left-top absolute top-0 left-0 transition-opacity duration-300'
          src={primaryImage ? getImageUrl(primaryImage) : 'https://via.placeholder.com/400x600'}
          alt={title}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x600';
          }}
        />
        <img 
          className='secondary-image h-full w-full object-cover object-left-top absolute top-0 left-0 transition-opacity duration-300 opacity-0'
          src={secondaryImage ? getImageUrl(secondaryImage) : 'https://via.placeholder.com/400x600'}
          alt={`${title} - hover`}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x600';
          }}
        />
      </div>
      <div className='textPart bg-white p-3'>
        <div>
          <p className='font-bold opacity-60'>{brand}</p>
          <p>{title}</p>
          <p className='font-semibold opacity-50'>{color}</p>
        </div>
        
        <div className='flex space-x-2 items-center'>
          <p className='font-semibold'>Tk. {discountedPrice}</p>
          <p className='opacity-50 line-through'>Tk. {price}</p>
          <p className='text-green-600 font-semibold'>{discountPersent}% off</p>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
