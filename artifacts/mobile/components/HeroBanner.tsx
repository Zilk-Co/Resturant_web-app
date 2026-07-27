import Feather from "react-native-vector-icons/Feather";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { customFetch } from "@/lib/api-client";
import { resolveMenuImageUrl } from "@/lib/menuUtils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDE_WIDTH = SCREEN_WIDTH;
const SLIDE_HEIGHT = 210;
const AUTO_SCROLL_MS = 3500;

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  gradStart: string;
  gradEnd: string;
  ctaLabel: string;
  ctaCat: string;
  imageUrl: string;
};

const FALLBACK_SLIDES: Slide[] = [
  {
    id: "s1",
    title: "Big Deals, Bigger Savings",
    subtitle: "Save up to 40% on family meals",
    tag: "LIMITED TIME",
    tagColor: "#D4AF37",
    gradStart: "#1A3525",
    gradEnd: "#0D1F15",
    ctaLabel: "Order Now",
    ctaCat: "deals",
    imageUrl: "",
  },
  {
    id: "s2",
    title: "Istanbul Zinger Burger",
    subtitle: "Crispy, spicy, irresistible",
    tag: "BESTSELLER",
    tagColor: "#C8102E",
    gradStart: "#2D5A3D",
    gradEnd: "#1A3525",
    ctaLabel: "View Menu",
    ctaCat: "burgers",
    imageUrl: "",
  },
  {
    id: "s3",
    title: "Crispy Chicken",
    subtitle: "Golden fried perfection",
    tag: "POPULAR",
    tagColor: "#D4AF37",
    gradStart: "#1A3525",
    gradEnd: "#0D3B1A",
    ctaLabel: "Order Now",
    ctaCat: "chicken",
    imageUrl: "",
  },
];

export function HeroBanner() {
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [slides, setSlides] = useState<Slide[]>(FALLBACK_SLIDES);
  const [activeIndex, setActiveIndex] = useState(0);
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    customFetch<Slide[]>("/api/mobile/banners")
      .catch(() => [])
      .then((banners) => {
        // Use only banners from Banner Management (App Only)
        const allSlides = banners?.length ? banners : FALLBACK_SLIDES;
        setSlides(allSlides);
      });
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % slides.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_SCROLL_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  const renderSlide = ({ item }: { item: Slide }) => {
    const resolvedImage = resolveMenuImageUrl(item.imageUrl);
    
    return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.slide}
      onPress={() => {
        (navigation as any).navigate("Menu", { cat: item.ctaCat });
      }}
    >
      {resolvedImage ? (
        <Image source={{ uri: resolvedImage }} style={styles.slideImage} resizeMode="cover" />
      ) : (
        <View style={[styles.slideImage, { backgroundColor: item.gradStart }]} />
      )}
      <LinearGradient
        colors={[item.gradStart, item.gradEnd] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.overlay}
      >
        <View style={styles.slideContent}>
          <View style={[styles.tagPill, { backgroundColor: item.tagColor }]}>
            <Text style={styles.tagText}>{item.tag}</Text>
          </View>
          <Text style={styles.slideTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.slideSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>{item.ctaLabel}</Text>
            <Feather name="arrow-right" size={12} color="#FFFFFF" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(s) => s.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: SLIDE_WIDTH,
          offset: SLIDE_WIDTH * index,
          index,
        })}
      />
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                width: i === activeIndex ? 20 : 6,
                opacity: i === activeIndex ? 1 : 0.4,
                backgroundColor: "#FFFFFF",
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: SLIDE_HEIGHT,
    position: "relative",
  },
  slide: {
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    overflow: "hidden",
  },
  slideImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: 18,
  },
  slideContent: {
    gap: 4,
  },
  tagPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  slideTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    lineHeight: 24,
  },
  slideSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  ctaText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  dots: {
    position: "absolute",
    bottom: 10,
    right: 14,
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
});
