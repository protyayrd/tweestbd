import AliceCarousel from "react-alice-carousel";
import HomeProductCard from "./HomeProductCard";
import "./HomeProductSection.css";
import { Button } from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const HomeProductSection = ({ section, data, categoryId }) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  const slidePrev = () => setActiveIndex(activeIndex - 1);
  const slideNext = () => setActiveIndex(activeIndex + 1);
  const syncActiveIndex = ({ item }) => setActiveIndex(item);

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
    return data.content.map((item) => (
      <div key={item._id} className="px-2">
        <HomeProductCard product={item} />
      </div>
    ));
  }, [data?.content]);

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
          onClick={() => navigate(`/products?category=${categoryId}`)}
          className="text-primary-600 hover:text-primary-500"
        >
          View All
        </Button>
      </div>

      <div className="relative border rounded-lg p-5">
        <AliceCarousel
          disableButtonsControls
          disableDotsControls
          mouseTracking
          items={items}
          activeIndex={activeIndex}
          responsive={responsive}
          onSlideChanged={syncActiveIndex}
          animationType="fadeout"
          animationDuration={500}
        />

        {shouldShowNext && (
          <Button
            onClick={slideNext}
            variant="contained"
            className="z-50"
            sx={{
              position: "absolute",
              top: "50%",
              right: "0rem",
              transform: "translate(50%, -50%)",
              bgcolor: "white",
              color: "primary.main",
              "&:hover": {
                bgcolor: "primary.main",
                color: "white",
              },
              minWidth: "40px",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              boxShadow: 2,
            }}
          >
            <ArrowForwardIosIcon />
          </Button>
        )}

        {shouldShowPrev && (
          <Button
            onClick={slidePrev}
            variant="contained"
            className="z-50"
            sx={{
              position: "absolute",
              top: "50%",
              left: "0rem",
              transform: "translate(-50%, -50%) rotate(180deg)",
              bgcolor: "white",
              color: "primary.main",
              "&:hover": {
                bgcolor: "primary.main",
                color: "white",
              },
              minWidth: "40px",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              boxShadow: 2,
            }}
          >
            <ArrowForwardIosIcon />
          </Button>
        )}
      </div>
    </div>
  );
};

export default HomeProductSection;
