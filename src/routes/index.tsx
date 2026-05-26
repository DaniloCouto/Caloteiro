import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Check,
  Repeat,
  Calendar as CalendarIcon,
  Trash2,
  ArrowUpDown,
  ClipboardCopyIcon,
} from "lucide-react";
import { useDebts, type Debt, type Recurrence } from "@/hooks/use-debts";
import { formatCurrency, formatDate, formatPhoneNumber, getDueStatus } from "@/lib/format";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Devendo — Controle de dívidas a receber" },
      {
        name: "description",
        content:
          "Rastreador de dívidas offline. Adicione quem te deve, marque como pago e gerencie dívidas recorrentes — tudo salvo no seu dispositivo.",
      },
      { name: "theme-color", content: "#10b981" },
      { property: "og:title", content: "Devendo — Controle de dívidas a receber" },
      {
        property: "og:description",
        content: "Acompanhe valores que te devem. Funciona offline e pode ser instalado como app.",
      },
    ],
    links: [
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
    ],
  }),
  component: Index,
});

type Tab = "debit" | "paid";
type SortKey = "due-asc" | "due-desc" | "amount-desc" | "amount-asc";
type RecurringFilter = "all" | "recurring" | "onetime";

function Index() {
  const { debts, addDebt, markPaid, removeDebt } = useDebts();
  const [tab, setTab] = useState<Tab>("debit");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("due-asc");
  const [recFilter, setRecFilter] = useState<RecurringFilter>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [confirmPay, setConfirmPay] = useState<Debt | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Debt | null>(null);

  const filtered = useMemo(() => {
    const list = debts.filter((d) => (tab === "debit" ? d.status === "active" : d.status === "paid"));
    const q = search.trim().toLowerCase();
    const searched = q ? list.filter((d) => d.name.toLowerCase().includes(q)) : list;
    const recd = searched.filter((d) => {
      if (recFilter === "recurring") return d.recurrence !== "none";
      if (recFilter === "onetime") return d.recurrence === "none";
      return true;
    });
    const sorted = [...recd].sort((a, b) => {
      if (tab === "paid") {
        return (b.paidAt ?? "").localeCompare(a.paidAt ?? "");
      }
      switch (sort) {
        case "due-asc":
          return a.dueDate.localeCompare(b.dueDate);
        case "due-desc":
          return b.dueDate.localeCompare(a.dueDate);
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
      }
    });
    return sorted;
  }, [debts, tab, search, sort, recFilter]);

  const activeTotal = useMemo(
    () => debts.filter((d) => {
      const inputDate = new Date(d.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      inputDate.setHours(0, 0, 0, 0);
      return d.status === "active" && inputDate < today
    }).reduce((s, d) => s + d.amount, 0),
    [debts],
  );

  return (
    <div className="min-h-dvh bg-background text-foreground pb-32">
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-2xl px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{t.appTitle}</h1>
              <p className="text-sm text-muted-foreground">
                {tab === "debit" ? `${formatCurrency(activeTotal)} ${t.outstanding}` : t.settled}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
            <TabButton active={tab === "debit"} onClick={() => setTab("debit")}>
              {t.tabDebit}
            </TabButton>
            <TabButton active={tab === "paid"} onClick={() => setTab("paid")}>
              {t.tabPaid}
            </TabButton>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-full bg-background"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full shrink-0">
                  <ArrowUpDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {tab === "debit" && (
                  <>
                    <DropdownMenuLabel>{t.sort}</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={sort}
                      onValueChange={(v) => setSort(v as SortKey)}
                    >
                      <DropdownMenuRadioItem value="due-asc">{t.sortDueAsc}</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="due-desc">{t.sortDueDesc}</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="amount-desc">
                        {t.sortAmountDesc}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="amount-asc">
                        {t.sortAmountAsc}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuLabel>{t.filter}</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={recFilter}
                  onValueChange={(v) => setRecFilter(v as RecurringFilter)}
                >
                  <DropdownMenuRadioItem value="all">{t.filterAll}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="recurring">{t.filterRecurring}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="onetime">{t.filterOnetime}</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">
        {filtered.length === 0 ? (
          <EmptyState tab={tab} onAdd={() => setAddOpen(true)} />
        ) : (
          <ul className="space-y-2.5">
            {filtered.map((d) => (
              <DebtItem
                key={d.id}
                debt={d}
                onPay={() => setConfirmPay(d)}
                onDelete={() => setConfirmDelete(d)}
              />
            ))}
          </ul>
        )}
      </main>

      <button
        onClick={() => setAddOpen(true)}
        aria-label={t.addDebt}
        className="fixed right-5 z-30 bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 active:scale-95 transition"
      >
        <Plus className="size-6" />
      </button>

      <AddDebtDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={(d) => {
          addDebt(d);
          setAddOpen(false);
        }}
      />

      <AlertDialog open={!!confirmPay} onOpenChange={(o) => !o && setConfirmPay(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.markPaidTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.markPaidDesc(confirmPay?.name ?? "")}
              {confirmPay?.recurrence && confirmPay.recurrence !== "none" && (
                <span className="block mt-2 text-xs">
                  {t.recurringNotice(t.recurrenceLabel[confirmPay.recurrence])}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmPay) markPaid(confirmPay.id);
                setConfirmPay(null);
              }}
            >
              {t.markPaid}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteDesc(
                confirmDelete?.name ?? "",
                confirmDelete ? formatCurrency(confirmDelete.amount) : "",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) removeDebt(confirmDelete.id);
                setConfirmDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-9 rounded-full text-sm font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function DebtItem({
  debt,
  onPay,
  onDelete,
}: {
  debt: Debt;
  onPay: () => void;
  onDelete: () => void;
}) {
  const due = getDueStatus(debt.dueDate);
  const isPaid = debt.status === "paid";

  const dueStyles =
    isPaid
      ? "text-muted-foreground"
      : due === "overdue"
        ? "text-destructive"
        : due === "today"
          ? "text-warning-foreground"
          : "text-muted-foreground";

  async function copyNumber(phone: string) {
    await navigator.clipboard.writeText(phone.replace(/\D/g, ''));
    alert(t.contactCopy)
  }

  return (
    <li
      className={cn(
        "group rounded-2xl border border-border bg-card p-4 flex items-center gap-3",
        !isPaid && due === "overdue" && "border-destructive/40 bg-destructive/5",
        !isPaid && due === "today" && "border-warning/40 bg-warning/10",
      )}
    >
      <div className="flex-1 min-w-0" onClick={() => copyNumber(debt.contact)}>
        <div className="flex items-center gap-2">
          <p className="font-medium">{debt.name}</p>
          
        </div>
        {debt.recurrence !== "none" && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent text-accent-foreground py-0.5 text-[10px] font-medium capitalize">
                <Repeat className="size-3" />
                {t.recurrenceLabel[debt.recurrence]}
              </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <p className="font-semibold tabular-nums">{formatCurrency(debt.amount)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent text-accent-foreground py-0.5 text-[12px] font-medium capitalize">
            <ClipboardCopyIcon className="size-3.5" />
            {debt.contact}
          </span>
        </div>
        <div className={cn("mt-1 flex items-center gap-1.5 text-xs", dueStyles)}>
          <CalendarIcon className="size-3.5" />
          {isPaid ? (
            <span>{t.paidOn} {debt.paidAt ? formatDate(debt.paidAt) : ""}</span>
          ) : (
            <span>
              {due === "overdue"
                ? `${t.overdue} · `
                : due === "today"
                  ? `${t.dueToday} · `
                  : `${t.due} `}
              {formatDate(debt.dueDate)}
            </span>
          )}
        </div>
      </div>
      {isPaid ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label={t.delete}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 />
        </Button>
      ) : (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label={t.delete}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
          <Button
            size="icon"
            onClick={onPay}
            aria-label={t.markPaid}
            className="rounded-full size-10 shrink-0"
          >
            <Check />
          </Button>
        </div>
      )}
    </li>
  );
}

function EmptyState({ tab, onAdd }: { tab: Tab; onAdd: () => void }) {
  return (
    <div className="text-center py-20 px-6">
      <div className="mx-auto size-14 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center mb-4">
        {tab === "debit" ? <Plus /> : <Check />}
      </div>
      <h2 className="font-semibold text-lg">
        {tab === "debit" ? t.emptyDebitTitle : t.emptyPaidTitle}
      </h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        {tab === "debit" ? t.emptyDebitDesc : t.emptyPaidDesc}
      </p>
      {tab === "debit" && (
        <Button onClick={onAdd} className="mt-5 rounded-full">
          <Plus /> {t.addDebt}
        </Button>
      )}
    </div>
  );
}

function AddDebtDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (d: { name: string;  contact: string; amount: number; dueDate: string; recurrence: Recurrence }) => void;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [recurrence, setRecurrence] = useState<Recurrence>("none");

  function formatContact(value: string){
    setContact(formatPhoneNumber(value))
  }

  function reset() {
    setName("");
    setContact("");
    setAmount("");
    setDueDate(new Date().toISOString().slice(0, 10));
    setRecurrence("none");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!name.trim() || !Number.isFinite(n) || n <= 0 || !dueDate) return;
    onSubmit({ name: name.trim(), contact: contact.trim(), amount: n, dueDate, recurrence });
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.addDebt}</DialogTitle>
          <DialogDescription>{t.addDebtDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t.personName}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.personPlaceholder}
              autoFocus
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">{t.contactName}</Label>
            <Input
              id="contact"
              type="tel"
              value={contact}
              onChange={(e) => formatContact(e.target.value)}
              placeholder={t.contactNamePlaceholder}
              autoFocus
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">{t.amount}</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due">{t.dueDate}</Label>
              <Input
                id="due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t.recurring}</Label>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as Recurrence)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t.recurrenceNone}</SelectItem>
                <SelectItem value="weekly">{t.recurrenceWeekly}</SelectItem>
                <SelectItem value="monthly">{t.recurrenceMonthly}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit">{t.addDebt}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
