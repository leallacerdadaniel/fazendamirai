import * as React from "react";
import { cap } from "@/lib/labels";

import { cn } from "@/lib/utils";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

type TableProps = React.HTMLAttributes<HTMLTableElement> & { filterable?: boolean };

/** Tabela com filtro automático: busca por texto (em todas as colunas ou numa coluna) e filtro por valor. */
const Table = React.forwardRef<HTMLTableElement, TableProps>(({ className, filterable = true, ...props }, ref) => {
  const innerRef = React.useRef<HTMLTableElement | null>(null);
  const [query, setQuery] = React.useState("");
  const [col, setCol] = React.useState(-1);
  const [valor, setValor] = React.useState("");
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [valores, setValores] = React.useState<string[]>([]);
  const [stats, setStats] = React.useState({ total: 0, shown: 0 });

  const setRefs = (el: HTMLTableElement | null) => {
    innerRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) (ref as React.MutableRefObject<HTMLTableElement | null>).current = el;
  };

  React.useEffect(() => {
    const table = innerRef.current;
    if (!table || !filterable) return;
    const apply = () => {
      const hs = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent?.trim() || "");
      setHeaders((prev) => (prev.join("|") === hs.join("|") ? prev : hs));
      const rows = Array.from(table.querySelectorAll<HTMLTableRowElement>("tbody > tr")).filter(
        (tr) => !(tr.cells.length === 1 && tr.cells[0].colSpan > 1),
      );
      if (col >= 0) {
        const vs = Array.from(new Set(rows.map((r) => r.cells[col]?.textContent?.trim() || "").filter((v) => v && v !== "—")))
          .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
        setValores((prev) => (prev.join("|") === vs.join("|") ? prev : vs.length <= 40 ? vs : []));
      } else setValores((prev) => (prev.length ? [] : prev));
      const q = norm(query);
      let shown = 0;
      rows.forEach((tr) => {
        const alvo = col >= 0 ? tr.cells[col]?.textContent || "" : tr.textContent || "";
        const ok = (!q || norm(alvo).includes(q)) && (!valor || (tr.cells[col]?.textContent?.trim() || "") === valor);
        tr.style.display = ok ? "" : "none";
        if (ok) shown++;
      });
      setStats((p) => (p.total === rows.length && p.shown === shown ? p : { total: rows.length, shown }));
    };
    apply();
    const obs = new MutationObserver(apply);
    const tbody = table.querySelector("tbody");
    obs.observe(tbody || table, { childList: true, subtree: true, characterData: true });
    return () => obs.disconnect();
  }, [query, col, valor, filterable]);

  const ativo = query || valor || col >= 0;
  const showBar = filterable && (stats.total >= 3 || ativo);
  const ctl = "h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="w-full">
      {showBar && (
        <div className="flex flex-wrap items-center gap-2 pb-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={col >= 0 ? `Buscar em ${headers[col] || "coluna"}...` : "Buscar na tabela..."}
            aria-label="Buscar na tabela"
            className={cn(ctl, "min-w-[180px] flex-1 sm:max-w-xs")}
          />
          <select
            value={col}
            onChange={(e) => { setCol(Number(e.target.value)); setValor(""); }}
            aria-label="Filtrar por coluna"
            className={ctl}
          >
            <option value={-1}>Todas as colunas</option>
            {headers.map((h, i) => (h ? <option key={i} value={i}>{h}</option> : null))}
          </select>
          {col >= 0 && valores.length > 0 && (
            <select value={valor} onChange={(e) => setValor(e.target.value)} aria-label="Filtrar por valor" className={ctl}>
              <option value="">Qualquer valor</option>
              {valores.map((v) => <option key={v} value={v}>{cap(v)}</option>)}
            </select>
          )}
          {ativo && (
            <button type="button" className="h-9 px-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => { setQuery(""); setCol(-1); setValor(""); }}>
              Limpar
            </button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {stats.shown === stats.total ? `${stats.total} registros` : `${stats.shown} de ${stats.total}`}
          </span>
        </div>
      )}
      <div className="relative w-full overflow-auto">
        <table ref={setRefs} className={cn("w-full caption-bottom text-sm", className)} {...props} />
      </div>
    </div>
  );
});
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />,
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  ),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
  ),
);
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50", className)}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  ),
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  ),
);
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
