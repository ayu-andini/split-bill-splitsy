'use client';

import React, { useState, useEffect } from 'react';
import { Camera, Users, PenSquare, Send  } from 'lucide-react';
import UploadSection from '@/components/UploadSection';
import ItemsEditor from '@/components/ItemsEditor';
import SplitSection from '@/components/SplitSection';
import ResultSection from '@/components/ResultSection';
import { BillData, Person, SplitMethod } from '@/lib/types';
import { generateId, splitEqually } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

// Define initial state values
const initialNumberOfPeople = 2;
const initialPeople = Array.from({ length: initialNumberOfPeople }, (_, i) => ({
  id: generateId(),
  name: `Person ${i + 1}`,
  amount: 0,
}));

export default function Home() {
  const STEPS = ['upload', 'edit', 'split', 'result'] as const;
  type Step = typeof STEPS[number]; 
  const [step, setStep] = useState<Step>('upload');

  useEffect(() => {
  const hash = window.location.hash.replace('#', '');
  if (STEPS.includes(hash as Step)) {
    setStep(hash as Step);
  }
  }, []);
  useEffect(() => {
    window.location.hash = step;
  }, [step]);
  useEffect(() => {
  const onHashChange = () => {
    const hash = window.location.hash.replace('#', '');
    if (STEPS.includes(hash as Step)) {
      setStep(hash as Step);
    }
  };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const [billData, setBillData] = useState<BillData | null>(null);
  
  // State lifted from SplitSection
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [numberOfPeople, setNumberOfPeople] = useState(initialNumberOfPeople);
  const [itemAssignments, setItemAssignments] = useState<Record<string, string[]>>({});
  const [taxAssignments, setTaxAssignments] = useState<string[]>([]);
  const [serviceAssignments, setServiceAssignments] = useState<string[]>([]);
  
  // Logic lifted from SplitSection
  // Effect to sync people array with numberOfPeople for 'equal' split
  useEffect(() => {
    if (step === 'split' && splitMethod === 'equal') {
      const currentPeopleCount = people.length;
      if (numberOfPeople > currentPeopleCount) {
        const newPeople = Array.from({ length: numberOfPeople - currentPeopleCount }, (_, i) => ({
          id: generateId(),
          name: `Person ${currentPeopleCount + i + 1}`,
          amount: 0,
        }));
        setPeople(prev => [...prev, ...newPeople]);
      } else if (numberOfPeople < currentPeopleCount) {
        setPeople(prev => prev.slice(0, numberOfPeople));
      }
    }
  }, [numberOfPeople, splitMethod, step, people.length]);

  // Effect to set default assignments for tax and service when people change in custom mode
  useEffect(() => {
    if (step === 'split' && splitMethod === 'custom') {
      const allPeopleIds = people.map(p => p.id);
      setTaxAssignments(allPeopleIds);
      setServiceAssignments(allPeopleIds);
    }
  }, [people.length, splitMethod, step]);

  // Effect to recalculate amounts for custom split
  useEffect(() => {
    if (step === 'split' && splitMethod === 'custom' && billData) {
      const personTotals: Record<string, number> = {};
      people.forEach(p => personTotals[p.id] = 0);

      if (billData.items && Array.isArray(billData.items)) {
        billData.items.forEach(item => {
          const assignedPeople = itemAssignments[item.id] || [];
          if (assignedPeople.length > 0) {
            const costPerPerson = (item.price * item.quantity) / assignedPeople.length;
            assignedPeople.forEach(personId => {
              if (personTotals[personId] !== undefined) personTotals[personId] += costPerPerson;
            });
          }
        });
      }
      
      if (billData.tax > 0 && taxAssignments.length > 0) {
        const taxPerPerson = billData.tax / taxAssignments.length;
        taxAssignments.forEach(personId => {
          if (personTotals[personId] !== undefined) personTotals[personId] += taxPerPerson;
        });
      }

      if (billData.service > 0 && serviceAssignments.length > 0) {
        const servicePerPerson = billData.service / serviceAssignments.length;
        serviceAssignments.forEach(personId => {
          if (personTotals[personId] !== undefined) personTotals[personId] += servicePerPerson;
        });
      }
      
      // Only update if amounts have changed to avoid loops
      const hasChanged = people.some(p => p.amount !== (personTotals[p.id] || 0));
      if (hasChanged) {
        setPeople(currentPeople => currentPeople.map(p => ({
          ...p,
          amount: personTotals[p.id] || 0
        })));
      }
    }
  }, [itemAssignments, taxAssignments, serviceAssignments, billData, splitMethod, step, people.length]);
  
  const handleDataExtracted = (data: BillData) => {
    setBillData(data);
    setStep('edit');
  };
  
  // Reset split-related state when moving to the split step
  const resetSplitState = () => {
    setSplitMethod('equal');
    setNumberOfPeople(initialNumberOfPeople);
    setPeople(initialPeople);
    setItemAssignments({});
    setTaxAssignments(initialPeople.map(p => p.id));
    setServiceAssignments(initialPeople.map(p => p.id));
  };

  const handleDataConfirmed = (data: BillData) => {
    setBillData(data);
    resetSplitState();
    setStep('split');
  };

  const handleSplitComplete = () => {
    if (splitMethod === 'equal' && billData) {
      const amountPerPerson = splitEqually(billData, numberOfPeople);
      const updatedPeople = people.map((person, index) => ({
        ...person,
        name: person.name || `Person ${index + 1}`,
        amount: amountPerPerson
      }));
      setPeople(updatedPeople);
    }
    setStep('result');
  };

  const handleStartOver = () => {
    setBillData(null);
    resetSplitState();
    setStep('upload');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💰</span>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                <button onClick={() => setStep('upload')}>Splitsy</button>
              </h1>
              <p className="text-sm text-muted-foreground">
                Fair bills, fast splits.
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="bg-card">
        <div className="max-w-2xl mx-auto py-4 border-b border-border">
          <div className="flex items-center justify-center">
            
            {[
              { id: 'upload', label: 'Upload', icon: Camera },
              { id: 'edit', label: 'Edit', icon: PenSquare },
              { id: 'split', label: 'Split', icon: Users },
              { id: 'result', label: 'Share', icon: Send },
            ].map((s, index) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isPassed =
                ['upload', 'edit', 'split', 'result'].indexOf(step) > index;

              return (
                <div key={s.id} className="flex items-center">
                  {/* Step */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${
                        isActive || isPassed
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span
                      className={`text-xs mt-1 ${
                        isActive || isPassed
                          ? 'text-primary font-medium'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>

                  {/* Connector */}
                  {index < 3 && (
                    <div className="mx-5 sm:mx-10">
                      <div
                        className={`h-0.5 w-6 sm:w-10 rounded-full transition-colors ${
                          isPassed ? 'bg-primary' : 'bg-secondary'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {step === 'upload' && (
          <UploadSection onDataExtracted={handleDataExtracted} />
        )}

        {step === 'edit' && billData && (
          <ItemsEditor
            initialData={billData}
            onConfirm={handleDataConfirmed}
            onBack={() => setStep('upload')}
          />
        )}

        {step === 'split' && billData && (
          <SplitSection
            billData={billData}
            onComplete={handleSplitComplete}
            onBack={() => setStep('edit')}
            // Pass all state and setters down
            method={splitMethod}
            setMethod={setSplitMethod}
            numberOfPeople={numberOfPeople}
            setNumberOfPeople={setNumberOfPeople}
            people={people}
            setPeople={setPeople}
            itemAssignments={itemAssignments}
            setItemAssignments={setItemAssignments}
            taxAssignments={taxAssignments}
            setTaxAssignments={setTaxAssignments}
            serviceAssignments={serviceAssignments}
            setServiceAssignments={setServiceAssignments}
          />
        )}

        {step === 'result' && billData && (
          <ResultSection
            people={people}
            billData={billData}
            method={splitMethod}
            onStartOver={handleStartOver}
            onBack={() => setStep('split')}
            itemAssignments={itemAssignments}
            taxAssignments={taxAssignments}
            serviceAssignments={serviceAssignments}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-5">
        <div className="max-w-2xl mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>© 2025 <a href="https://www.linkedin.com/in/ayu-andinii/"> Ayu Andini.</a> All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
