import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Image, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AppNav from "@/components/AppNav";
import AlbumView from "@/components/gallery/AlbumView";

const FAMILY_BRANCHES = ["Yvonne", "Solo", "Bankom", "Nah", "Nandet"] as const;

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  created_by: string;
  created_at: string;
  family_branch: string | null;
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
  const [familyBranch, setFamilyBranch] = useState("");

  const { data: albums = [], isLoading } = useQuery({
    queryKey: ["albums"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("albums")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

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
        family_branch: familyBranch || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      setNewAlbumOpen(false);
      setTitle("");
      setDescription("");
      setFamilyBranch("");
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

  // Group albums by family branch
  const albumsByFamily: Record<string, Album[]> = {};
  const unassigned: Album[] = [];
  for (const album of albums) {
    if (album.family_branch && FAMILY_BRANCHES.includes(album.family_branch as any)) {
      if (!albumsByFamily[album.family_branch]) albumsByFamily[album.family_branch] = [];
      albumsByFamily[album.family_branch].push(album);
    } else {
      unassigned.push(album);
    }
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
                  <Label className="font-display">Family 👨‍👩‍👧‍👦</Label>
                  <Select value={familyBranch} onValueChange={setFamilyBranch}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select a family branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {FAMILY_BRANCHES.map((name) => (
                        <SelectItem key={name} value={name}>{name}'s Family</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
          <div className="space-y-12">
            {FAMILY_BRANCHES.map((branch) => {
              const branchAlbums = albumsByFamily[branch] || [];
              return (
                <section key={branch}>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="font-display text-2xl font-bold">{branch}'s Family</h2>
                    <span className="text-sm text-muted-foreground font-display">
                      {branchAlbums.length} album{branchAlbums.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {branchAlbums.length === 0 ? (
                    <p className="text-muted-foreground font-display text-sm py-4 pl-1">
                      No albums yet for this family. Be the first to add one! 🌟
                    </p>
                  ) : (
                    <AlbumGrid albums={branchAlbums} onSelect={setSelectedAlbum} />
                  )}
                </section>
              );
            })}

            {unassigned.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-display text-2xl font-bold">General 📂</h2>
                  <span className="text-sm text-muted-foreground font-display">
                    {unassigned.length} album{unassigned.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <AlbumGrid albums={unassigned} onSelect={setSelectedAlbum} />
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const AlbumGrid = ({ albums, onSelect }: { albums: Album[]; onSelect: (a: Album) => void }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    <AnimatePresence>
      {albums.map((album, i) => (
        <motion.div
          key={album.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, type: "spring", bounce: 0.3 }}
          whileHover={{ y: -6, scale: 1.02 }}
          onClick={() => onSelect(album)}
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
);

export default Gallery;
