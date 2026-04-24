import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Carousel } from "@material-tailwind/react";
import ProductComponent from "../../components/ProductComponent/ProductComponent";
import AnimationScroll from "../../components/AnimationScroll/AnimationScroll";
import { useAuth } from "../../context/AuthContext";
import { useProduct } from "../../context/ProductContext";
import { getFavourite } from "../../services/api/FavouriteApi";
import { useUser } from "../../context/UserContext";
import ButtonComponent from "../../components/ButtonComponent/ButtonComponent";
import { getDetailStore } from "../../services/api/StoreApi";

const HOME_INITIAL_LIMIT = 16;
const HOME_LOAD_MORE_LIMIT = 8;

const HomePage = () => {
  const navigate = useNavigate();
  const {
    bestSellerProducts,
    homeProducts,
    homePagination,
    fetchBestSellerProducts,
    fetchHomeProducts,
  } = useProduct();
  const { fetchUser } = useUser();
  const { token } = useAuth();

  const [favourites, setFavourites] = useState([]);
  const [banners, setBanners] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(3);

  const storeId = "680a5a2fe8930a6de2ee81d2";

  useEffect(() => {
    const fetchBanner = async () => {
      const res = await getDetailStore(storeId);
      if (res?.EC === 0 && res?.result) {
        setBanners(res.result.store_banner || []);
      }
    };
    fetchBanner();
  }, []);

  const fetchFavourites = async () => {
    if (!token) {
      return;
    }
    const res = await getFavourite();
    if (res?.EC === 0) {
      setFavourites(res.result || []);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUser();
      fetchFavourites();
    }
  }, [token]);

  useEffect(() => {
    const fetchInitialHomeProducts = async () => {
      await fetchBestSellerProducts({ limit: 8 });
      await fetchHomeProducts({
        page: 1,
        limit: HOME_INITIAL_LIMIT,
        append: false,
      });
      setNextPage(3);
    };
    fetchInitialHomeProducts();
  }, []);

  const handleLoadMore = async () => {
    if (isLoadingMore) {
      return;
    }
    if ((homePagination?.totalItems || 0) <= homeProducts.length) {
      return;
    }

    setIsLoadingMore(true);
    const res = await fetchHomeProducts({
      page: nextPage,
      limit: HOME_LOAD_MORE_LIMIT,
      append: true,
    });
    if (res?.EC === 0) {
      setNextPage((prev) => prev + 1);
    }
    setIsLoadingMore(false);
  };

  const hasMoreProducts =
    (homePagination?.totalItems || 0) > homeProducts.length;

  return (
    <div>
      <div className="container mx-auto my-6 px-2">
        <Carousel
          className="h-[200px] md:h-[300px] lg:h-[400px] w-full"
          navigation={({ setActiveIndex, activeIndex, length }) => (
            <div className="absolute bottom-4 left-2/4 z-50 flex -translate-x-2/4 gap-2">
              {new Array(length).fill("").map((_, i) => (
                <span
                  key={i}
                  className={`block h-1 cursor-pointer rounded-2xl transition-all ${
                    activeIndex === i ? "w-8 bg-white" : "w-4 bg-white/50"
                  }`}
                  onClick={() => setActiveIndex(i)}
                />
              ))}
            </div>
          )}
          loop
          autoplay
        >
          {banners.map((slide, index) => (
            <div
              key={index}
              className="w-full h-full flex items-center justify-center"
            >
              <img
                src={slide}
                alt={`Slide ${index}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </Carousel>

        <div className="border-t-2 border-[rgba(0, 0, 0, 0.1)] w-full my-8">
          <p className="uppercase text-4xl font-extrabold text-center my-8">
            Best Seller
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {bestSellerProducts.map((product) => (
              <AnimationScroll key={product._id} type="fadeUp" delay={0.1}>
                <ProductComponent
                  item={product}
                  favourites={favourites}
                  onFavouriteChange={fetchFavourites}
                  showCompare={false}
                  onClick={() => navigate(`/product/${product._id}`)}
                />
              </AnimationScroll>
            ))}
          </div>
        </div>

        <div className="border-t-2 border-[rgba(0, 0, 0, 0.1)] w-full my-8">
          <p className="uppercase text-4xl font-extrabold text-center my-8">
            Sản phẩm
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {homeProducts.map((product) => (
              <AnimationScroll key={product._id} type="fadeUp" delay={0.1}>
                <ProductComponent
                  item={product}
                  favourites={favourites}
                  onFavouriteChange={fetchFavourites}
                  showCompare={false}
                  onClick={() => navigate(`/product/${product._id}`)}
                />
              </AnimationScroll>
            ))}
          </div>
          {hasMoreProducts && (
            <div className="flex justify-center mt-6">
              <ButtonComponent
                color="white"
                onClick={handleLoadMore}
                className="w-[200px]"
              >
                {isLoadingMore ? "Đang tải..." : "Xem thêm"}
              </ButtonComponent>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
