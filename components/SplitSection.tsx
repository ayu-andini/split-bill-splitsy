'use client';

import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { BillData, Person, SplitMethod } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useEffect, useMemo } from 'react';

// This is the new, fully controlled component props interface
interface SplitSectionProps {
  billData: BillData;
  onComplete: () => void; // onComplete no longer needs to pass data up, parent has it
  onBack: () => void;
  
  method: SplitMethod;
  setMethod: (method: SplitMethod) => void;
  
  numberOfPeople: number;
  setNumberOfPeople: (n: number | ((prev: number) => number)) => void;
  
  people: Person[];
  setPeople: (p: Person[] | ((prev: Person[]) => Person[])) => void;

  itemAssignments: Record<string, string[]>;
  setItemAssignments: (assignments: Record<string, string[]> | ((prev: Record<string, string[]>) => Record<string, string[]>)) => void;
  
  taxAssignments: string[];
  setTaxAssignments: (assignments: string[] | ((prev: string[]) => string[])) => void;

  serviceAssignments: string[];
  setServiceAssignments: (assignments: string[] | ((prev: string[]) => string[])) => void;
}

export default function SplitSection({
  billData,
  onComplete,
  onBack,
  method,
  setMethod,
  numberOfPeople,
  setNumberOfPeople,
  people,
  setPeople,
  itemAssignments,
  setItemAssignments,
  taxAssignments,
  setTaxAssignments,
  serviceAssignments,
  setServiceAssignments,
}: SplitSectionProps) {

  // This useEffect hook will recalculate totals whenever dependencies change
  useEffect(() => {
    // This effect recalculates each person's total whenever the split method or assignments change.
    const calculateTotals = () => {
      let updatedPeople;

      if (method === 'equal') {
        const amountPerPerson = billData.total > 0 && numberOfPeople > 0 ? billData.total / numberOfPeople : 0;
        updatedPeople = people.map(p => ({ ...p, amount: amountPerPerson }));
      } else if (method === 'custom') {
        updatedPeople = people.map(person => {
          // 1. Calculate this person's subtotal from their assigned items
          let personSubtotal = 0;
          billData.items.forEach(item => {
            const assignments = itemAssignments[item.id] || [];
            if (assignments.includes(person.id)) {
              // If item is shared, divide its price by the number of people sharing it
              const pricePerSharer = (item.price * item.quantity) / assignments.length;
              personSubtotal += pricePerSharer;
            }
          });

          // 2. Calculate this person's tax, proportional to their subtotal
          const personTax = personSubtotal * ((billData.taxPercentage || 0) / 100);

          // 3. Calculate this person's service charge, proportional to their subtotal
          const personService = personSubtotal * ((billData.servicePercentage || 0) / 100);

          // 4. The final amount is the sum of their items + their share of tax and service
          const totalAmount = personSubtotal + personTax + personService;
          return { ...person, amount: totalAmount };
        });
      } else {
        updatedPeople = people.map(p => ({ ...p, amount: 0 }));
      }

      // Only update state if the amounts have actually changed, to prevent infinite re-renders
      if (JSON.stringify(people) !== JSON.stringify(updatedPeople)) {
        setPeople(updatedPeople);
      }
    };

    calculateTotals();
  }, [method, billData, people, numberOfPeople, itemAssignments, setPeople]);


  const handleAddPerson = () => {
    setPeople(prev => [...prev, {
      id: `person-${Date.now()}`, // Using a simpler ID for client-side
      name: `Person ${prev.length + 1}`,
      amount: 0
    }]);
  };

  const handleRemovePerson = (id: string) => {
    if (people.length <= 1) return;
    setPeople(people.filter(p => p.id !== id));
  };

  const handleNameChange = (id: string, name: string) => {
    setPeople(people.map(p => p.id === id ? { ...p, name } : p));
  };
  
  const handleToggleItemAssignment = (itemId: string, personId: string) => {
    setItemAssignments(prev => {
      const currentAssignments = prev[itemId] || [];
      const newAssignments = currentAssignments.includes(personId)
        ? currentAssignments.filter(id => id !== personId)
        : [...currentAssignments, personId];
      return { ...prev, [itemId]: newAssignments };
    });
  };

  // Note: These handlers are kept for the UI, but the calculation now ignores them for 'custom' split as requested.
  // const handleToggleTaxAssignment = (personId: string) => {
  //   setTaxAssignments(prev => prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]);
  // };

  // const handleToggleServiceAssignment = (personId: string) => {
  //   setServiceAssignments(prev => prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]);
  // };
  
  return (
    <div className="space-y-6">
      {/* Header and Total Amount */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="text-sm text-muted-foreground">Split Bill</div>
      </div>

      <div className="bg-primary text-primary-foreground rounded-xl p-6 text-center">
        <p className="text-sm opacity-80 mb-2">Total Amount</p>
        <p className="text-3xl font-bold">{formatCurrency(billData.total)}</p>
      </div>

      {/* Split Method Selection */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Split Method</h3>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setMethod('equal')} className={`p-4 rounded-xl border-2 transition-colors ${method === 'equal' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
            <p className="font-medium text-foreground">Equal</p>
            <p className="text-xs text-muted-foreground mt-1">Everyone pays the same amount.</p>
          </button>
          <button onClick={() => setMethod('custom')} className={`p-4 rounded-xl border-2 transition-colors ${method === 'custom' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
            <p className="font-medium text-foreground">Custom</p>
            <p className="text-xs text-muted-foreground mt-1">Assign items to each person.</p>
          </button>
        </div>
      </div>

      {/* Equal Split */}
      {method === 'equal' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-medium text-foreground">Number of People</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setNumberOfPeople(n => Math.max(1, n - 1))} className="w-10 h-10 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center" disabled={numberOfPeople <= 1}>
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-2xl font-bold text-foreground w-12 text-center">{numberOfPeople}</span>
              <button onClick={() => setNumberOfPeople(n => n + 1)} className="w-10 h-10 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
           {/* Summary for Equal Split */}
           <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Summary per Person</h3>
            <div className="bg-muted rounded-xl p-4 space-y-3">
              {people.slice(0, numberOfPeople).map(person => (
                <div key={person.id} className="flex justify-between items-center">
                  <span className="font-medium text-foreground">{person.name}</span>
                  <span className="text-lg font-bold text-foreground">{formatCurrency(person.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom Split by Item */}
      {method === 'custom' && (
        <div className="space-y-6">
          {/* People Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">People</h3>
              <button onClick={handleAddPerson} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Person
              </button>
            </div>
            <div className="space-y-2">
              {people.map((person, index) => (
                <div key={person.id} className="flex items-center gap-2">
                  <input type="text" value={person.name} onChange={(e) => handleNameChange(person.id, e.target.value)} className="flex-1 px-3 py-2 bg-background border rounded-lg text-foreground" placeholder={`Person ${index + 1}`} />
                  {people.length > 1 && (
                    <button onClick={() => handleRemovePerson(person.id)} className="p-2 hover:bg-red-500/10 rounded-lg">
                      <Minus className="w-5 h-5 text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Item Assignment */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Assign Items</h3>
            <div className="space-y-2">
              {billData.items.map(item => (
                <div key={item.id} className="bg-card rounded-lg p-4 border">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-foreground">{item.name} ({item.quantity}x)</span>
                    <span className="text-muted-foreground">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {people.map(person => (
                      <button key={person.id} onClick={() => handleToggleItemAssignment(item.id, person.id)} className={`px-3 py-1 rounded-full text-sm border transition-colors ${itemAssignments[item.id]?.includes(person.id) ? 'bg-primary border-primary text-primary-foreground' : 'bg-transparent hover:bg-muted'}`}>
                        {person.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note: Tax & Service assignment UI is now for visual reference only in custom mode, as logic is proportional */}
          {(billData.tax > 0 || billData.service > 0) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Additional Charges</h3>
                <p className="text-xs text-muted-foreground -mt-2">
                  In Custom mode, charges are split proportionally based on items.
                </p>
              <div className="bg-card rounded-lg p-4 border space-y-4">
                {billData.taxPercentage && billData.taxPercentage > 0 && (
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">Tax ({billData.taxPercentage.toFixed(0)}%)</span>
                      <span className="text-muted-foreground">{formatCurrency(billData.tax)}</span>
                    </div>
                  </div>
                )}
                {billData.servicePercentage && billData.servicePercentage > 0 && (
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">Service Charge ({billData.servicePercentage}%)</span>
                      <span className="text-muted-foreground">{formatCurrency(billData.service)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Custom Split Summary */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Summary per Person</h3>
            <div className="bg-muted rounded-xl p-4 space-y-3">
              {people.map(person => (
                <div key={person.id} className="flex justify-between items-center">
                  <span className="font-medium text-foreground">{person.name}</span>
                  <span className="text-lg font-bold text-foreground">{formatCurrency(person.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Calculate Button */}
      <button onClick={onComplete} className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-xl font-medium hover:bg-primary/90 transition-colors">
        Confirm Split →
      </button>
    </div>
  );
}