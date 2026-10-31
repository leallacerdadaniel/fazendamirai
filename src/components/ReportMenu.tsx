import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, FileSpreadsheet, Globe, Download } from 'lucide-react';
import { exportPDF, exportExcel, exportHTML } from '@/lib/reportUtils';

interface ReportMenuProps {
  config: Parameters<typeof exportPDF>[0];
  disabled?: boolean;
}

export function ReportMenu({ config, disabled }: ReportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Download className="h-4 w-4 mr-2" /> Relatório
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportPDF(config)}>
          <FileText className="h-4 w-4 mr-2" /> PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportExcel(config)}>
          <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportHTML(config)}>
          <Globe className="h-4 w-4 mr-2" /> HTML
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
