'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Maximize, Minimize, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

interface PinnedPlayerProps {
  videoId: string;
  startTime?: number;
  seekTime?: number | null;
  title?: string;
  subtitle?: string;
  onTimeUpdate?: (time: number) => void;
  onClose?: () => void; // If provided, shows a close button (for Tafsir)
  onSeeked?: () => void; // Called after an external seek is consumed
  autoPlay?: boolean;
  autoPlayNext?: boolean;
  onToggleAutoPlayNext?: () => void;
  theme?: 'light' | 'sepia' | 'dark';
}

const PLAYER_THEMES = {
  light: 'bg-white/95 border-natural-200 text-natural-900',
  sepia: 'bg-[#faf4e8]/95 border-[#dfd0b5] text-[#3e2e1e]',
  dark: 'bg-[#1a1a20]/95 border-[#2e2e38] text-zinc-100',
};

export default function PinnedPlayer({ 
  videoId, 
  startTime = 0, 
  seekTime,
  title = "تلاوة القرآن الكريم", 
  subtitle,
  onTimeUpdate,
  onClose,
  onSeeked,
  autoPlay = false,
  autoPlayNext = true,
  onToggleAutoPlayNext,
  theme = 'light'
}: PinnedPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  // Collapsed by default (compact audio bar); expanded only for tafsir videos.
  const [isExpanded, setIsExpanded] = useState<boolean>(() => !!onClose);
  const latestOptions = useRef({ startTime, autoPlay });
  latestOptions.current = { startTime, autoPlay };

  // Handle external seek requests (single-use: consumed once then reset)
  useEffect(() => {
    if (isReady && playerRef.current && seekTime !== undefined && seekTime !== null) {
      playerRef.current.seekTo(seekTime, true);
      playerRef.current.playVideo();
      onSeeked?.();
    }
  }, [seekTime, isReady, onSeeked]);

  useEffect(() => {
    // Destroy previous player when videoId changes
    if (playerRef.current?.destroy) {
      playerRef.current.destroy();
      playerRef.current = null;
      setIsReady(false);
    }

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
      const { startTime: st, autoPlay: ap } = latestOptions.current;
      // The div to replace with iframe
      const playerDiv = document.createElement('div');
      playerDiv.id = 'yt-player-target';
      containerRef.current?.appendChild(playerDiv);

      playerRef.current = new window.YT.Player('yt-player-target', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: ap ? 1 : 0,
          controls: 1,
          rel: 0,
          fs: 1,
          start: Math.floor(st),
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            setIsReady(true);
            if (ap) {
              event.target.playVideo();
            }
          },
          onStateChange: (event: any) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
          }
        },
      });
    }

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      if (containerRef.current) {
         containerRef.current.innerHTML = '';
      }
    };
  }, [videoId]); // Re-init only when the video actually changes

  // Polling for time update
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isReady && playerRef.current && isPlaying) {
      interval = setInterval(() => {
        if (onTimeUpdate && playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING) {
          onTimeUpdate(playerRef.current.getCurrentTime());
        }
      }, 300); // Freq
    }
    return () => clearInterval(interval);
  }, [isReady, isPlaying, onTimeUpdate]);

  const togglePlay = () => {
    if (!isReady || !playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const toggleMute = () => {
    if (!isReady || !playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  return (
    <div className={`sticky top-0 left-0 right-0 z-50 backdrop-blur-2xl border-b shadow-sm transition-all duration-500 ${PLAYER_THEMES[theme]}`}>
      <div className="max-w-5xl mx-auto px-4 w-full">
        
        {/* Expanded Video Container */}
        <motion.div 
          animate={{ height: isExpanded ? '50vh' : '0px', opacity: isExpanded ? 1 : 0 }}
          className="w-full relative bg-natural-900 overflow-hidden mt-0"
        >
          <div ref={containerRef} className="absolute inset-0 w-full h-full" />
        </motion.div>

        {/* Top Control Bar */}
        <div className={`flex items-center justify-between py-3 h-16`}>
           
           {/* Left Controls */}
           <div className="flex items-center gap-2">
              {onClose && (
                <button onClick={onClose} className="p-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition mr-2" title="إغلاق التفسير">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-natural-500 rounded-full hover:bg-natural-100 transition">
                {isExpanded ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
              <button onClick={toggleMute} className="p-2 text-natural-500 rounded-full hover:bg-natural-100 transition">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
           </div>

           {/* Title Info */}
           <div className="flex-1 text-center px-4 flex flex-col justify-center overflow-hidden">
             <h3 className={`font-sans font-bold truncate text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-natural-900'}`}>{title}</h3>
             {subtitle && <p className={`font-sans text-[11px] truncate mt-0.5 ${theme === 'dark' ? 'text-zinc-400' : 'text-natural-500'}`}>{subtitle}</p>}
           </div>

           {/* Play/Pause & Auto-Play Next */}
           <div className="flex items-center gap-2">
              {onToggleAutoPlayNext && (
                <button
                  type="button"
                  onClick={onToggleAutoPlayNext}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-semibold transition-all ${
                    autoPlayNext 
                      ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                      : 'bg-natural-100 text-natural-500 border border-natural-200 hover:text-natural-700'
                  }`}
                  title={autoPlayNext ? 'التشغيل والتمرير التلقائي مفعّل' : 'التشغيل والتمرير التلقائي معطّل'}
                >
                  <SkipForward className={`w-3.5 h-3.5 ${autoPlayNext ? 'text-amber-700' : ''}`} />
                  <span className="hidden sm:inline">التالي تلقائياً</span>
                </button>
              )}
              <button 
                onClick={togglePlay}
                disabled={!isReady}
                className="w-12 h-12 flex items-center justify-center bg-natural-900 text-white rounded-full hover:bg-natural-800 transition shadow-md disabled:opacity-50"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
              </button>
           </div>

        </div>
      </div>
    </div>
  );
}
