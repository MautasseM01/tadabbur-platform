'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  onTimeUpdate: (time: number) => void;
  isHidden?: boolean;
}

export default function YouTubeAudioPlayer({ videoId, onTimeUpdate, isHidden = true }: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Load YouTube IFrame API script
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    function initPlayer() {
      playerRef.current = new window.YT.Player('youtube-audio-player', {
        height: '0',
        width: '0',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          fs: 0,
        },
        events: {
          onReady: () => setIsReady(true),
          onStateChange: (event: any) => {
            // If playing (state 1), start interval
          }
        },
      });
    }

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isReady && playerRef.current) {
      interval = setInterval(() => {
        if (playerRef.current.getPlayerState() === 1) { // Playing
          onTimeUpdate(playerRef.current.getCurrentTime());
        }
      }, 500); // Check every 500ms
    }
    return () => clearInterval(interval);
  }, [isReady, onTimeUpdate]);

  return (
    <div className={isHidden ? 'hidden' : 'fixed bottom-4 right-4 w-64 h-36 bg-black rounded shadow-lg overflow-hidden'}>
      <div id="youtube-audio-player" className="w-full h-full" />
      <div className="absolute inset-0 z-10 pointer-events-none border-2 border-emerald-500/20 rounded" />
    </div>
  );
}
