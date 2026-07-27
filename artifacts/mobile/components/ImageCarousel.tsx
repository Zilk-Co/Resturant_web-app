import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

type ImageCarouselProps = {
  images: string[];
  height?: number;
  autoScrollInterval?: number;
};

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  height = 300,
  autoScrollInterval = 3000,
}) => {
  const { width: windowWidth } = useWindowDimensions();

  if (!images || images.length === 0) {
    return (
      <View
        style={[
          styles.emptySlide,
          { height, width: windowWidth, backgroundColor: "#f5f5f5" },
        ]}
      />
    );
  }

  const flatListRef = useRef<FlatList<string>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const dotAnim = useRef(images.map(() => new Animated.Value(0))).current;

  const animateDots = (index: number) => {
    if (index >= 0 && index < images.length) {
      images.forEach((_, i) => {
        Animated.timing(dotAnim[i]!, {
          toValue: i === index ? 1 : 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      });
    }
  };

  useEffect(() => {
    animateDots(0);
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % images.length;
        if (flatListRef.current) {
          try {
            flatListRef.current.scrollToIndex({ index: next, animated: true });
          } catch (e) {
            // Suppress scroll errors
          }
        }
        animateDots(next);
        return next;
      });
    }, autoScrollInterval);
    return () => clearInterval(timer);
  }, [images, autoScrollInterval]);

  const handleScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
    if (!isNaN(idx) && idx !== activeIndex && idx >= 0 && idx < images.length) {
      setActiveIndex(idx);
      animateDots(idx);
    }
  };

  return (
    <View style={[styles.container, { height, width: windowWidth }]}>
      <FlatList
        ref={flatListRef}
        data={images}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={({ item }) => (
          /* Slide: exact same size as the container */
          <View
            style={{ width: windowWidth, height, backgroundColor: "#FFFFFF" }}
          >
            {/* absoluteFillObject ensures the image fills the entire slide;
                resizeMode="contain" then centers the product within those bounds */}
            <Image
              source={{ uri: item }}
              style={[StyleSheet.absoluteFillObject]}
              resizeMode="contain"
            />
          </View>
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: windowWidth,
          offset: windowWidth * index,
          index,
        })}
      />
      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  width: dotAnim[i]!.interpolate({
                    inputRange: [0, 1],
                    outputRange: [6, 20],
                  }),
                  opacity: dotAnim[i]!.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 1],
                  }),
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  emptySlide: {
    justifyContent: "center",
    alignItems: "center",
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
