import { useState, useRef } from "react";
import { Play, Pause, Maximize, Volume2, VolumeX } from "lucide-react";

const Video = ({ url, name = "Video Message" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef(null);
  const timerRef = useRef(null);

  // Auto-hide controls after 3 seconds of inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const togglePlay = () => {
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const currentProgress =
      (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(currentProgress);
  };

  const toggleMute = () => {
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div
      className="relative w-full mx-auto overflow-hidden rounded-2xl bg-black shadow-2xl group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={url}
        className="w-full h-auto cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        playsInline
      />

      {/* Big Center Play Button (Only shows when paused) */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity"
          onClick={togglePlay}
        >
          <div className="p-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl hover:scale-110 transition-transform">
            <Play size={48} fill="currentColor" />
          </div>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/80 to-transparent transition-opacity duration-500 ${showControls ? "opacity-100" : "opacity-0"}`}
      >
        {/* Progress Bar */}
        <div className="relative w-full h-1.5 bg-white/20 rounded-full mb-4 group/progress cursor-pointer">
          <div
            className="absolute top-0 left-0 h-full bg-[#34A853] rounded-full shadow-[0_0_10px_#34A853] transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="hover:text-[#34A853] transition-colors"
            >
              {isPlaying ? (
                <Pause size={24} fill="currentColor" />
              ) : (
                <Play size={24} fill="currentColor" />
              )}
            </button>

            <button
              onClick={toggleMute}
              className="hover:text-[#34A853] transition-colors"
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>

            <span className="text-sm font-medium hidden sm:block">{name}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleFullscreen}
              className="hover:text-[#34A853] transition-colors"
            >
              <Maximize size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Video;
