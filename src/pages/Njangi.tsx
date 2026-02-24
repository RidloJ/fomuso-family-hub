import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { DollarSign, CheckCircle, AlertTriangle, Clock, Plus, FileText, Download, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AppNav from "@/components/AppNav";
import { useNjangiMembers, useNjangiPeriod, useNjangiPayments, useRecordPayment, useAllNjangiPeriods, useUpdatePayment, useDeletePayment } from "@/hooks/useNjangi";
import { getDeadlineLabel, getDaysToDeadline, statusConfig, MONTH_NAMES, PAYMENT_METHODS, getLastSunday, sortByBirthOrder } from "@/lib/njangi-utils";

const now = new Date();

const Njangi = () => {
  const { user, loading } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<any>(null);
  const { toast } = useToast();

  const { data: members = [] } = useNjangiMembers();
  const { data: period } = useNjangiPeriod(selectedMonth, selectedYear);
  const { data: payments = [] } = useNjangiPayments(period?.id);
  const { data: yearPeriods = [] } = useAllNjangiPeriods(selectedYear);
  const recordPayment = useRecordPayment();
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();

  if (loading || !user) return null;

  const deadlineLabel = getDeadlineLabel(selectedYear, selectedMonth);
  const daysLeft = getDaysToDeadline(selectedYear, selectedMonth);
  const expectedTotal = Number(period?.expected_total || 0);
  const totalRemitted = Number(period?.total_remitted || 0);
  const balanceLeft = Number(period?.balance_left || 0);
  const statusKey = (period?.status as keyof typeof statusConfig) || "not_started";
  const sc = statusConfig[statusKey];
  const progressPct = expectedTotal > 0 ? Math.min(100, (totalRemitted / expectedTotal) * 100) : 0;

  // Per-member breakdown
  const memberPaid = (memberId: string) =>
    payments.filter((p: any) => p.member_id === memberId).reduce((s: number, p: any) => s + Number(p.amount), 0);

  const showDeadlineAlert = daysLeft >= 0 && daysLeft <= 7 && balanceLeft > 0;
  const showPastAlert = daysLeft < 0 && balanceLeft > 0;

  const handleExportCSV = () => {
    if (payments.length === 0) return;
    const header = "Date,Member,Amount,Method,Note\n";
    const rows = payments.map((p: any) =>
      `${p.payment_date},${p.njangi_members?.full_name || ""},${p.amount},${p.payment_method},${(p.note || "").replace(/,/g, ";")}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `njangi-${MONTH_NAMES[selectedMonth - 1]}-${selectedYear}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">💰 Njangi</h1>
          <p className="text-muted-foreground font-display text-sm">Monthly family contributions (deadline: last Sunday of each month)</p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Select value={`${selectedMonth}`} onValueChange={(v) => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((m, i) => (
                  <SelectItem key={i} value={`${i + 1}`}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={`${selectedYear}`} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[selectedYear - 1, selectedYear, selectedYear + 1].map((y) => (
                  <SelectItem key={y} value={`${y}`}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="font-display text-xs">📅 Deadline: {deadlineLabel}</Badge>
          </div>
        </motion.div>

        {/* Alerts */}
        {showDeadlineAlert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 rounded-xl bg-accent/40 border border-border flex items-center gap-2 text-foreground text-sm font-display">
            <AlertTriangle className="h-4 w-4 text-primary" /> Deadline approaching — {daysLeft} day{daysLeft !== 1 ? "s" : ""} left to complete Njangi.
          </motion.div>
        )}
        {showPastAlert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-destructive text-sm font-display">
            <AlertTriangle className="h-4 w-4" /> Deadline passed — Njangi still pending for this month.
          </motion.div>
        )}

        {/* Progress Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="rounded-2xl border-2 mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" /> Month Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progressPct} className="h-3 mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground font-display">Expected</p>
                  <p className="text-xl font-bold font-display">{expectedTotal.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-display">Remitted</p>
                  <p className="text-xl font-bold font-display text-primary">{totalRemitted.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-display">Left</p>
                  <p className="text-xl font-bold font-display">{balanceLeft.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-display">Status</p>
                  <Badge className={`${sc.color} font-display`}>{sc.emoji} {sc.label}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="rounded-full font-display"><Plus className="h-4 w-4 mr-1" /> Record Payment</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <RecordPaymentForm
                      periodId={period?.id}
                      members={members}
                      recordPayment={recordPayment}
                      toast={toast}
                      onClose={() => setPaymentOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
                <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full font-display"><FileText className="h-4 w-4 mr-1" /> View Register</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <RegisterView payments={payments} />
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="sm" className="rounded-full font-display" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-1" /> Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Member Contribution Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="font-display text-lg font-bold mb-4">👨‍👩‍👧‍👦 Member Contributions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {sortByBirthOrder(members.filter((m: any) => m.active)).map((m: any) => {
              const paid = memberPaid(m.id);
              const expected = Number(m.expected_monthly_amount || 0);
              const memberBalance = Math.max(0, expected - paid);
              const indicator = paid <= 0 ? "🔴" : paid >= expected ? "🟢" : "🟡";
              const memberPayments = payments.filter((p: any) => p.member_id === m.id);
              return (
                <Card key={m.id} className="rounded-xl border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-display font-semibold">{indicator} {m.full_name}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-xs font-display"
                        onClick={() => setPaymentOpen(true)}
                      >
                        + Pay
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs font-display mb-2">
                      <div><p className="text-muted-foreground">Expected</p><p className="font-semibold">{expected.toLocaleString()} FCFA</p></div>
                      <div><p className="text-muted-foreground">Paid</p><p className="font-semibold text-primary">{paid.toLocaleString()} FCFA</p></div>
                      <div><p className="text-muted-foreground">Left</p><p className="font-semibold">{memberBalance.toLocaleString()} FCFA</p></div>
                    </div>
                    {memberPayments.length > 0 && (
                      <div className="border-t pt-2 mt-1 space-y-1">
                        {memberPayments.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between text-xs font-display">
                            <span className="text-muted-foreground">{p.payment_date} · {Number(p.amount).toLocaleString()} FCFA</span>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditPayment(p)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={async () => {
                                  if (!confirm("Delete this payment?")) return;
                                  try {
                                    await deletePayment.mutateAsync({ id: p.id, period_id: p.period_id });
                                    toast({ title: "🗑️ Payment deleted" });
                                  } catch (err: any) {
                                    toast({ title: "Error", description: err.message, variant: "destructive" });
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Edit Payment Dialog */}
        <Dialog open={!!editPayment} onOpenChange={(open) => !open && setEditPayment(null)}>
          <DialogContent>
            {editPayment && (
              <EditPaymentForm
                payment={editPayment}
                updatePayment={updatePayment}
                toast={toast}
                onClose={() => setEditPayment(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Annual Schedule */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="font-display text-lg font-bold mb-4">📆 Annual Contribution Schedule ({selectedYear})</h2>
          <Card className="rounded-2xl border-2 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-display">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3">Month</th>
                    <th className="text-left p-3">Deadline</th>
                    <th className="text-right p-3">Expected</th>
                    <th className="text-right p-3">Remitted</th>
                    <th className="text-right p-3">Left</th>
                    <th className="text-center p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MONTH_NAMES.map((name, i) => {
                    const mp = yearPeriods.find((p: any) => p.period_month === i + 1);
                    const deadline = format(getLastSunday(selectedYear, i + 1), "MMM d");
                    const sk = (mp?.status as keyof typeof statusConfig) || "not_started";
                    const scc = statusConfig[sk];
                    return (
                      <tr
                        key={i}
                        className={`border-b hover:bg-muted/20 cursor-pointer ${selectedMonth === i + 1 ? "bg-primary/5" : ""}`}
                        onClick={() => setSelectedMonth(i + 1)}
                      >
                        <td className="p-3 font-semibold">{name}</td>
                        <td className="p-3 text-muted-foreground">{deadline}</td>
                        <td className="p-3 text-right">{Number(mp?.expected_total || 0).toLocaleString()} FCFA</td>
                        <td className="p-3 text-right text-primary">{Number(mp?.total_remitted || 0).toLocaleString()} FCFA</td>
                        <td className="p-3 text-right">{Number(mp?.balance_left || 0).toLocaleString()} FCFA</td>
                        <td className="p-3 text-center"><Badge className={`${scc.color} text-xs`}>{scc.emoji} {scc.label}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

// Record Payment Form
const RecordPaymentForm = ({ periodId, members, recordPayment, toast, onClose }: any) => {
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [method, setMethod] = useState("cash");
  const [note, setNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodId || !memberId || !amount) return;
    try {
      await recordPayment.mutateAsync({
        period_id: periodId,
        member_id: memberId,
        amount: Number(amount),
        payment_date: paymentDate,
        payment_method: method,
        note: note || undefined,
      });
      toast({ title: "✅ Payment recorded!" });
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <>
      <DialogHeader><DialogTitle className="font-display">💵 Record Payment</DialogTitle></DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="font-display">Member</Label>
          <Select value={memberId} onValueChange={setMemberId}>
            <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
            <SelectContent>
              {sortByBirthOrder(members.filter((m: any) => m.active)).map((m: any) => (
                <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-display">Amount (FCFA)</Label>
          <Input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <Label className="font-display">Payment Date</Label>
          <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
        </div>
        <div>
          <Label className="font-display">Payment Method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((pm) => (
                <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-display">Note (optional)</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        </div>
        <Button type="submit" className="w-full rounded-full font-display" disabled={recordPayment.isPending}>
          {recordPayment.isPending ? "Saving..." : "Save Payment"}
        </Button>
      </form>
    </>
  );
};

// Register View
const RegisterView = ({ payments }: { payments: any[] }) => (
  <>
    <DialogHeader><DialogTitle className="font-display">📒 Payment Register</DialogTitle></DialogHeader>
    {payments.length === 0 ? (
      <p className="text-muted-foreground font-display text-sm py-4">No payments recorded yet.</p>
    ) : (
      <table className="w-full text-sm font-display">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Date</th>
            <th className="text-left p-2">Name</th>
            <th className="text-right p-2">Amount</th>
            <th className="text-left p-2">Method</th>
            <th className="text-left p-2">Note</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p: any) => (
            <tr key={p.id} className="border-b">
              <td className="p-2">{p.payment_date}</td>
              <td className="p-2">{p.njangi_members?.full_name}</td>
              <td className="p-2 text-right font-semibold">{Number(p.amount).toLocaleString()} FCFA</td>
              <td className="p-2 capitalize">{p.payment_method.replace("_", " ")}</td>
              <td className="p-2 text-muted-foreground">{p.note || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </>
);

// Edit Payment Form
const EditPaymentForm = ({ payment, updatePayment, toast, onClose }: any) => {
  const [amount, setAmount] = useState(String(payment.amount));
  const [paymentDate, setPaymentDate] = useState(payment.payment_date);
  const [method, setMethod] = useState(payment.payment_method);
  const [note, setNote] = useState(payment.note || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    try {
      await updatePayment.mutateAsync({
        id: payment.id,
        period_id: payment.period_id,
        amount: Number(amount),
        payment_date: paymentDate,
        payment_method: method,
        note: note || undefined,
      });
      toast({ title: "✅ Payment updated!" });
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <>
      <DialogHeader><DialogTitle className="font-display">✏️ Edit Payment</DialogTitle></DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="font-display">Amount (FCFA)</Label>
          <Input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <Label className="font-display">Payment Date</Label>
          <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
        </div>
        <div>
          <Label className="font-display">Payment Method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((pm) => (
                <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-display">Note (optional)</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        </div>
        <Button type="submit" className="w-full rounded-full font-display" disabled={updatePayment.isPending}>
          {updatePayment.isPending ? "Saving..." : "Update Payment"}
        </Button>
      </form>
    </>
  );
};

export default Njangi;
