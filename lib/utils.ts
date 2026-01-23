import { BillItem, BillData, Person } from './types';

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function calculateTotal(items: BillItem[], tax: number, service: number): BillData {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + tax + service;
  
  return {
    items,
    tax,
    service,
    subtotal,
    total
  };
}

export function splitEqually(billData: BillData, numberOfPeople: number): number {
  return Math.round(billData.total / numberOfPeople);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatNumber(value: string): number {
  return parseInt(value.replace(/\D/g, '')) || 0;
}

export function generateWhatsAppMessage(
  people: Person[], 
  billData: BillData, 
  method: string, 
  itemAssignments: Record<string, string[]>, 
  taxAssignments: string[], 
  serviceAssignments: string[],
  showPaymentDetails: boolean,
  showItemDetails: boolean,
  stripEmojis: boolean = false
): string {
  const date = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const emojiMoneyBag = stripEmojis ? '' : '\uD83D\uDCB0 ';
  const emojiCalendar = stripEmojis ? '' : '\uD83D\uDCC5 ';
  const emojiReceipt = stripEmojis ? '' : '\uD83E\uDDFE ';
  const emojiMoneyWings = stripEmojis ? '' : '\uD83D\uDCB8 ';
  const emojiSparkles = stripEmojis ? '' : '\u2728 ';

  let message = `${emojiMoneyBag}Split Bill Summary `;
  if (method === 'equal') {
    message += `- Equal (split evenly)\n`;
  } else if (method === 'custom') {
    message += `- Split Method: Custom (by items)\n`;
  }

  message += `${emojiCalendar}${date}\n`;
  message += `${emojiReceipt}Total Bill: ${formatCurrency(billData.total)}\n`;

  if (showPaymentDetails) {
    message += `\n${emojiMoneyWings}Payment Breakdown:\n`;
    
    people.forEach((person, index) => {
      message += `${index + 1}. ${person.name} pays: ${formatCurrency(person.amount)}`;
      message += `\n`;

      if (method === 'custom' && showItemDetails) {
        const assignedItems = billData.items.filter(item => itemAssignments[item.id]?.includes(person.id));

        if (assignedItems.length > 0) {
          message += `   - Items:\n`;
          assignedItems.forEach(item => {
            const numSharers = itemAssignments[item.id]?.length || 1;
            const pricePerSharer = (item.price * item.quantity) / numSharers;
            message += `     • ${item.name} ${item.quantity > 1 ? `(x${item.quantity})` : ''} ${numSharers > 1 ? `(shared)` : ''}: ${formatCurrency(pricePerSharer)}\n`;
          });
        }

        let taxShare = 0;
        if (billData.tax > 0) {
          if (taxAssignments.includes(person.id) && taxAssignments.length > 0) {
              taxShare = billData.tax / taxAssignments.length;
          }
        }

        let serviceShare = 0;
        if (billData.service > 0) {
          if (serviceAssignments.includes(person.id) && serviceAssignments.length > 0) {
              serviceShare = billData.service / serviceAssignments.length;
          }
        }

        if (taxShare > 0) {
          message += `   - Tax: ${formatCurrency(taxShare)}\n`;
        }
        if (serviceShare > 0) {
          message += `   - Service Charge: ${formatCurrency(serviceShare)}\n`;
        }
      }
    });
  }
  
  message += `\n${emojiSparkles}Calculated with Splitsy Web — Fair bills, fast splits.
`;
  
  return message;
}

export function shareToWhatsApp(message: string) {
  const encodedMessage = encodeURIComponent('\uFEFF' + message);
  const url = `https://wa.me/?text=${encodedMessage}`;
  window.open(url, '_blank');
}

// export function shareToTelegram(message: string) {
//   const encodedMessage = encodeURIComponent('\uFEFF' + message);
//   const url = `https://t.me/share/url?text=${encodedMessage}`;
//   window.open(url, '_blank');
// }
