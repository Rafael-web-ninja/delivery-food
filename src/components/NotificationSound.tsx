import { useEffect } from 'react';

interface NotificationSoundProps {
  enabled: boolean;
  onPlay?: () => void;
}

// Type declaration for webkit compatibility
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

// Create notification sound using Web Audio API
const createNotificationSound = () => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext || null;
  
  if (!AudioContextClass) {
    console.warn('Web Audio API not supported');
    return () => {};
  }
  
  const audioContext = new AudioContextClass();
  
  const playSound = () => {
    // Create oscillator for the first tone
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    
    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);
    
    // First tone: 800Hz
    oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator1.type = 'sine';
    
    // Volume envelope for first tone
    gainNode1.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode1.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.3);
    
    // Second tone: 1000Hz (slightly delayed)
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      
      oscillator2.frequency.setValueAtTime(1000, audioContext.currentTime);
      oscillator2.type = 'sine';
      
      // Volume envelope for second tone
      gainNode2.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode2.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      oscillator2.start(audioContext.currentTime);
      oscillator2.stop(audioContext.currentTime + 0.4);
    }, 100);
  };
  
  return playSound;
};

let soundPlayer: (() => void) | null = null;

export const NotificationSound = ({ enabled, onPlay }: NotificationSoundProps) => {
  useEffect(() => {
    if (enabled && !soundPlayer) {
      try {
        soundPlayer = createNotificationSound();
      } catch (error) {
        console.warn('Could not create notification sound:', error);
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled && soundPlayer && onPlay) {
      try {
        soundPlayer();
        onPlay();
      } catch (error) {
        console.warn('Could not play notification sound:', error);
      }
    }
  }, [enabled, onPlay, soundPlayer]);

  return null;
};

// Hook for playing notification sounds
export const useNotificationSound = () => {
  const playNotificationSound = () => {
    if (!soundPlayer) {
      try {
        soundPlayer = createNotificationSound();
      } catch (error) {
        console.warn('Could not create notification sound:', error);
        return;
      }
    }
    
    try {
      soundPlayer();
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  return { playNotificationSound };
};