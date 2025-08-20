import AliceCarousel from "react-alice-carousel";
import HomeProductCard from "./HomeProductCard";
import "./HomeProductSection.css";
import { Button } from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useState, useMemo, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const HomeProductSection = ({ section, data, categoryId }) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  const slidePrev = useCallback(() => setActiveIndex(prev => prev - 1), []);
  const slideNext = useCallback(() => setActiveIndex(prev => prev + 1), []);
  const syncActiveIndex = useCallback(({ item }) => setActiveIndex(item), []);

  const responsive = {
    0: {
      items: 1,
      itemsFit: "contain",
    },
    568: {
      items: 2,
      itemsFit: "contain",
    },
    768: {
      items: 3,
      itemsFit: "contain",
    },
    1024: {
      items: 4,
      itemsFit: "contain",
    },
    1280: {
      items: 5,
      itemsFit: "contain",
    }
  };

  const items = useMemo(() => {
    if (!data?.content) return [];

    // Create a Set to track unique product IDs
    const uniqueProductIds = new Set();
    const uniqueProducts = [];

    // Filter out duplicate products
    data.content.forEach((item) => {
      if (!uniqueProductIds.has(item._id)) {
        uniqueProductIds.add(item._id);
        uniqueProducts.push(item);
      }
    });

    return uniqueProducts.map((item) => (
      <div key={item._id} className="px-2">
        <HomeProductCard 
          product={item} 
          isNewArrival={section === "New Arrivals"}
        />
      </div>
    ));
  }, [data?.content, section]);

  const shouldShowNext = activeIndex < (items.length - responsive[1280].items);
  const shouldShowPrev = activeIndex > 0;

  if (!data?.content?.length) {
    return null;
  }

  return (
    <div className="relative px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-5">
        <h2 className="text-2xl font-extrabold text-gray-900">{section}</h2>
        <Button
          variant="text"
          onClick={() => navigate(`/${categorySlug || categoryId}&page=1`)}
          className="text-primary-600 hover:text-primary-500"
        >
          View All
        </Button>
      </div>
      
      <div className="relative">
        <AliceCarousel
          items={items}
          responsive={responsive}
          disableDotsControls
          disableButtonsControls
          activeIndex={activeIndex}
          onSlideChanged={syncActiveIndex}
          animationType="slide"
          animationDuration={800}
        />
        
        {shouldShowPrev && (
          <button
            onClick={slidePrev}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-75 rounded-full p-2 shadow-lg hover:bg-opacity-100 transition-all"
          >
            <ArrowForwardIosIcon className="transform rotate-180" />
          </button>
        )}
        
        {shouldShowNext && (
          <button
            onClick={slideNext}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-75 rounded-full p-2 shadow-lg hover:bg-opacity-100 transition-all"
          >
            <ArrowForwardIosIcon />
          </button>
        )}
      </div>
    </div>
  );
};

export default memo(HomeProductSection);
