import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';

const LegacyProductRedirect = () => {
  const { slug } = useParams();

  useEffect(() => {
    // Log the redirect for analytics
    console.log('Legacy product redirect:', `/p/${slug} -> /product/${slug}`);
  }, [slug]);

  return <Navigate to={`/product/${slug}`} replace />;
};

export default LegacyProductRedirect;
