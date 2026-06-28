export interface ParsedSMS {
    amount: number;
    type: 'income' | 'expense';
    bank: string;
    accountLabel: string;
}

export function parseBankSMS(text: string): ParsedSMS | null {
    const lowercase = text.toLowerCase();

    // Basic Regex Patterns for Indian Bank SMS
    const amountMatch = text.match(/(?:rs\.?|inr)\s*([\d,]+(?:\.\d{2})?)/i);
    if (!amountMatch) return null;

    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));

    const isExpense = lowercase.includes('debited') || lowercase.includes('spent') || lowercase.includes('paid');
    const isIncome = lowercase.includes('credited') || lowercase.includes('received') || lowercase.includes('added');

    if (!isExpense && !isIncome) return null;

    // Extract bank name/label from beginning or keywords
    let bank = 'Unknown Bank';
    const banks = ['HDFC', 'ICICI', 'SBI', 'Axis', 'KOTAK', 'PAYTM', 'GPAY'];
    for (const b of banks) {
        if (text.toUpperCase().includes(b)) {
            bank = b + ' Bank';
            break;
        }
    }

    // Account last digits
    const accMatch = text.match(/a\/c\s*xx(\d{4})/i);
    const accountLabel = accMatch ? `A/c XX${accMatch[1]}` : 'Account';

    return {
        amount,
        type: isExpense ? 'expense' : 'income',
        bank,
        accountLabel
    };
}

export function simulateIncomingSMS(): string {
    const types = ['debited', 'credited'];
    const banks = ['HDFC', 'ICICI', 'SBI', 'Axis'];
    const type = types[Math.floor(Math.random() * types.length)];
    const amount = Math.floor(Math.random() * 5000) + 100;
    const bank = banks[Math.floor(Math.random() * banks.length)];
    const acc = Math.floor(1000 + Math.random() * 9000);
    const date = new Date().toLocaleDateString('en-GB');

    if (type === 'debited') {
        return `Rs.${amount.toLocaleString('en-IN')} debited from VPA user@upi (A/c XX${acc}) via ${bank} Bank on ${date}. Not you? Call 1800...`;
    } else {
        return `Your A/c XX${acc} has been credited with Rs.${amount.toLocaleString('en-IN')} on ${date} by Transfer from XXXX via ${bank} Bank.`;
    }
}
