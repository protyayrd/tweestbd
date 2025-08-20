import React from "react";
import { Avatar } from "@mui/material";
import { Rating, Box, Typography, Grid, Chip } from "@mui/material";
import VerifiedIcon from '@mui/icons-material/Verified';

const ProductReviewCard = ({item}) => {
  // Handle case where user might be undefined
  const userName = item?.user?.firstName || 'Anonymous';
  const userInitial = userName !== 'Anonymous' ? userName[0].toUpperCase() : 'A';
  
  return (
    <div className="">
      <Grid container spacing={2} gap={3}>
        <Grid item xs={1}>
          <Box>
            <Avatar
              className="text-white"
              sx={{ width: 56, height: 56, bgcolor: "#9155FD" }}
              alt={userName}
              src=""
            >
              {userInitial}
            </Avatar>
          </Box>
        </Grid>
        <Grid item xs={9}>
          <div className="space-y-2">
            <div className="flex items-center">
              <p className="font-semibold text-lg">{userName}</p>
              {item?.verifiedPurchase && (
                <Chip 
                  icon={<VerifiedIcon style={{ color: '#4CAF50' }} />}
                  label="Verified Purchase" 
                  size="small"
                  variant="outlined"
                  style={{ 
                    marginLeft: 10, 
                    borderColor: '#4CAF50', 
                    color: '#4CAF50',
                    fontWeight: 'bold'
                  }}
                />
              )}
            </div>
            <p className="opacity-70">
              {item?.createdAt 
                ? new Date(item.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'Recent review'
              }
            </p>
            <div>
              <Rating
                value={item?.rating || 5}
                precision={0.5}
                readOnly
              />
            </div>
            <p>
              {item?.review || 'No review text provided.'}
            </p>
          </div>
        </Grid>
      </Grid>
      <div className="col-span-1 flex"></div>
    </div>
  );
};

export default ProductReviewCard;
