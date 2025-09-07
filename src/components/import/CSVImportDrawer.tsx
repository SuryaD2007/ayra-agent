import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, FileSpreadsheet, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CSVImportDrawerProps {
  onClose: () => void;
  preselectedSpace: string;
}

interface CSVData {
  headers: string[];
  rows: string[][];
}

interface ColumnMapping {
  title: string;
  type: string;
  tags: string;
}

export const CSVImportDrawer = ({ onClose, preselectedSpace }: CSVImportDrawerProps) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [delimiter, setDelimiter] = useState(',');
  const [hasHeader, setHasHeader] = useState(true);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({ title: '', type: '', tags: '' });
  const [space, setSpace] = useState(preselectedSpace);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCSV(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const parseCSV = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const rows = lines.map(line => line.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, '')));
        
        let headers: string[] = [];
        let dataRows: string[][] = [];

        if (hasHeader && rows.length > 0) {
          headers = rows[0];
          dataRows = rows.slice(1, 51); // Preview first 50 rows
        } else {
          headers = rows[0]?.map((_, index) => `Column ${index + 1}`) || [];
          dataRows = rows.slice(0, 50);
        }

        setCsvData({ headers, rows: dataRows });
        setShowPreview(true);
      } catch (error) {
        toast({
          title: "Parse error",
          description: "Failed to parse CSV file",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvData || !columnMapping.title) {
      toast({
        title: "Mapping required",
        description: "Please map the title column",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const titleIndex = csvData.headers.indexOf(columnMapping.title);
      const typeIndex = columnMapping.type ? csvData.headers.indexOf(columnMapping.type) : -1;
      const tagsIndex = columnMapping.tags ? csvData.headers.indexOf(columnMapping.tags) : -1;

      const items = csvData.rows
        .filter(row => row[titleIndex]?.trim()) // Skip rows without title
        .map(row => ({
          title: row[titleIndex]?.trim() || 'Untitled',
          content: row.join(' | '), // Join all columns as content
          type: typeIndex >= 0 ? (row[typeIndex]?.trim() || 'note') : 'note',
          space: space,
          tags: tagsIndex >= 0 && row[tagsIndex] 
            ? row[tagsIndex].split(',').map(tag => tag.trim()).filter(Boolean)
            : [],
          source: 'csv-import',
          user_id: user.id
        }));

      const { error } = await supabase.from('items').insert(items);
      if (error) throw error;

      toast({
        title: "CSV imported successfully",
        description: `Imported ${items.length} items from CSV`,
        action: (
          <Button variant="outline" size="sm" onClick={() => window.location.href = `/manage?space=${encodeURIComponent(space)}`}>
            View in Library
          </Button>
        )
      });

      onClose();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import CSV",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle className="flex items-center gap-2">
          <FileSpreadsheet size={20} />
          Import CSV File
        </DrawerTitle>
        <DrawerClose className="absolute right-4 top-4">
          <X size={20} />
        </DrawerClose>
      </DrawerHeader>

      <div className="px-6 space-y-6">
        {/* File Drop Zone */}
        {!csvFile && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet size={40} className="mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-primary">Drop CSV file here...</p>
            ) : (
              <div>
                <p className="text-foreground mb-2">
                  Drag & drop CSV file here, or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Only .csv files are accepted
                </p>
              </div>
            )}
          </div>
        )}

        {/* File Settings */}
        {csvFile && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">{csvFile.name}</span>
              <Button variant="ghost" size="sm" onClick={() => {
                setCsvFile(null);
                setCsvData(null);
                setShowPreview(false);
              }}>
                <X size={16} />
              </Button>
            </div>

            {/* CSV Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Delimiter</Label>
                <Select value={delimiter} onValueChange={setDelimiter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=",">Comma (,)</SelectItem>
                    <SelectItem value=";">Semicolon (;)</SelectItem>
                    <SelectItem value="\t">Tab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch checked={hasHeader} onCheckedChange={setHasHeader} />
                  <Label>First row is header</Label>
                </div>
              </div>
            </div>

            <Button onClick={() => parseCSV(csvFile)} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Parsing...
                </>
              ) : (
                'Parse CSV'
              )}
            </Button>
          </div>
        )}

        {/* Preview and Column Mapping */}
        {csvData && showPreview && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Eye size={16} />
              <h3 className="font-medium">Preview (First 5 rows)</h3>
            </div>
            
            {/* Column Mapping */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Title Column *</Label>
                <Select value={columnMapping.title} onValueChange={(value) => 
                  setColumnMapping(prev => ({ ...prev, title: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {csvData.headers.map((header, index) => (
                      <SelectItem key={index} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type Column</Label>
                <Select value={columnMapping.type} onValueChange={(value) => 
                  setColumnMapping(prev => ({ ...prev, type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {csvData.headers.map((header, index) => (
                      <SelectItem key={index} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tags Column</Label>
                <Select value={columnMapping.tags} onValueChange={(value) => 
                  setColumnMapping(prev => ({ ...prev, tags: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {csvData.headers.map((header, index) => (
                      <SelectItem key={index} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview Table */}
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {csvData.headers.slice(0, 5).map((header, index) => (
                      <th key={index} className="text-left p-2 border-r">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.rows.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t">
                      {row.slice(0, 5).map((cell, cellIndex) => (
                        <td key={cellIndex} className="p-2 border-r">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Space Selection */}
        {csvData && (
          <div className="space-y-2">
            <Label htmlFor="space">Import to Space</Label>
            <Select value={space} onValueChange={setSpace}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Work">Work</SelectItem>
                <SelectItem value="Projects">Projects</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <DrawerFooter className="flex flex-row gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        {csvData && (
          <Button 
            onClick={handleImport} 
            disabled={!columnMapping.title || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Importing...
              </>
            ) : (
              `Import ${csvData.rows.length} items`
            )}
          </Button>
        )}
      </DrawerFooter>
    </DrawerContent>
  );
};