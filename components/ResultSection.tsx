'use client';

import { ArrowLeft, Copy, MessageCircle, Send, RotateCcw } from 'lucide-react';
import { Person, BillData, SplitMethod } from '@/lib/types';
import { formatCurrency, generateWhatsAppMessage, shareToWhatsApp } from '@/lib/utils';
import { useState } from 'react';

interface ResultSectionProps {
  onBack: () => void;
  people: Person[];
  billData: BillData;
  method: SplitMethod;
  onStartOver: () => void;
  itemAssignments: Record<string, string[]>;
  taxAssignments: string[];
  serviceAssignments: string[];
}

export default function ResultSection({ 
  onBack, 
  people, 
  billData, 
  method, 
  onStartOver,
  itemAssignments,
  taxAssignments,
  serviceAssignments,
}: ResultSectionProps) {
  const [copied, setCopied] = useState(false);
  // Removed showPaymentDetails state, it will always be true
  const [showItemDetails, setShowItemDetails] = useState(true);

  // Message for preview (always with emojis)
  const previewMessage = generateWhatsAppMessage(
    people, 
    billData, 
    method, 
    itemAssignments, 
    taxAssignments, 
    serviceAssignments,
    true, // showPaymentDetails
    showItemDetails,
    false // stripEmojis: false for preview
  );

  const handleCopy = async () => {
    const copyMessage = generateWhatsAppMessage(
        people, 
        billData, 
        method, 
        itemAssignments, 
        taxAssignments, 
        serviceAssignments,
        true, // showPaymentDetails
        showItemDetails,
        false // stripEmojis: false for copy
    );
    await navigator.clipboard.writeText(copyMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const whatsappMessage = generateWhatsAppMessage(
        people, 
        billData, 
        method, 
        itemAssignments, 
        taxAssignments, 
        serviceAssignments,
        true, // showPaymentDetails
        showItemDetails,
        true // stripEmojis: true for WhatsApp
    );
    shareToWhatsApp(whatsappMessage);
  };

  // const handleTelegramShare = () => {
  //   shareToTelegram(message);
  // };

  return (
    <div className="space-y-6">
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />Back
      </button>
      <div className="text-center space-y-2">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-foreground">
          Split Bill Complete!
        </h2>
        <p className="text-muted-foreground">
          Let’s settle up — Here’s how much everyone needs to pay
        </p>
      </div>

      <div className="bg-primary text-primary-foreground rounded-xl p-6 text-center">
        <p className="text-sm opacity-80 mb-2">Total Bill</p>
        <p className="text-3xl font-bold">{formatCurrency(billData.total)}</p>
      </div>

      {/* Split Breakdown */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">
          Payment Summary
        </h3>
        
        <div className="space-y-2">
          {people.map((person) => {
            // Recalculate the breakdown for display purposes
            const assignedItems = method === 'custom' 
              ? billData.items.filter(item => itemAssignments[item.id]?.includes(person.id))
              : [];
            
            const personSubtotal = assignedItems.reduce((sum, item) => {
              const numSharers = itemAssignments[item.id]?.length || 1;
              return sum + (item.price * item.quantity) / numSharers;
            }, 0);

            let personTax = 0;
            let personService = 0;

            if (method === 'custom') {
              // Proportional calculation based on the person's subtotal and the bill's overall percentage
              personTax = personSubtotal * ((billData.taxPercentage || 0) / 100);
              personService = personSubtotal * ((billData.servicePercentage || 0) / 100);
            } else if (method === 'equal') {
              // For equal split, just divide the total tax/service by the number of people
              personTax = billData.tax / people.length;
              personService = billData.service / people.length;
            }

            return (
              <div
                key={person.id}
                className="bg-card rounded-lg p-4 border"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">
                    {person.name}
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(person.amount)}
                  </p>
                </div>

                {(assignedItems.length > 0 || personTax > 0 || personService > 0) && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {assignedItems.map(item => {
                        const numSharers = itemAssignments[item.id]?.length || 1;
                        const pricePerSharer = (item.price * item.quantity) / numSharers;
                        return (
                          <li key={item.id} className="flex justify-between">
                            <span>{item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''} {numSharers > 1 ? `(shared)` : ''}</span>
                            <span>{formatCurrency(pricePerSharer)}</span>
                          </li>
                        );
                      })}
                      {personTax > 0 && billData.taxPercentage !== undefined && billData.taxPercentage > 0 && (
                        <li className="flex justify-between">
                          <span>Tax ({billData.taxPercentage.toFixed(0)}%)</span>
                          <span>{formatCurrency(personTax)}</span>
                        </li>
                      )}
                      {personService > 0 && billData.servicePercentage !== undefined && billData.servicePercentage > 0 && (
                        <li className="flex justify-between">
                          <span>Service Charge ({billData.servicePercentage.toFixed(0)}%)</span>
                          <span>{formatCurrency(personService)}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Message Preview */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">
          Message Preview
        </h3>
        {/* Options */}
        {method === 'custom' && (
        <div className="bg-card border rounded-lg p-4 space-y-3">
             <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showItemDetails} 
                onChange={e => setShowItemDetails(e.target.checked)}
                className="w-5 h-5 rounded accent-primary"
              />
              <span className="font-medium text-sm text-foreground">Include Item Details</span>
            </label>
        </div>
        )}
        <div className="bg-muted rounded-lg p-4 border">
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
            {previewMessage}
          </pre>
        </div>
      </div>

      {/* Share Results */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">
          Share Results
        </h3>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={handleWhatsAppShare}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-3"
          >
            <MessageCircle className="w-5 h-5" />
            Share via WhatsApp
          </button>
          <button
            onClick={handleCopy}
            className="w-full bg-secondary text-secondary-foreground py-4 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-3"
          >
            <Copy className="w-5 h-5" />
            {copied ? 'Copied to clipboard!' : 'Copy Summary'}
          </button>
        </div>
      </div>

      <button
        onClick={onStartOver}
        className="w-full bg-card border-2 hover:border-border/80 text-foreground py-4 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-3"
      >
        <RotateCcw className="w-5 h-5" />
        Split Another Bill
      </button>
    </div>
  );
}
