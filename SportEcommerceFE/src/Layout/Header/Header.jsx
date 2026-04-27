import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import clsx from "clsx";
import {
  FaHeart,
  FaShoppingCart,
  FaSearch,
  FaBars,
  FaBell,
} from "react-icons/fa";
import logo from "../../assets/images/logo.png";
import { AiOutlineClose } from "react-icons/ai";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MdNavigateNext, MdExpandMore, MdExpandLess } from "react-icons/md";
import flag_vn from "../../assets/images/flag_vn.jpg";
import flag_us from "../../assets/images/flag_us.jpg";
import { useAuth } from "../../context/AuthContext";
import avatar_false from "../../assets/images/avatar-false.jpg";
import { useUser } from "../../context/UserContext";
import { IoTrashOutline } from "react-icons/io5";
import { useCart } from "../../context/CartContext";
import { useNotifications } from "../../context/NotificationContext";
import { usePopup } from "../../context/PopupContext";
import { useCategories } from "../../context/CategoriesContext";

const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const [language, setLanguage] = useState("vi");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);
  const [displayAllHistory, setDisplayAllHistory] = useState(false);
  const [fullSearchHistory, setFullSearchHistory] = useState([]);
  const { selectedUser, fetchUser, handleDeleteSearch } = useUser();
  const { cart, fetchCart } = useCart();
  const { unreadCount } = useNotifications();
  const { token } = useAuth();
  const navigate = useNavigate();
  const showCartDot = cart?.products?.length;
  const showNotificationDot = unreadCount;
  const { handleLogout } = useAuth();
  const { showPopup } = usePopup();
  const { categories, fetchCategories } = useCategories();

  useEffect(() => {
    fetchCategories();
  }, []);

  const options = categories
    .filter((c) => !c.category_parent_id)
    .map((parent) => ({
      name: parent.category_name,
      slug: parent.category_slug,
      subCategories: categories
        .filter((c) => c.category_parent_id === parent._id)
        .map((child) => ({
          name: child.category_name,
          slug: child.category_slug,
        })),
    }));

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    setDisplayAllHistory(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory");

    if (token) {
      localStorage.removeItem("searchHistory");
      if (selectedUser && selectedUser?.searchhistory) {
        const reversedHistory = [...selectedUser.searchhistory]
          .map((item, index) => ({ ...item, originalIndex: index }))
          .reverse();
        setFullSearchHistory(reversedHistory);
        setSearchHistory(reversedHistory.slice(0, 5));
      }
      fetchCart();
    } else if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          setFullSearchHistory(parsedHistory);
          setSearchHistory(parsedHistory.slice(0, 5));
        }
      } catch {
        localStorage.removeItem("searchHistory");
        return;
      }
    }
  }, [token, selectedUser]);

  useEffect(() => {
    if (searchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [searchOpen]);

  const handleSearch = async (customQuery) => {
    const query = customQuery !== undefined ? customQuery : searchQuery;
    if (!query.trim()) return;
    try {
      const token = localStorage.getItem("accessToken");

      // Save search history
      if (!token) {
        let updatedHistory = [
          query,
          ...fullSearchHistory.filter((q) => q !== query),
        ];
        setFullSearchHistory(updatedHistory);
        setSearchHistory(updatedHistory.slice(0, 5));
        localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
      } else if (selectedUser && selectedUser?.searchhistory) {
        const newHistoryItem = { message: query, originalIndex: -1 };
        const updatedHistory = [newHistoryItem, ...fullSearchHistory];

        setFullSearchHistory(updatedHistory);
        setSearchHistory(updatedHistory.slice(0, 5));

        // Refresh user data
        fetchUser();
      }

      setSearchOpen(false);
      setDisplayAllHistory(false);
      
      const params = new URLSearchParams();
      params.append("search", query);
      navigate(`/product?${params.toString()}`);
    } catch {
      return;
    }
  };

  const removeHistoryItem = async (index, isFullView = false) => {
    const targetArray = isFullView ? fullSearchHistory : searchHistory;
    const historyItem = targetArray[index];

    if (token && historyItem?.originalIndex !== undefined) {
      await handleDeleteSearch(historyItem.originalIndex);

      const updatedFullHistory = [...fullSearchHistory];
      const fullIndex = isFullView
        ? index
        : fullSearchHistory.findIndex(
            (item) => item.originalIndex === historyItem.originalIndex,
          );

      if (fullIndex !== -1) {
        updatedFullHistory.splice(fullIndex, 1);
        setFullSearchHistory(updatedFullHistory);
        setSearchHistory(updatedFullHistory.slice(0, 5));
      }
    } else {
      const updatedFullHistory = [...fullSearchHistory];
      const fullIndex = isFullView
        ? index
        : fullSearchHistory.indexOf(historyItem);

      if (fullIndex !== -1) {
        updatedFullHistory.splice(fullIndex, 1);
        setFullSearchHistory(updatedFullHistory);
        setSearchHistory(updatedFullHistory.slice(0, 5));
        localStorage.setItem(
          "searchHistory",
          JSON.stringify(updatedFullHistory),
        );
      }
    }
  };

  const toggleDisplayAllHistory = () => {
    setDisplayAllHistory(!displayAllHistory);
  };

  const displayedHistory = displayAllHistory
    ? fullSearchHistory
    : searchHistory;
  const hasMoreHistory = fullSearchHistory.length > 5;

  const navigateToCategory = (categorySlug = null) => {
    const params = new URLSearchParams();

    if (categorySlug) {
      params.append("category", categorySlug);
    }

    const url = `/product?${params.toString()}`;
    return url;
  };



  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [menuOpen]);

  const toggleSubMenu = (index) => {
    setOpenSubMenu(openSubMenu === index ? null : index);
  };

  const toggleLanguage = () => {
    setLanguage(language === "vi" ? "en" : "vi");
  };

  const handleSubmitLogout = async () => {
    await handleLogout();
    localStorage.removeItem("compareList");
    window.dispatchEvent(new CustomEvent("compareListUpdated"));
    navigate("/", { replace: true });
  };

  const handleMenuItemClick = (url) => {
    navigate(url);
    if (menuOpen) {
      toggleMenu();
    }
  };

  return (
    <div
      className={clsx(
        "w-full h-[80px] fixed top-0 left-0 right-0 bg-primary z-10 shadow-md transition-transform duration-300 ease-in-out",
      )}
    >
      <div className="container mx-auto flex justify-between items-center h-full px-2">
        <div className="flex items-center h-full">
          <div className="p-2 flex items-center space-x-4 lg:hidden">
            <button onClick={toggleMenu} className="text-white text-2xl">
              <FaBars />
            </button>
            <button
              onClick={toggleSearch}
              className="p-2 rounded-full hover:bg-white/20 transition cursor-pointer text-white text-xl"
            >
              <FaSearch />
            </button>
          </div>

          <Link to={"/"}>
            <img src={logo} className="w-[120px] h-[80px] hidden lg:block" />
          </Link>

          <div className="hidden lg:block h-full relative">
            <ul className="text-white flex space-x-4 text-sm font-medium ml-4 h-full">
              {options.map((option, index) => (
                <li
                  key={index}
                  className="relative group h-full flex items-center cursor-pointer transition-all duration-300 ease-in-out
                  hover:opacity-100 after:content-[''] after:absolute after:left-0 after:right-0 
                   after:h-[2px] after:bg-[#8a7350] after:bottom-[26px] 
                  after:scale-x-0 hover:after:scale-x-100 
                  after:transition-transform after:duration-300"
                >
                  <Link to={navigateToCategory(option.slug)}>
                    {option.name}
                  </Link>
                  {option.subCategories?.length > 0 && (
                    <div className="absolute left-0 top-[60px] bg-white text-black w-56 shadow-lg p-2 z-10 opacity-0 scale-95 invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible transition-all duration-300">
                      {option.subCategories.map((category, i) => (
                        <Link
                          key={i}
                          to={navigateToCategory(category.slug)}
                          className="block px-4 py-2 hover:bg-gray-200 rounded"
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Link to={"/"}>
          <img
            src={logo}
            className="w-[100px] h-[60px] md:w-[150px] md:h-[80px] lg:hidden"
          />
        </Link>

        <div className="flex items-center">
          <div className="flex items-center space-x-4 text-white text-xl">
            <button
              onClick={toggleSearch}
              className="items-center border border-[#676d75] py-2 px-4 text-white uppercase space-x-2 hover:border-white hidden lg:flex"
            >
              <FaSearch className="text-base" />
              <p className="text-base">Tìm kiếm</p>
            </button>
            {token ? (
              <div className="flex items-center space-x-4 text-white text-xl">
                <Link to={"/favorite"} className="hidden lg:block">
                  <div className="p-2 rounded-full hover:bg-white/20 transition cursor-pointer">
                    <FaHeart />
                  </div>
                </Link>
                <Link to={"/notifications"} className="hidden lg:block">
                  <div className="p-2 rounded-full hover:bg-white/20 transition cursor-pointer">
                    <div className="relative">
                      <FaBell />
                      {showNotificationDot > 0 && (
                        <span className="absolute -top-[6px] -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                          {showNotificationDot}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="relative group order-1 rounded-none">
                  <div className="flex items-center cursor-pointer">
                    <Link to="/account">
                      <img
                        src={selectedUser?.avt_img || avatar_false}
                        alt="User avatar"
                        className="w-7 h-7 rounded-full ml-1"
                      />
                    </Link>
                  </div>
                  <div
                    className="hidden lg:block before:content-['']  before:absolute before:top-[-15px] before:right-0 before:w-[40px] before:h-4
  text-sm absolute top-[35px] right-0 w-[150px] bg-white shadow-lg text-black opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50"
                  >
                    <Link
                      to="/account"
                      className="group block px-4 py-2 hover:bg-gray-100 border-b border-gray-200"
                    >
                      <span>Tài khoản của tôi</span>
                    </Link>

                    <button
                      onClick={handleSubmitLogout}
                      className="group block w-full text-left px-4 py-2 hover:bg-gray-100 hover:text-red-500"
                    >
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
                <Link to={"/cart"}>
                  <div className="relative p-2 rounded-full hover:bg-white/20 transition cursor-pointer">
                    <FaShoppingCart />
                    {showCartDot > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                        {showCartDot}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            ) : (
              <div className="order-1 flex items-center space-x-4 text-sm font-medium">
                <Link
                  to="/sign-up"
                  className="relative group text-white uppercase transition-all duration-300 ease-in-out
      hover:opacity-100 after:content-[''] after:absolute after:left-0 after:right-0 
      after:h-[2px] after:bg-[#8a7350] after:-bottom-[3px]
      after:scale-x-0 hover:after:scale-x-100 
      after:transition-transform after:duration-300"
                >
                  Đăng ký
                </Link>
                <Link
                  to="/sign-in"
                  className="relative group text-white uppercase transition-all duration-300 ease-in-out
    hover:opacity-100 after:content-[''] after:absolute after:left-0 after:right-0 
    after:h-[2px] after:bg-[#8a7350] after:-bottom-[3px]
    after:scale-x-0 hover:after:scale-x-100 
    after:transition-transform after:duration-300"
                >
                  Đăng nhập
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            key="menu-overlay"
            onClick={toggleMenu}
          >
            <motion.div
              className="bg-white w-[80%] h-full shadow-lg p-6 relative overflow-auto"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.5 }}
              key="menu-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={toggleMenu}
                className="absolute top-2 right-5 text-2xl text-black p-2 rounded-full hover:bg-[#d1d1d1] transition cursor-pointer w-auto"
              >
                <AiOutlineClose className="w-5 h-5" />
              </button>
              <ul className="mt-6">
                {options.map((option, index) => {
                  const hasSubCategories = option.subCategories?.length > 0;

                  return (
                    <li key={index}>
                      <div className="border-t-[1px] border-[rgba(0, 0, 0, 0.1)] w-full my-3"></div>
                      <button
                        onClick={() => {
                          if (!hasSubCategories) {
                            handleMenuItemClick(
                              navigateToCategory(option.slug),
                            );
                            return;
                          }
                          toggleSubMenu(index);
                        }}
                        className="block px-4 py-2 font-semibold text-xl w-full"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-800">
                            {option.name}
                          </h3>
                          {hasSubCategories && openSubMenu === index ? (
                            <MdExpandLess className="w-7 h-7" />
                          ) : (
                            <MdNavigateNext className="w-7 h-7" />
                          )}
                        </div>
                      </button>
                      {hasSubCategories && openSubMenu === index && (
                        <div className="space-y-1 pl-4">
                          {option.subCategories.map((category, j) => (
                            <button
                              key={j}
                              className="block px-4 py-2 text-gray-500 hover:text-black text-base w-full text-left"
                              onClick={() =>
                                handleMenuItemClick(
                                  navigateToCategory(category.slug),
                                )
                              }
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
                <div className="py-2 px-4 mt-5 text-[#181818] w-full">
                  <p>
                    <Link className="block" to="/about-us" onClick={toggleMenu}>
                      Về chúng tôi
                    </Link>
                  </p>
                  {token && (
                    <div>
                      <div className="border-t-[1px] border-[rgba(0, 0, 0, 0.1)] w-full my-4"></div>
                      <p>
                        <Link
                          className="block"
                          to="/favorite"
                          onClick={toggleMenu}
                        >
                          Sản phẩm yêu thích
                        </Link>
                      </p>
                    </div>
                  )}
                  <div className="border-t-[1px] border-[rgba(0, 0, 0, 0.1)] w-full my-4"></div>
                  <button
                    onClick={toggleLanguage}
                    className="flex items-center text-[#181818] w-full justify-between"
                  >
                    <span>Ngôn ngữ</span>
                    <div className="flex items-center">
                      <span>{language === "vi" ? "VN" : "US"}</span>
                      <img
                        src={language === "vi" ? flag_vn : flag_us}
                        alt="flag"
                        className="w-6 h-6 rounded-full object-cover ml-2"
                      />
                    </div>
                  </button>
                </div>
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {searchOpen && (
        <div>
          <div className="absolute top-0 left-0 w-full h-[100px] bg-white flex items-center justify-center shadow-md z-10">
            <div className="w-1/2 max-w-[800px] flex items-center">
              <input
                type="text"
                placeholder="Tìm kiếm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                className="w-full p-2 border border-gray-300 focus:outline-none"
              />
              <button onClick={toggleSearch} className="ml-4">
                <AiOutlineClose className="text-2xl text-black hover:opacity-90" />
              </button>
            </div>
          </div>
          <div
            className="fixed top-[100px] left-0 right-0 h-screen w-screen bg-black/40 z-20"
            onClick={toggleSearch}
          ></div>
        </div>
      )}

      {fullSearchHistory.length > 0 && searchOpen && (
        <div className="max-h-[300px] lg:max-h-[400px] absolute left-0 right-0 w-full bg-white overflow-y-auto z-30">
          <div className="w-1/2 max-w-[800px] mx-auto py-[10px]">
            <ul className="">
              {displayedHistory.map((item, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center hover:bg-[#eaeaea] rounded px-2 py-[10px] cursor-pointer"
                  onClick={() => {
                    const value = token ? item.message : item;
                    setSearchQuery(value);
                    handleSearch(value);
                  }}
                >
                  <span>{token ? item.message : item}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeHistoryItem(index, displayAllHistory);
                    }}
                    className="text-md text-red-600 hover:scale-105 ml-2"
                  >
                    <IoTrashOutline className="text-2xl text-red-500" />
                  </button>
                </li>
              ))}
            </ul>

            {hasMoreHistory && (
              <div
                className="flex justify-center items-center mt-2 py-2 font-medium cursor-pointer hover:bg-gray-100 rounded"
                onClick={toggleDisplayAllHistory}
              >
                {displayAllHistory ? (
                  <div className="flex items-center">
                    <span>Thu gọn</span>
                    <MdExpandLess className="ml-1 text-xl" />
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span>Xem tất cả</span>
                    <MdExpandMore className="ml-1 text-xl" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
