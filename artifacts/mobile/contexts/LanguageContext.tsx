import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Language = "en" | "ur";

const translations = {
  en: {
    home: "Home",
    menu: "Menu",
    cart: "Cart",
    orders: "Orders",
    profile: "Profile",
    dealsBanner: "Today's Deals",
    dealsSubtitle: "Limited time offers",
    mostPopular: "Most Popular",
    popularSub: "Customer favourites",
    browseCategory: "Browse by Category",
    seeAll: "See All",
    dineIn: "Dine In",
    dinein: "Dine In",
    takeaway: "Takeaway",
    delivery: "Delivery",
    welcomeBack: "Welcome back!",
    orderNow: "Order Now",
    addToCart: "Add to Cart",
    proceedCheckout: "Proceed to Checkout",
    signInCheckout: "Sign In to Checkout",
    placeOrder: "Place Order",
    orderSummary: "Order Summary",
    subtotal: "Subtotal",
    tax: "Tax (17%)",
    total: "Total",
    deliveryFee: "Delivery fee",
    loyaltyPoints: "Loyalty Points",
    redeemPoints: "Redeem Points",
    pointsEarned: "Points Earned",
    yourPoints: "Your Points",
    settings: "Settings",
    language: "Language",
    notifications: "Push Notifications",
    contactUs: "Contact Us",
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    appVersion: "App Version",
    signOut: "Sign Out",
    savedAddresses: "Delivery Addresses",
    chicken: "Chicken",
    burgers: "Burgers",
    wraps: "Wraps",
    sides: "Sides",
    drinks: "Drinks",
    desserts: "Desserts",
    deals: "Deals",
    popular: "Popular",
    spicy: "Spicy",
    isNew: "New",
    quantity: "Quantity",
    calories: "kcal per serving",
    inCart: "already in cart",
    orderType: "Order Type",
    payment: "Payment",
    note: "Note (optional)",
    specialRequests: "Special requests, allergies, extra sauce...",
    orderPlaced: "Order Placed!",
    trackOrder: "Track Order",
    backToHome: "Back to Home",
    orderReceived: "Order Received",
    preparing: "Preparing",
    ready: "Ready for Pickup",
    delivered: "Delivered",
    activeOrders: "Active",
    pastOrders: "Past Orders",
    emptyCart: "Your cart is empty",
    emptyCartSub: "Add some delicious items from our menu to get started!",
    browseMenu: "Browse Menu",
    clearAll: "Clear All",
    searchMenu: "Search menu...",
    signIn: "Sign In / Register",
    guest: "Guest",
    continueShopping: "Continue as guest (browse only)",
    fullName: "Full Name",
    phoneNumber: "Phone Number",
    continue: "Continue",
    addressType: "Address Type",
    fullAddress: "Full Address",
    setDefault: "Set as default address",
    saveAddress: "Save Address",
    updateAddress: "Update Address",
    ordersTab: "orders",
    about: "ABOUT THB",
    account: "ACCOUNT",
    open: "Open",
    closed: "Closed",
    selected: "Selected",
    estimatedTime: "Estimated Time",
    totalPaid: "Total Paid",
  },
  ur: {
    home: "ہوم",
    menu: "مینو",
    cart: "کارٹ",
    orders: "آرڈرز",
    profile: "پروفائل",
    dealsBanner: "آج کے ڈیلز",
    dealsSubtitle: "محدود وقت کی پیشکش",
    mostPopular: "سب سے مقبول",
    popularSub: "مشتریوں کی پسندیدہ",
    browseCategory: "کیٹیگری دیکھیں",
    seeAll: "سب دیکھیں",
    dineIn: "ریستوراں میں",
    dinein: "ریستوراں میں",
    takeaway: "ٹیک اوے",
    delivery: "ڈیلیوری",
    welcomeBack: "خوش آمدید!",
    orderNow: "ابھی آرڈر کریں",
    addToCart: "کارٹ میں ڈالیں",
    proceedCheckout: "چیک آؤٹ",
    signInCheckout: "سائن ان کریں",
    placeOrder: "آرڈر دیں",
    orderSummary: "آرڈر خلاصہ",
    subtotal: "ذیلی کل",
    tax: "ٹیکس (17%)",
    total: "کل",
    deliveryFee: "ڈیلیوری فیس",
    loyaltyPoints: "لائلٹی پوائنٹس",
    redeemPoints: "پوائنٹس استعمال کریں",
    pointsEarned: "پوائنٹس ملے",
    yourPoints: "آپ کے پوائنٹس",
    settings: "ترتیبات",
    language: "زبان",
    notifications: "اطلاعات",
    contactUs: "ہم سے رابطہ",
    terms: "شرائط و ضوابط",
    privacy: "رازداری کی پالیسی",
    appVersion: "ایپ ورژن",
    signOut: "سائن آؤٹ",
    savedAddresses: "ڈیلیوری پتے",
    chicken: "چکن",
    burgers: "برگر",
    wraps: "ریپ",
    sides: "سائیڈز",
    drinks: "مشروبات",
    desserts: "میٹھا",
    deals: "ڈیلز",
    popular: "مقبول",
    spicy: "مسالہ دار",
    isNew: "نیا",
    quantity: "مقدار",
    calories: "کیلوری فی سرونگ",
    inCart: "کارٹ میں ہے",
    orderType: "آرڈر کی قسم",
    payment: "ادائیگی",
    note: "نوٹ (اختیاری)",
    specialRequests: "خاص گزارش، الرجی، اضافی چٹنی...",
    orderPlaced: "آرڈر ہو گیا!",
    trackOrder: "آرڈر ٹریک کریں",
    backToHome: "ہوم پر واپس",
    orderReceived: "آرڈر موصول",
    preparing: "تیاری جاری",
    ready: "تیار ہے",
    delivered: "پہنچ گیا",
    activeOrders: "فعال",
    pastOrders: "پرانے آرڈر",
    emptyCart: "کارٹ خالی ہے",
    emptyCartSub: "مینو سے کچھ لذیذ چیزیں شامل کریں!",
    browseMenu: "مینو دیکھیں",
    clearAll: "سب ہٹائیں",
    searchMenu: "مینو تلاش کریں...",
    signIn: "سائن ان / رجسٹر",
    guest: "مہمان",
    continueShopping: "مہمان کے طور پر جاری رکھیں",
    fullName: "پورا نام",
    phoneNumber: "فون نمبر",
    continue: "جاری رکھیں",
    addressType: "پتے کی قسم",
    fullAddress: "مکمل پتہ",
    setDefault: "ڈیفالٹ پتہ بنائیں",
    saveAddress: "پتہ محفوظ کریں",
    updateAddress: "پتہ اپ ڈیٹ کریں",
    ordersTab: "آرڈرز",
    about: "THB کے بارے میں",
    account: "اکاؤنٹ",
    open: "کھلا",
    closed: "بند",
    selected: "منتخب",
    estimatedTime: "متوقع وقت",
    totalPaid: "کل ادا",
  },
};

export type TranslationKeys = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    AsyncStorage.getItem("thb_language").then((lang) => {
      if (lang === "en" || lang === "ur") {
        setLanguageState(lang);
      }
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem("thb_language", lang);
  }, []);

  const t = useCallback(
    (key: TranslationKeys): string => {
      return (translations[language] as Record<string, string>)[key] ?? (translations.en as Record<string, string>)[key] ?? key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
