'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, PencilLine, Loader2, Plus, Minus, Trash2, Edit2, Check, X, ScanLine, RotateCcw } from 'lucide-react';
import { calculateTotal, generateId, formatCurrency, formatNumber } from '@/lib/utils';
import { BillData, BillItem } from '@/lib/types';

interface UploadSectionProps {
  onDataExtracted: (data: BillData) => void;
}

// UPLOAD SECTION AREA
export default function UploadSection({ onDataExtracted }: UploadSectionProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [openManual, setOpenManual] = useState(false);

  // This function now only sets the file for preview
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // This new function handles the actual scanning process
  const handleScan = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setProgress('Extracting bill data... 🤖');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }

      const extracted = await response.json();

      const itemsWithIds: BillItem[] = extracted.items.map((item: Omit<BillItem, 'id'>) => {
        const quantity = item.quantity > 0 ? item.quantity : 1;
        const unitPrice = item.price / quantity;
        return {
          ...item,
          id: generateId(),
          quantity: quantity,
          price: unitPrice,
        };
      });

      const subtotal = itemsWithIds.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const taxAmount = subtotal * ((extracted.tax || 0) / 100);
      const serviceAmount = subtotal * ((extracted.service || 0) / 100);

      const billData: BillData = {
        items: itemsWithIds,
        subtotal,
        tax: taxAmount,
        service: serviceAmount,
        total: subtotal + taxAmount + serviceAmount,
        taxPercentage: extracted.tax || 0,
        servicePercentage: extracted.service || 0,
      };

      setProgress('Done! ✅');
      setTimeout(() => onDataExtracted(billData), 500);

    } catch (error) {
      console.error('Error processing receipt:', error);
      setProgress(error instanceof Error ? error.message : 'An unknown error occurred.');
    }
  };
  
  const handleRetake = () => {
    setPreview(null);
    setSelectedFile(null);
    setLoading(false); // Reset loading state
    setProgress('');    // Clear any progress/error message
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear file input
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''; // Clear camera input
    }
  };
  
  const handleManualSave = (data: BillData) => {
    onDataExtracted(data);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl mb-4">🧾</div>
        <h3 className="text-3xl font-bold text-foreground">Split Your Bill</h3>
        <p className="text-muted-foreground">Snap your receipt — let us handle the math.</p>
      </div>

      {!preview && (
        <div className="space-y-5">
          <div className='flex gap-3'>
            {/* <button onClick={() => cameraInputRef.current?.click()} 
            className="w-full bg-secondary shadow-md text-secondary-foreground py-4 px-6 rounded-xl font-medium hover:bg-secondary/70 transition-colors flex items-center justify-center gap-3">
            <Camera className="w-5 h-5" /> Take Photo
            </button> */}
            <button onClick={() => setOpenManual(true)} 
              className="w-full bg-secondary shadow-md text-secondary-foreground py-4 px-6 rounded-xl font-medium hover:bg-secondary/70 transition-colors flex items-center justify-center gap-3">
              <PencilLine className="w-5 h-5" /> Manual Input
            </button> 
          </div>

          <button onClick={() => fileInputRef.current?.click()} 
            className="w-full bg-primary shadow-md text-primary-foreground py-4 px-6 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-3">
              <Upload className="w-5 h-5" /> Upload Image
          </button>

          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

          {openManual && <ManualInputModal onClose={() => setOpenManual(false)} onSave={handleManualSave} />}

          <div>
            <div className="mt-10 bg-card border rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-foreground mb-3">📝 Tips for best results:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Use good lighting, so text is easy to read</li>
                <li>• Keep the receipt flat & straight</li>
                <li>• Capture the entire receipt in one frame</li>
                <li>• Avoid shadows or glare on the paper</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden border">
            <img src={preview} alt="Receipt preview" className="w-full h-auto" />
          </div>

          {!loading ? (
            <div className="flex gap-3">
                <button onClick={() => fileInputRef.current?.click()} 
                  className="w-20% bg-secondary shadow-md text-secondary-foreground py-4 px-6 rounded-xl font-medium hover:bg-secondary/70 transition-colors flex items-center justify-center gap-3">
                    <RotateCcw className="w-5 h-5" /> Retake
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

                <button 
                  onClick={handleScan} 
                  className="w-full bg-primary shadow-md text-primary-foreground py-4 px-6 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-3">
                  <ScanLine className="w-5 h-5" /> Continue to Scan
                </button>
            </div>
          ) : (
            <div className="bg-muted rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground font-medium">{progress}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Reusable Manual Input Modal Component remains unchanged
function ManualInputModal({ onSave, onClose }: { onSave: (data: BillData) => void, onClose: () => void }) {
  const [items, setItems] = useState<BillItem[]>([]);
  const [tax, setTax] = useState(0);
  const [service, setService] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const billData = calculateTotal(items, tax, service);

  const handleAddItem = () => {
    const newItem: BillItem = {
      id: generateId(),
      name: '',
      price: 0,
      quantity: 1,
    };
    setItems([...items, newItem]);
    setEditingId(newItem.id);
    setEditName(newItem.name);
    setEditPrice('');
    setEditQuantity('1');
    setIsAdding(true);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleEditItem = (item: BillItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(item.price.toString());
    setEditQuantity(item.quantity.toString());
    setIsAdding(false);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim() || !editPrice.trim()) return;
    setItems(items.map(item =>
      item.id === editingId
        ? { ...item, name: editName, price: formatNumber(editPrice), quantity: formatNumber(editQuantity) || 1 }
        : item
    ));
    setEditingId(null);
    setIsAdding(false);
  };
  
  const handleCancelEdit = () => {
    if (isAdding) {
      setItems(items.slice(0, -1));
    }
    setEditingId(null);
    setIsAdding(false);
  };

  const handleConfirm = () => {
    onSave(billData);
    onClose();
  };

  const handleIncrement = () => {
    setEditQuantity(q => String(Number(q || 0) + 1));
  };

  const handleDecrement = () => {
    setEditQuantity(q => String(Math.max(1, Number(q || 1) - 1)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/30 dark:bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">
            Add Receipt (Manual)
          </h2>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Items</h3>
              <button onClick={handleAddItem} disabled={!!editingId} className="flex items-center gap-2 text-sm text-primary font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="bg-muted/50 rounded-lg p-3 border">
                  {editingId === item.id ? (
                    <div className="space-y-3">
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 bg-background border rounded-lg" placeholder="Item Name" />
                      <div className="flex gap-2">
                        <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value.replace(/\D/g, ''))} className="w-full px-3 py-2 bg-background border rounded-lg" placeholder="Price" />
                        <div className="flex items-center justify-center gap-1">
                            <button type="button" onClick={handleDecrement} className="p-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80">
                                <Minus className="w-4 h-4" />
                            </button>
                            <input 
                                type="number" 
                                value={editQuantity} 
                                onChange={e => setEditQuantity(e.target.value.replace(/\D/g, ''))} 
                                className="w-16 px-2 py-2 text-center bg-background border rounded-lg" 
                                placeholder="Qty" 
                            />
                            <button type="button" onClick={handleIncrement} className="p-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleSaveEdit} disabled={!editName.trim() || !editPrice.trim()} className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Check className="w-4 h-4" /> Save</button>
                        <button onClick={handleCancelEdit} className="flex-1 bg-secondary text-secondary-foreground py-2 px-4 rounded-lg flex items-center justify-center gap-2"><X className="w-4 h-4" /> Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.quantity} x {formatCurrency(item.price)}</p>
                      </div>
                      <div className="font-medium text-foreground">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => handleEditItem(item)} className="p-2 hover:bg-background rounded-lg"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
                        <button onClick={() => handleDeleteItem(item.id)} className="p-2 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-center py-4 text-muted-foreground">No items added yet.</p>}
            </div>
          </div>

          {/* Tax & Service */}
          <div className="space-y-3 pt-4">
            <h3 className="font-semibold text-foreground">Additional Charges</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tax</label>
                <input type="text" value={tax} onChange={e => setTax(formatNumber(e.target.value))} className="w-full mt-1 px-3 py-2 bg-background border rounded-lg" placeholder="0" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Service Charge</label>
                <input type="text" value={service} onChange={e => setService(formatNumber(e.target.value))} className="w-full mt-1 px-3 py-2 bg-background border rounded-lg" placeholder="0" />
              </div>
            </div>
          </div>
          
           {/* Summary */}
          <div className="bg-muted/50 rounded-xl p-4 mt-4 space-y-2 border">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(billData.subtotal)}</span>
            </div>
            {billData.tax > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax</span>
                <span>{formatCurrency(billData.tax)}</span>
              </div>
            )}
            {billData.service > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Service</span>
                <span>{formatCurrency(billData.service)}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(billData.total)}</span>
              </div>
            </div>
          </div>

        </div>
        
        <div className="p-4 sm:p-6 border-t flex justify-end gap-3 bg-card/80 backdrop-blur-sm">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted">Cancel</button>
          <button onClick={handleConfirm} disabled={billData.total === 0} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed">Save & Continue</button>
        </div>
      </div>
    </div>
  );
}