import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Play, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MediaItem {
  url: string;
  type: "image" | "video";
}

interface MediaLightboxProps {
  media: MediaItem[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

const MediaLightbox = ({ media, initialIndex = 0, isOpen, onClose }: MediaLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    resetZoom();
  }, [initialIndex]);

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case "Escape":
        onClose();
        break;
      case "ArrowLeft":
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
        resetZoom();
        break;
      case "ArrowRight":
        setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
        resetZoom();
        break;
      case "+":
      case "=":
        setScale(prev => Math.min(prev + 0.5, 4));
        break;
      case "-":
        setScale(prev => Math.max(prev - 0.5, 1));
        break;
      case "0":
        resetZoom();
        break;
    }
  }, [isOpen, media.length, onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
    resetZoom();
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
    resetZoom();
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale(prev => Math.min(prev + 0.2, 4));
    } else {
      setScale(prev => {
        const newScale = Math.max(prev - 0.2, 1);
        if (newScale === 1) {
          setPosition({ x: 0, y: 0 });
        }
        return newScale;
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX - position.x, 
        y: e.touches[0].clientY - position.y 
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && scale > 1 && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (scale === 1) {
      setScale(2);
    } else {
      resetZoom();
    }
  };

  const currentMedia = media[currentIndex];

  if (!isOpen || !currentMedia) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Fermer"
        >
          <X size={24} />
        </button>

        {/* Counter */}
        <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm">
          {currentIndex + 1} / {media.length}
        </div>

        {/* Zoom controls */}
        {currentMedia.type === "image" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/10 rounded-full px-2 py-1">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="p-2 rounded-full hover:bg-white/20 text-white transition-colors disabled:opacity-50"
              aria-label="Zoom arrière"
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-white text-sm min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 4}
              className="p-2 rounded-full hover:bg-white/20 text-white transition-colors disabled:opacity-50"
              aria-label="Zoom avant"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={resetZoom}
              disabled={scale === 1}
              className="p-2 rounded-full hover:bg-white/20 text-white transition-colors disabled:opacity-50"
              aria-label="Réinitialiser"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        )}

        {/* Navigation buttons */}
        {media.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-4 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Précédent"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Suivant"
            >
              <ChevronRight size={28} />
            </button>
          </>
        )}

        {/* Media content */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="max-w-[90vw] max-h-[85vh] flex items-center justify-center overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {currentMedia.type === "video" ? (
            <video
              src={currentMedia.url}
              className="max-w-full max-h-[85vh] rounded-lg"
              controls
              autoPlay
              playsInline
            />
          ) : (
            <div
              ref={imageRef}
              className={`overflow-hidden ${scale > 1 ? 'cursor-grab' : 'cursor-zoom-in'} ${isDragging ? 'cursor-grabbing' : ''}`}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleClick}
            >
              <img
                src={currentMedia.url}
                alt={`Image ${currentIndex + 1}`}
                className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg select-none"
                style={{
                  transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                }}
                draggable={false}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            </div>
          )}
        </motion.div>

        {/* Zoom hint */}
        {currentMedia.type === "image" && scale === 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            Double-cliquez pour zoomer • Molette pour ajuster
          </div>
        )}

        {/* Thumbnails */}
        {media.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto p-2 rounded-lg bg-black/50">
            {media.map((item, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); resetZoom(); }}
                className={`relative flex-shrink-0 w-16 h-12 rounded overflow-hidden transition-all ${
                  idx === currentIndex 
                    ? "ring-2 ring-white scale-105" 
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                {item.type === "video" ? (
                  <>
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play size={16} className="text-white" />
                    </div>
                  </>
                ) : (
                  <img
                    src={item.url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default MediaLightbox;
