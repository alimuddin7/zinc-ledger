import React, { useRef, useState } from 'react';
import { View, Pressable, Animated, Platform, useColorScheme, PanResponder } from 'react-native';
import { Trash2 } from 'lucide-react-native';

interface SwipeableItemProps {
  children: React.ReactNode;
  onDelete: () => void;
}

/**
 * SwipeableItem — Unified component that handles swipe gestures.
 */
export function SwipeableItem({ children, onDelete }: SwipeableItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (Platform.OS === 'web') {
    return <WebSwipeable onDelete={onDelete} isDark={isDark}>{children}</WebSwipeable>;
  }

  // Native Implementation
  const { Swipeable } = require('react-native-gesture-handler');

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <Pressable
        onPress={onDelete}
        style={{
          width: 70,
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: 10,
          marginBottom: 12,
          borderRadius: 20,
          backgroundColor: isDark ? 'rgba(244,63,94,0.15)' : 'rgba(244,63,94,0.08)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(244,63,94,0.3)' : 'rgba(244,63,94,0.2)',
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Trash2 size={24} color={isDark ? '#fb7185' : '#e11d48'} strokeWidth={2.5} />
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      {children}
    </Swipeable>
  );
}

/**
 * Web-specific simulated swipe using PanResponder.
 * Fixed layout to prevent overlap and preserve shadows.
 */
function WebSwipeable({ children, onDelete, isDark }: { children: React.ReactNode, onDelete: () => void, isDark: boolean }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [revealed, setRevealed] = useState(false);
  const startX = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 20,
      onPanResponderGrant: () => {
        startX.current = revealed ? -80 : 0;
      },
      onPanResponderMove: (_, gs) => {
        let newX = startX.current + gs.dx;
        if (newX > 0) newX = 0;
        if (newX < -100) newX = -100;
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gs) => {
        const finalX = startX.current + gs.dx;
        if (finalX < -40) {
          Animated.spring(translateX, { toValue: -80, useNativeDriver: false, bounciness: 0 }).start();
          setRevealed(true);
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: false, bounciness: 0 }).start();
          setRevealed(false);
        }
      },
    })
  ).current;

  const close = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: false }).start();
    setRevealed(false);
  };

  return (
    <View style={{ 
      marginBottom: 12, 
      position: 'relative',
      borderRadius: 20,
      backgroundColor: isDark ? '#450a0a' : '#fef2f2', // Show delete bg color
    }}>
      {/* Background Action Layer */}
      <View style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Pressable 
          onPress={() => { onDelete(); close(); }}
          style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
        >
          <Trash2 size={22} color="#ef4444" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Foreground Content Layer */}
      <Animated.View 
        {...panResponder.panHandlers}
        style={{ 
          transform: [{ translateX }],
          backgroundColor: isDark ? '#09090b' : '#ffffff',
          borderRadius: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        {revealed && (
          <Pressable 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }} 
            onPress={close}
          />
        )}
        {children}
      </Animated.View>
    </View>
  );
}
