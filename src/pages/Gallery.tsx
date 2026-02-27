import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Image, FolderOpen, CalendarDays, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  preview_urls?: string[];
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
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);

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
          const { data: previews } = await supabase
            .from("media")
            .select("url")
            .eq("album_id", album.id)
            .order("created_at", { ascending: false })
            .limit(4);
          return { ...album, media_count: count ?? 0, preview_urls: (previews ?? []).map(p => p.url) };
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

  const deleteAlbum = useMutation({
    mutationFn: async (album: Album) => {
      if ((album.media_count ?? 0) > 0) {
        throw new Error("This album still has photos/videos. Please delete all media first before removing the album.");
      }
      const { error } = await supabase.from("albums").delete().eq("id", album.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      setAlbumToDelete(null);
      toast({ title: "Album deleted! 🗑️" });
    },
    onError: (e: any) => {
      setAlbumToDelete(null);
      toast({ title: "Can't delete 😅", description: e.message, variant: "destructive" });
    },
  });



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

  const branchEmojis: Record<string, string> = {
    Yvonne: "👩‍👧‍👦",
    Solo: "👨‍👧",
    Bankom: "👨‍👦‍👦",
    Nah: "👩‍👦",
    Nandet: "👶",
  };

  const branchColors: Record<string, string> = {
    Yvonne: "from-primary/15 to-primary/5",
    Solo: "from-accent/50 to-accent/20",
    Bankom: "from-secondary/50 to-secondary/20",
    Nah: "from-muted to-muted/40",
    Nandet: "from-primary/10 to-accent/30",
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">
              📸 Family Gallery
            </h1>
            <p className="text-muted-foreground font-display mt-1 text-sm sm:text-base">
              Relive our best moments together! ✨
            </p>
          </motion.div>
          <Dialog open={newAlbumOpen} onOpenChange={setNewAlbumOpen}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="rounded-full font-display shadow-lg gap-2">
                  <Plus className="h-4 w-4" /> New Album 🎊
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
          <div className="space-y-8">
            {FAMILY_BRANCHES.map((branch, bi) => {
              const branchAlbums = albumsByFamily[branch] || [];
              return (
                <motion.section
                  key={branch}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: bi * 0.08 }}
                  className={`rounded-2xl bg-gradient-to-br ${branchColors[branch]} border border-border p-5`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{branchEmojis[branch]}</span>
                      <h2 className="font-display text-xl sm:text-2xl font-bold">{branch}'s Family</h2>
                      <span className="bg-background/60 text-xs font-display font-semibold px-2 py-0.5 rounded-full text-muted-foreground">
                        {branchAlbums.length}
                      </span>
                    </div>
                    {branchAlbums.length > 3 && (
                      <Button variant="ghost" size="sm" className="rounded-full font-display text-xs text-primary" onClick={() => {}}>
                        See all →
                      </Button>
                    )}
                  </div>
                  {branchAlbums.length === 0 ? (
                    <p className="text-muted-foreground font-display text-sm py-6 text-center">
                      No albums yet — be the first to add one! 🌟
                    </p>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin snap-x snap-mandatory">
                      {branchAlbums.map((album, i) => (
                        <AlbumSnippet key={album.id} album={album} index={i} onSelect={setSelectedAlbum} onDelete={setAlbumToDelete} />
                      ))}
                    </div>
                  )}
                </motion.section>
              );
            })}

            {unassigned.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-2xl bg-gradient-to-br from-muted/60 to-muted/20 border border-border p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📂</span>
                  <h2 className="font-display text-xl sm:text-2xl font-bold">General</h2>
                  <span className="bg-background/60 text-xs font-display font-semibold px-2 py-0.5 rounded-full text-muted-foreground">
                    {unassigned.length}
                  </span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin snap-x snap-mandatory">
                  {unassigned.map((album, i) => (
                    <AlbumSnippet key={album.id} album={album} index={i} onSelect={setSelectedAlbum} onDelete={setAlbumToDelete} />
                  ))}
                </div>
              </motion.section>
            )}
          </div>
        )}
      </main>

      {/* Delete album confirmation */}
      <AlertDialog open={!!albumToDelete} onOpenChange={(open) => !open && setAlbumToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete "{albumToDelete?.title}"? 🗑️</AlertDialogTitle>
            <AlertDialogDescription className="font-display">
              {(albumToDelete?.media_count ?? 0) > 0
                ? `This album still has ${albumToDelete?.media_count} item(s). Please delete all photos and videos inside it first before removing the album.`
                : "This action cannot be undone. The album will be permanently removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full font-display">Cancel</AlertDialogCancel>
            {(albumToDelete?.media_count ?? 0) === 0 && (
              <AlertDialogAction
                className="rounded-full font-display bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => albumToDelete && deleteAlbum.mutate(albumToDelete)}
              >
                Delete Album
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const AlbumSnippet = ({ album, index, onSelect, onDelete }: { album: Album; index: number; onSelect: (a: Album) => void; onDelete: (a: Album) => void }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.06, type: "spring", bounce: 0.25 }}
    whileHover={{ y: -4, scale: 1.03 }}
    onClick={() => onSelect(album)}
    className="flex-shrink-0 w-44 sm:w-52 snap-start bg-card rounded-2xl border-2 border-border shadow-md overflow-hidden cursor-pointer relative group"
  >
    {/* Delete button */}
    <button
      onClick={(e) => { e.stopPropagation(); onDelete(album); }}
      className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-destructive hover:text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
      {(album.preview_urls?.length ?? 0) >= 2 ? (
        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-px bg-border">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-muted overflow-hidden">
              {album.preview_urls?.[i] ? (
                <img src={album.preview_urls[i]} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-muted/80" />
              )}
            </div>
          ))}
        </div>
      ) : album.cover_url || (album.preview_urls?.length === 1) ? (
        <img src={album.preview_urls?.[0] || album.cover_url!} alt={album.title} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
          <FolderOpen className="h-8 w-8 mb-1" />
          <span className="font-display text-[10px]">No photos</span>
        </div>
      )}
      <span className="absolute bottom-1.5 right-1.5 bg-background/80 backdrop-blur-sm text-[10px] font-display font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
        <Image className="h-3 w-3" /> {album.media_count}
      </span>
    </div>
    <div className="p-2.5">
      <h3 className="font-display text-sm font-semibold truncate">{album.title}</h3>
      <p className="text-[10px] text-muted-foreground font-display mt-0.5">
        {format(new Date(album.created_at), "MMM d, yyyy")}
      </p>
    </div>
  </motion.div>
);

export default Gallery;
