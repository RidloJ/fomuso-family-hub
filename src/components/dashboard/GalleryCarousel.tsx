import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const GalleryCarousel = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollX, setScrollX] = useState(0);

  const { data: photos = [] } = useQuery({
    queryKey: ["dashboard-gallery-carousel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("id, url, caption, album_id")
        .eq("media_type", "image")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      // Shuffle for a random mix
      const shuffled = (data ?? []).sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 12);
    },
    staleTime: 60_000,
  });

  // Auto-scroll effect
  useEffect(() => {
    if (photos.length < 3) return;
    const el = scrollRef.current;
    if (!el) return;
    const interval = setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 2) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 160, behavior: "smooth" });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [photos.length]);

  if (photos.length === 0) return null;

  return (
    <div className="mt-3 -mx-2">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 px-2 snap-x snap-mandatory"
      >
        {photos.map((photo, i) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex-shrink-0 w-28 h-20 sm:w-36 sm:h-24 rounded-xl overflow-hidden snap-start border border-border shadow-sm"
          >
            <img
              src={photo.url}
              alt={photo.caption || "Family photo"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default GalleryCarousel;
