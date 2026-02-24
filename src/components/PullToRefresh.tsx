import { useState, useRef, useCallback, type ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

const THRESHOLD = 80;

const PullToRefresh = ({ onRefresh, children }: PullToRefreshProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, THRESHOLD], [0, 1]);
  const rotate = useTransform(y, [0, THRESHOLD], [0, 360]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    const container = containerRef.current;
    // Only activate when scrolled to top
    if (container && container.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, [refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshing) return;
    const delta = Math.max(0, e.touches[0].clientY - startY.current);
    // Apply resistance
    const dampened = Math.min(delta * 0.5, THRESHOLD * 1.5);
    y.set(dampened);
  }, [refreshing, y]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (y.get() >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      animate(y, THRESHOLD * 0.6, { duration: 0.2 });
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        animate(y, 0, { duration: 0.3 });
      }
    } else {
      animate(y, 0, { duration: 0.3 });
    }
  }, [onRefresh, refreshing, y]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto"
      style={{ WebkitOverflowScrolling: "touch" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        className="flex items-center justify-center pointer-events-none"
        style={{ height: y, opacity }}
      >
        <motion.div style={{ rotate }}>
          <RefreshCw className={`h-5 w-5 text-primary ${refreshing ? "animate-spin" : ""}`} />
        </motion.div>
      </motion.div>
      {children}
    </div>
  );
};

export default PullToRefresh;
