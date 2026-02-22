import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Image, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AppNav from "@/components/AppNav";
import AlbumView from "@/components/gallery/AlbumView";

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  created_by: string;
  created_at: string;
  media_count?: number;
}

const Gallery = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [newAlbumOpen, setNewAlbumOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: albums = [], isLoading } = useQuery({
    queryKey: ["albums"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("albums")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get media counts
      const albumsWithCounts = await Promise.all(
        (data as Album[]).map(async (album) => {
          const { count } = await supabase
            .from("media")
            .select("*", { count: "exact", head: true })
            .eq("album_id", album.id);
          return { ...album, media_count: count ?? 0 };
        })
      );
      return albumsWithCounts;
    },
    enabled: !!user,
  });

  const createAlbum = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("albums").insert({
        title,
        description: description || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      setNewAlbumOpen(false);
      setTitle("");
      setDescription("");
      toast({ title: "Album created! 🎉" });
    },
    onError: (e: any) => toast({ title: "Oops! 😅", description: e.message, variant: "destructive" }),
  });

  if (authLoading || !user) return null;

  if (selectedAlbum) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <AlbumView album={selectedAlbum} user={user} onBack={() => setSelectedAlbum(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">📸 Family Gallery</h1>
            <p className="text-muted-foreground font-display mt-1">Our awesome family memories! ✨</p>
          </div>
          <Dialog open={newAlbumOpen} onOpenChange={setNewAlbumOpen}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="rounded-full font-display shadow-lg">
                  <Plus className="h-4 w-4 mr-2" /> New Album 🎊
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Create a New Album 📁</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createAlbum.mutate();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label className="font-display">Album Name ✏️</Label>
                  <Input
                    className="rounded-xl"
                    placeholder="e.g., Christmas 2025 🎄"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-display">Description (optional) 📝</Label>
                  <Textarea
                    className="rounded-xl"
                    placeholder="What's this album about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full rounded-full font-display" disabled={createAlbum.isPending}>
                  {createAlbum.isPending ? "Creating... ⏳" : "Create Album! 🎉"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-20 font-display text-lg text-muted-foreground">
            Loading albums... ⏳
          </div>
        ) : albums.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <motion.div
              className="text-6xl mb-4"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              📷
            </motion.div>
            <h2 className="font-display text-2xl font-bold mb-2">No albums yet!</h2>
            <p className="text-muted-foreground font-display">Create your first album to start sharing memories 🌟</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {albums.map((album, i) => (
                <motion.div
                  key={album.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, type: "spring", bounce: 0.3 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  onClick={() => setSelectedAlbum(album)}
                  className="bg-card rounded-2xl border-2 border-border shadow-md overflow-hidden cursor-pointer"
                >
                  <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                    {album.cover_url ? (
                      <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <FolderOpen className="h-12 w-12 mb-2" />
                        <span className="font-display text-sm">No cover yet</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-lg font-semibold">{album.title}</h3>
                    {album.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{album.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground font-display">
                      <Image className="h-4 w-4" />
                      <span>{album.media_count} items</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default Gallery;
