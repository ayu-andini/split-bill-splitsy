'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, ArrowLeft, Minus } from 'lucide-react';
import { BillData, BillItem } from '@/lib/types';
import { generateId, formatCurrency, formatNumber, calculateTotal } from '@/lib/utils';

interface ItemsEditorProps {
  initialData: BillData;
  onConfirm: (data: BillData) => void;
  onBack: () => void;
}

export default function ItemsEditor({ initialData, onConfirm, onBack }: ItemsEditorProps) {
  const [items, setItems] = useState<BillItem[]>(initialData.items);
  // Revert state to handle monetary amounts
  const [tax, setTax] = useState(initialData.tax);
  const [service, setService] = useState(initialData.service);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Revert calculateTotal call to use monetary amounts
  const billData = calculateTotal(items, tax, service);

  const handleAddItem = () => {
    const newItem: BillItem = {
      id: generateId(),
      name: '',
      price: 0,
      quantity: 1
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

  const handleIncrement = () => {
    setEditQuantity(q => String(Number(q || 0) + 1));
  };

  const handleDecrement = () => {
    setEditQuantity(q => String(Math.max(1, Number(q || 1) - 1)));
  };

  const handleConfirm = () => {
    // Pass the calculated billData which is based on the monetary amounts in the state
    const finalBillData: BillData = {
      ...billData,
      // Calculate and pass current percentages as well for consistency
      taxPercentage: billData.subtotal > 0 ? (billData.tax / billData.subtotal) * 100 : 0,
      servicePercentage: billData.subtotal > 0 ? (billData.service / billData.subtotal) * 100 : 0,
    };
    onConfirm(finalBillData);
  };

  // Calculate current percentages dynamically for display
  const currentTaxPercentage = billData.subtotal > 0 ? (billData.tax / billData.subtotal) * 100 : 0;
  const currentServicePercentage = billData.subtotal > 0 ? (billData.service / billData.subtotal) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="text-sm text-muted-foreground">
          Review & Edit
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <p className="text-green-500 font-medium">
          ✅ Receipt scanned successfully! Review the items below:
        </p>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">
            Items Detected
          </h3>
          <button
            onClick={handleAddItem}
            disabled={!!editingId}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-card rounded-lg p-4 border"
            >
              {editingId === item.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border rounded-lg text-foreground"
                    placeholder="Item Name"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 bg-background border rounded-lg text-foreground"
                      placeholder="Price"
                    />
                    {/* Quantity with Increment/Decrement buttons */}
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
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editName.trim() || !editPrice.trim()}
                      className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 bg-secondary text-secondary-foreground py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {item.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="font-medium text-foreground">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="p-2 hover:bg-secondary rounded-lg"
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tax & Service - Reverted to handle monetary amounts */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">
          Additional Charges
        </h3>
        
        <div className="space-y-2">
          <div className="bg-card rounded-lg p-4 border">
            <label className="block text-sm font-medium text-foreground mb-2">
              Tax
            </label>
            <input
              type="text"
              value={tax}
              onChange={(e) => setTax(formatNumber(e.target.value))}
              className="w-full px-3 py-2 bg-background border rounded-lg text-foreground"
              placeholder="0"
            />
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <label className="block text-sm font-medium text-foreground mb-2">
              Service Charge
            </label>
            <input
              type="text"
              value={service}
              onChange={(e) => setService(formatNumber(e.target.value))}
              className="w-full px-3 py-2 bg-background border rounded-lg text-foreground"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-primary text-primary-foreground rounded-xl p-6 space-y-2">
        <div className="flex justify-between text-sm opacity-80">
          <span>Subtotal</span>
          <span>{formatCurrency(billData.subtotal)}</span>
        </div>
        {billData.tax > 0 && (
          <div className="flex justify-between text-sm opacity-80">
            <span>Tax ({currentTaxPercentage.toFixed(0)}%)</span>
            <span>{formatCurrency(billData.tax)}</span>
          </div>
        )}
        {billData.service > 0 && (
          <div className="flex justify-between text-sm opacity-80">  
            <span>Service ({currentServicePercentage.toFixed(0)}%)</span>
            <span>{formatCurrency(billData.service)}</span>
          </div>
        )}
        <div className="border-t border-primary-foreground/20 pt-2 mt-2">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(billData.total)}</span>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleConfirm}
        className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-xl font-medium hover:bg-primary/90 transition-colors"
      >
        Continue to Split →
      </button>
    </div>
  );
}
