import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isToday, isBefore } from "date-fns";
import { Plus, MapPin, Clock, ChevronLeft, ChevronRight, Check, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AppNav from "@/components/AppNav";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  created_by: string;
  created_at: string;
}

interface Rsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  profile_name?: string;
}

const rsvpOptions = [
  { status: "going", label: "Going! 🎉", icon: Check, color: "text-warm-green" },
  { status: "maybe", label: "Maybe 🤔", icon: HelpCircle, color: "text-warm-orange" },
  { status: "not_going", label: "Can't make it 😢", icon: X, color: "text-destructive" },
];

const Events = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [eventTime, setEventTime] = useState("12:00");

  const { data: dbEvents = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!user,
  });

  const { data: birthdayEvents = [] } = useQuery({
    queryKey: ["birthday-events", currentMonth.getFullYear()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("id, first_name, last_name, date_of_birth");
      if (error) throw error;
      const year = currentMonth.getFullYear();
      return (data || []).map((m: any) => {
        const dob = new Date(m.date_of_birth);
        const birthdayDate = new Date(year, dob.getMonth(), dob.getDate(), 0, 0, 0);
        return {
          id: `birthday-${m.id}-${year}`,
          title: `🎂 ${m.first_name} ${m.last_name}'s Birthday`,
          description: `Happy Birthday to ${m.first_name}! 🎈🎉`,
          event_date: birthdayDate.toISOString(),
          end_date: null,
          location: null,
          created_by: "system",
          created_at: new Date().toISOString(),
          _isBirthday: true,
        } as Event & { _isBirthday?: boolean };
      });
    },
    enabled: !!user,
  });

  const events = [...dbEvents, ...birthdayEvents].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );

  const { data: rsvps = [] } = useQuery({
    queryKey: ["rsvps", selectedEvent?.id],
    queryFn: async () => {
      if (!selectedEvent) return [];
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", selectedEvent.id);
      if (error) throw error;
      // Fetch profile names
      const userIds = [...new Set(data.map((r: any) => r.user_id))];
      if (userIds.length === 0) return data;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      const nameMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.full_name]));
      return data.map((r: any) => ({ ...r, profile_name: nameMap[r.user_id] || "Unknown" }));
    },
    enabled: !!selectedEvent,
  });

  const createEvent = useMutation({
    mutationFn: async () => {
      if (!eventDate) throw new Error("Pick a date");
      const [hours, minutes] = eventTime.split(":").map(Number);
      const fullDate = new Date(eventDate);
      fullDate.setHours(hours, minutes, 0, 0);

      const { error } = await supabase.from("events").insert({
        title,
        description: description || null,
        location: location || null,
        event_date: fullDate.toISOString(),
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setNewEventOpen(false);
      setTitle("");
      setDescription("");
      setLocation("");
      setEventDate(undefined);
      setEventTime("12:00");
      toast({ title: "Event created! 🎉" });
    },
    onError: (e: any) => toast({ title: "Oops! 😅", description: e.message, variant: "destructive" }),
  });

  const handleRsvp = useMutation({
    mutationFn: async (status: string) => {
      if (!selectedEvent) return;
      // Upsert: delete existing then insert
      await supabase.from("event_rsvps").delete().eq("event_id", selectedEvent.id).eq("user_id", user!.id);
      if (status !== "remove") {
        const { error } = await supabase.from("event_rsvps").insert({
          event_id: selectedEvent.id,
          user_id: user!.id,
          status,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rsvps", selectedEvent?.id] });
      toast({ title: "RSVP updated! ✅" });
    },
  });

  const myRsvp = rsvps.find((r: Rsvp) => r.user_id === user?.id);

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.event_date), day));

  const upcomingEvents = events.filter((e) => !isBefore(new Date(e.event_date), new Date()));

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">🎉 Events & Meetings</h1>
            <p className="text-muted-foreground font-display mt-1 text-sm sm:text-base">Never miss a family gathering! 📅</p>
          </div>
          <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="rounded-full font-display shadow-lg">
                  <Plus className="h-4 w-4 mr-2" /> New Event 🎊
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Create an Event 🗓️</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createEvent.mutate(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-display">Event Name ✏️</Label>
                  <Input className="rounded-xl" placeholder="e.g., Family BBQ 🍖" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label className="font-display">Date 📅</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full rounded-xl justify-start text-left font-normal", !eventDate && "text-muted-foreground")}>
                        {eventDate ? format(eventDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={eventDate} onSelect={setEventDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="font-display">Time ⏰</Label>
                  <Input type="time" className="rounded-xl" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="font-display">Location 📍 (optional)</Label>
                  <Input className="rounded-xl" placeholder="e.g., Grandma's house" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="font-display">Description 📝 (optional)</Label>
                  <Textarea className="rounded-xl" placeholder="What's the plan?" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <Button type="submit" className="w-full rounded-full font-display" disabled={createEvent.isPending}>
                  {createEvent.isPending ? "Creating... ⏳" : "Create Event! 🎉"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl border-2 border-border shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="font-display text-xl font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center text-xs font-display font-semibold text-muted-foreground py-2">{d}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {calDays.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => {
                        setSelectedDate(day);
                        if (dayEvents.length === 1) setSelectedEvent(dayEvents[0]);
                        else setSelectedEvent(null);
                      }}
                      className={cn(
                        "aspect-square rounded-xl p-1 text-sm font-display relative transition-colors flex flex-col items-center justify-start pt-2",
                        isCurrentMonth ? "text-foreground" : "text-muted-foreground/40",
                        isToday(day) && "bg-accent font-bold",
                        isSelected && "ring-2 ring-primary",
                        dayEvents.length > 0 && "hover:bg-accent/80",
                        "hover:bg-muted"
                      )}
                    >
                      <span>{format(day, "d")}</span>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                          {dayEvents.slice(0, 3).map((ev, i) => (
                            <div key={i} className={cn("w-1.5 h-1.5 rounded-full", (ev as any)._isBirthday ? "bg-pink-500" : "bg-primary")} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected date events */}
            {selectedDate && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <h3 className="font-display text-lg font-semibold mb-3">
                  {format(selectedDate, "EEEE, MMMM d")} {isToday(selectedDate) && "— Today! ✨"}
                </h3>
                {getEventsForDay(selectedDate).length === 0 ? (
                  <p className="text-muted-foreground font-display text-sm">No events this day 🌙</p>
                ) : (
                  <div className="space-y-2">
                    {getEventsForDay(selectedDate).map((event) => (
                      <motion.button
                        key={event.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setSelectedEvent(event)}
                        className={cn(
                          "w-full text-left bg-card rounded-xl border-2 p-4 transition-colors",
                          selectedEvent?.id === event.id ? "border-primary" : "border-border"
                        )}
                      >
                        <div className="font-display font-semibold">{event.title}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Clock className="h-3.5 w-3.5" />
                          {format(new Date(event.event_date), "h:mm a")}
                          {event.location && (
                            <>
                              <MapPin className="h-3.5 w-3.5 ml-2" />
                              {event.location}
                            </>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar: Upcoming & Event Detail */}
          <div className="space-y-6">
            {/* Event detail */}
            {selectedEvent ? (
              <motion.div
                key={selectedEvent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border-2 border-border shadow-md p-6"
              >
                <h3 className="font-display text-xl font-bold mb-2">{selectedEvent.title}</h3>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {format(new Date(selectedEvent.event_date), "PPP 'at' h:mm a")}
                  </div>
                  {selectedEvent.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {selectedEvent.location}
                    </div>
                  )}
                </div>
                {selectedEvent.description && (
                  <p className="text-sm text-muted-foreground mb-4">{selectedEvent.description}</p>
                )}

                {!(selectedEvent as any)._isBirthday && (
                  <>
                    {/* RSVP buttons */}
                    <div className="space-y-2 mb-4">
                      <Label className="font-display text-sm">Your RSVP:</Label>
                      <div className="flex gap-2 flex-wrap">
                        {rsvpOptions.map((opt) => (
                          <motion.div key={opt.status} whileTap={{ scale: 0.95 }}>
                            <Button
                              size="sm"
                              variant={myRsvp?.status === opt.status ? "default" : "outline"}
                              className="rounded-full font-display text-xs"
                              onClick={() => handleRsvp.mutate(opt.status)}
                            >
                              {opt.label}
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* RSVP list */}
                    <div>
                      <Label className="font-display text-sm">Who's coming:</Label>
                      {rsvps.length === 0 ? (
                        <p className="text-xs text-muted-foreground mt-1">No RSVPs yet — be the first! 🙋</p>
                      ) : (
                        <div className="mt-2 space-y-1">
                          {rsvps.map((r: Rsvp) => {
                            const opt = rsvpOptions.find((o) => o.status === r.status);
                            return (
                              <div key={r.id} className="flex items-center gap-2 text-sm">
                                <span className={cn("font-display font-semibold", opt?.color)}>
                                  {r.status === "going" ? "✅" : r.status === "maybe" ? "🤔" : "❌"}
                                </span>
                                <span className="font-display">{r.profile_name}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            ) : null}

            {/* Upcoming events */}
            <div className="bg-card rounded-2xl border-2 border-border shadow-md p-6">
              <h3 className="font-display text-lg font-bold mb-4">Upcoming Events 🗓️</h3>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading... ⏳</p>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-4">
                  <motion.div className="text-4xl mb-2" animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    📅
                  </motion.div>
                  <p className="text-sm text-muted-foreground font-display">No upcoming events yet!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 5).map((event) => (
                    <motion.button
                      key={event.id}
                      whileHover={{ x: 4 }}
                      onClick={() => {
                        setSelectedEvent(event);
                        setSelectedDate(new Date(event.event_date));
                      }}
                      className="w-full text-left"
                    >
                      <div className="font-display font-semibold text-sm">{event.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(event.event_date), "MMM d 'at' h:mm a")}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Events;
