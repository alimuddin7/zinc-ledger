/**
 * Calibration Modal Screen
 * Reads target from Zustand store and renders CalibrationModalContent.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { CalibrationModalContent } from '@/src/components/CalibrationModal';
import { useAppStore } from '@/src/store/useAppStore';

export default function ModalScreen() {
  const target = useAppStore((s) => s.calibrationTarget);
  const closeCalibration = useAppStore((s) => s.closeCalibration);
  const router = useRouter();

  const handleComplete = () => {
    router.back();
    // Clear state after a short delay to ensure the modal animation finishes smoothly
    setTimeout(() => closeCalibration(), 300);
  };

  const handleCancel = () => {
    router.back();
    setTimeout(() => closeCalibration(), 300);
  };

  if (!target) {
    return (
      <View className="flex-1 bg-zinc-50 dark:bg-zinc-950 justify-center items-center">
        <Text className="text-zinc-400 dark:text-zinc-500 font-inter-medium text-base">No component selected</Text>
      </View>
    );
  }

  return <CalibrationModalContent onComplete={handleComplete} onCancel={handleCancel} />;
}
