import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Heart, MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { User } from "@supabase/supabase-js";

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  created_by: string;
  created_at: string;
}

interface MediaItem {
  id: string;
  album_id: string;
  url: string;
  caption: string | null;
  media_type: string;
  uploaded_by: string;
  created_at: string;
}

interface Props {
  album: Album;
  user: User;
  onBack: () => void;
}

const AlbumView = ({ album, user, onBack }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [comment, setComment] = useState("");

  // Caption dialog state
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [captionDialogOpen, setCaptionDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);

  const { data: mediaItems = [], isLoading } = useQuery({
    queryKey: ["media", album.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .eq("album_id", album.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MediaItem[];
    },
  });

  const { data: likes = [] } = useQuery({
    queryKey: ["likes", selectedMedia?.id],
    queryFn: async () => {
      if (!selectedMedia) return [];
      const { data, error } = await supabase
        .from("media_likes")
        .select("*")
        .eq("media_id", selectedMedia.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedMedia,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", selectedMedia?.id],
    queryFn: async () => {
      if (!selectedMedia) return [];
      const { data, error } = await supabase
        .from("media_comments")
        .select("*")
        .eq("media_id", selectedMedia.id)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const userIds = [...new Set(data.map((c: any) => c.user_id))];
      if (userIds.length === 0) return data;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      const nameMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.full_name]));
      return data.map((c: any) => ({ ...c, author_name: nameMap[c.user_id] || "Unknown" }));
    },
    enabled: !!selectedMedia,
  });

  const isLiked = likes.some((l: any) => l.user_id === user.id);

  // When files are selected, open caption dialog
  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files);
    setPendingFiles(fileArr);
    setCaptions(fileArr.map(() => ""));
    setCaptionDialogOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadWithCaptions = async () => {
    setCaptionDialogOpen(false);
    setUploading(true);

    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];
      const caption = captions[i]?.trim() || null;
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${album.id}/${Date.now()}-${i}.${ext}`;
      const mediaType = file.type.startsWith("video") ? "video" : "image";

      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(filePath, file);

      if (uploadError) {
        toast({ title: "Upload failed 😅", description: uploadError.message, variant: "destructive" });
        continue;
      }

      const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("media").insert({
        album_id: album.id,
        url: urlData.publicUrl,
        media_type: mediaType,
        uploaded_by: user.id,
        caption,
      });

      if (insertError) {
        toast({ title: "Save failed 😅", description: insertError.message, variant: "destructive" });
      }
    }

    if (!album.cover_url && mediaItems.length === 0) {
      const { data: firstMedia } = await supabase
        .from("media")
        .select("url")
        .eq("album_id", album.id)
        .limit(1)
        .single();
      if (firstMedia) {
        await supabase.from("albums").update({ cover_url: firstMedia.url }).eq("id", album.id);
      }
    }

    setUploading(false);
    setPendingFiles([]);
    setCaptions([]);
    queryClient.invalidateQueries({ queryKey: ["media", album.id] });
    queryClient.invalidateQueries({ queryKey: ["albums"] });
    toast({ title: "Uploaded! 🎉" });
  };

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!selectedMedia) return;
      if (isLiked) {
        await supabase.from("media_likes").delete().eq("media_id", selectedMedia.id).eq("user_id", user.id);
      } else {
        await supabase.from("media_likes").insert({ media_id: selectedMedia.id, user_id: user.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["likes", selectedMedia?.id] }),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!selectedMedia || !comment.trim()) return;
      const { error } = await supabase.from("media_comments").insert({
        media_id: selectedMedia.id,
        user_id: user.id,
        content: comment.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", selectedMedia?.id] });
      setComment("");
    },
  });

  const deleteMedia = useMutation({
    mutationFn: async (mediaId: string) => {
      const { error } = await supabase.from("media").delete().eq("id", mediaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media", album.id] });
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      setSelectedMedia(null);
      toast({ title: "Deleted! 🗑️" });
    },
  });

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="rounded-full font-display self-start">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold truncate">{album.title}</h1>
          {album.description && <p className="text-muted-foreground font-display mt-1">{album.description}</p>}
          <p className="text-xs text-muted-foreground font-display mt-1">
            Created {format(new Date(album.created_at), "MMM d, yyyy")}
          </p>
        </div>
        <div className="self-start sm:self-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={onFilesSelected}
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              className="rounded-full font-display shadow-lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading... ⏳" : <><Upload className="h-4 w-4 mr-2" /> Upload 📸</>}
            </Button>
          </motion.div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 font-display text-muted-foreground">Loading... ⏳</div>
      ) : mediaItems.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <motion.div className="text-6xl mb-4" animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            📷
          </motion.div>
          <h2 className="font-display text-2xl font-bold mb-2">This album is empty!</h2>
          <p className="text-muted-foreground font-display">Upload some photos or videos to get started! 🌟</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatePresence>
            {mediaItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.03 }}
                onClick={() => setSelectedMedia(item)}
                className="rounded-2xl overflow-hidden cursor-pointer border-2 border-border shadow-sm bg-muted"
              >
                <div className="aspect-square">
                  {item.media_type === "video" ? (
                    <video src={item.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={item.url} alt={item.caption || "Family photo"} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-display font-semibold text-foreground truncate">
                    {item.caption || "Untitled"}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-display">
                    {format(new Date(item.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Caption dialog for uploads */}
      <Dialog open={captionDialogOpen} onOpenChange={setCaptionDialogOpen}>
        <DialogContent className="rounded-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Label Your Photos ✏️</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {pendingFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden shrink-0">
                  {file.type.startsWith("image") ? (
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                  )}
                </div>
                <div className="flex-1">
                  <Label className="font-display text-xs text-muted-foreground">{file.name}</Label>
                  <Input
                    className="rounded-xl mt-1"
                    placeholder="Add a label for this photo..."
                    value={captions[i]}
                    onChange={(e) => {
                      const updated = [...captions];
                      updated[i] = e.target.value;
                      setCaptions(updated);
                    }}
                    required
                  />
                </div>
              </div>
            ))}
            <Button
              onClick={handleUploadWithCaptions}
              className="w-full rounded-full font-display"
              disabled={captions.some((c) => !c.trim())}
            >
              Upload {pendingFiles.length} file{pendingFiles.length !== 1 ? "s" : ""} 🚀
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media detail dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
        <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden">
          {selectedMedia && (
            <div className="flex flex-col md:flex-row max-h-[85vh]">
              <div className="flex-1 bg-muted flex items-center justify-center min-h-[300px]">
                {selectedMedia.media_type === "video" ? (
                  <video src={selectedMedia.url} controls className="max-w-full max-h-[60vh]" />
                ) : (
                  <img src={selectedMedia.url} alt={selectedMedia.caption || "Photo"} className="max-w-full max-h-[60vh] object-contain" />
                )}
              </div>
              <div className="w-full md:w-72 p-4 flex flex-col gap-4 border-l border-border overflow-y-auto">
                {/* Caption & date */}
                <div>
                  <p className="font-display font-semibold text-foreground">{selectedMedia.caption || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground font-display">
                    Uploaded {format(new Date(selectedMedia.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleLike.mutate()} className="flex items-center gap-1">
                    <Heart className={`h-6 w-6 transition-colors ${isLiked ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                    <span className="font-display text-sm">{likes.length}</span>
                  </motion.button>
                  <MessageCircle className="h-5 w-5 text-muted-foreground ml-2" />
                  <span className="font-display text-sm text-muted-foreground">{comments.length}</span>
                  {selectedMedia.uploaded_by === user.id && (
                    <Button variant="ghost" size="icon" className="ml-auto rounded-full" onClick={() => setMediaToDelete(selectedMedia.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="flex-1 space-y-3 min-h-0 overflow-y-auto">
                  {comments.map((c: any) => (
                    <div key={c.id} className="text-sm">
                      <span className="font-display font-semibold">{c.author_name || "Unknown"} </span>
                      <span className="text-muted-foreground">{c.content}</span>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-sm text-muted-foreground font-display">No comments yet! Be the first 💬</p>
                  )}
                </div>

                <form onSubmit={(e) => { e.preventDefault(); addComment.mutate(); }} className="flex gap-2">
                  <Input className="rounded-xl flex-1" placeholder="Say something nice! 😊" value={comment} onChange={(e) => setComment(e.target.value)} />
                  <Button type="submit" size="sm" className="rounded-full" disabled={!comment.trim()}>💬</Button>
                </form>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete photo confirmation */}
      <AlertDialog open={!!mediaToDelete} onOpenChange={(open) => !open && setMediaToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete this photo? 🗑️</AlertDialogTitle>
            <AlertDialogDescription className="font-display">
              This action cannot be undone. The photo will be permanently removed from the album.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full font-display">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full font-display bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (mediaToDelete) deleteMedia.mutate(mediaToDelete); setMediaToDelete(null); }}
            >
              Delete Photo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default AlbumView;
