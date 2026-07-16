/**
 * ============================================================================
 *  SEED / DEMO DATA — NOT LIVE PRODUCTION DATA
 * ============================================================================
 *  Synthetic dataset for a fictional Chennai textile retailer, used to power
 *  the SME Growth & Advisory Agent demo. Every number here is hand-authored
 *  seed data for the pitch; it is NOT sourced from a real business or DB.
 *
 *  Business:  "Kanchi Textiles" — a mid-size textile retailer in Chennai
 *             selling sarees, shirting/suiting fabric and readymade garments,
 *             supplying both walk-in retail and small wholesale buyers.
 *  Currency:  INR (₹). Months are most-recent-last.
 * ============================================================================
 */

export interface SmeProduct {
    id: string;
    name: string;
    category: string;
    unitCost: number;          // ₹ landed cost per unit
    currentPrice: number;      // ₹ current selling price per unit
    /** Units sold per month, oldest -> newest (last 6 months). */
    monthlyUnitsSold: number[];
    /** Rough own-price elasticity estimate for this category (negative). */
    priceElasticity: number;
}

export interface SmeSupplier {
    id: string;
    name: string;
    suppliesCategory: string;
    /** Share of total monthly purchase value, 0..1 (should sum ~1 across suppliers). */
    purchaseShare: number;
    paymentTermsDays: number;  // credit days the supplier gives us
    onTimeDeliveryRate: number; // 0..1
    priceCompetitiveness: number; // 0..1, higher = cheaper vs market
}

export interface SmeCustomerInvoice {
    invoiceId: string;
    amount: number;            // ₹
    issuedDaysAgo: number;
    paidDaysAgo: number | null; // null = still outstanding
}

export interface SmeCustomer {
    id: string;
    name: string;
    segment: 'wholesale' | 'retail-credit';
    creditLimit: number;       // ₹
    agreedTermsDays: number;   // agreed payment window
    invoices: SmeCustomerInvoice[];
}

export interface SmeDataset {
    business: {
        name: string;
        type: string;
        city: string;
        currency: string;
    };
    /** Total monthly revenue (₹), oldest -> newest, last 12 months. */
    monthlyRevenue: number[];
    /** Total monthly operating expenses (₹), oldest -> newest, last 12 months. */
    monthlyExpenses: number[];
    products: SmeProduct[];
    suppliers: SmeSupplier[];
    customers: SmeCustomer[];
    seed: true; // explicit marker: this is demo seed data
}

export const SME_SEED_DATA: SmeDataset = {
    business: {
        name: 'Kanchi Textiles',
        type: 'Textile retailer & small-wholesale',
        city: 'Chennai',
        currency: 'INR',
    },

    // 12 months, showing mild seasonality (festival/wedding season bumps).
    monthlyRevenue: [
        1820000, 1760000, 1910000, 2050000, 1980000, 2140000,
        2260000, 2180000, 2390000, 2510000, 2420000, 2580000,
    ],
    monthlyExpenses: [
        1520000, 1490000, 1560000, 1640000, 1600000, 1700000,
        1770000, 1740000, 1860000, 1930000, 1900000, 1980000,
    ],

    products: [
        {
            id: 'P-SAREE-SILK',
            name: 'Kanchipuram Silk Saree',
            category: 'Silk Sarees',
            unitCost: 4200,
            currentPrice: 5800,
            monthlyUnitsSold: [120, 132, 141, 128, 150, 162],
            priceElasticity: -0.8, // premium/occasion buyers, fairly inelastic
        },
        {
            id: 'P-SAREE-COTTON',
            name: 'Cotton Handloom Saree',
            category: 'Cotton Sarees',
            unitCost: 620,
            currentPrice: 950,
            monthlyUnitsSold: [410, 388, 402, 430, 445, 452],
            priceElasticity: -1.6, // price-sensitive daily-wear segment
        },
        {
            id: 'P-SHIRTING',
            name: 'Premium Shirting Fabric (per m)',
            category: 'Shirting/Suiting',
            unitCost: 180,
            currentPrice: 240,
            monthlyUnitsSold: [1600, 1540, 1685, 1720, 1660, 1590],
            priceElasticity: -1.9, // commoditised, competitive
        },
        {
            id: 'P-READYMADE',
            name: 'Readymade Kurta Set',
            category: 'Readymade',
            unitCost: 540,
            currentPrice: 899,
            monthlyUnitsSold: [260, 275, 290, 310, 305, 330],
            priceElasticity: -1.2,
        },
    ],

    suppliers: [
        {
            id: 'S-ARNI',
            name: 'Arni Silk Weavers Co-op',
            suppliesCategory: 'Silk Sarees',
            purchaseShare: 0.46, // heavy concentration -> risk
            paymentTermsDays: 30,
            onTimeDeliveryRate: 0.88,
            priceCompetitiveness: 0.55,
        },
        {
            id: 'S-ERODE',
            name: 'Erode Cotton Mills',
            suppliesCategory: 'Cotton Sarees',
            purchaseShare: 0.24,
            paymentTermsDays: 45,
            onTimeDeliveryRate: 0.94,
            priceCompetitiveness: 0.72,
        },
        {
            id: 'S-TIRUPUR',
            name: 'Tirupur Knit House',
            suppliesCategory: 'Readymade',
            purchaseShare: 0.18,
            paymentTermsDays: 21,
            onTimeDeliveryRate: 0.9,
            priceCompetitiveness: 0.68,
        },
        {
            id: 'S-SALEM',
            name: 'Salem Weaving Unit',
            suppliesCategory: 'Shirting/Suiting',
            purchaseShare: 0.12,
            paymentTermsDays: 15,
            onTimeDeliveryRate: 0.82,
            priceCompetitiveness: 0.6,
        },
    ],

    customers: [
        {
            id: 'C-METRO',
            name: 'Metro Garments (wholesale)',
            segment: 'wholesale',
            creditLimit: 500000,
            agreedTermsDays: 30,
            invoices: [
                { invoiceId: 'INV-1012', amount: 180000, issuedDaysAgo: 74, paidDaysAgo: null }, // 44 days overdue
                { invoiceId: 'INV-1031', amount: 145000, issuedDaysAgo: 52, paidDaysAgo: null }, // 22 days overdue
                { invoiceId: 'INV-0990', amount: 160000, issuedDaysAgo: 96, paidDaysAgo: 71 },   // paid 25 late
            ],
        },
        {
            id: 'C-SARANYA',
            name: 'Saranya Boutique',
            segment: 'wholesale',
            creditLimit: 250000,
            agreedTermsDays: 30,
            invoices: [
                { invoiceId: 'INV-1044', amount: 90000, issuedDaysAgo: 20, paidDaysAgo: null },
                { invoiceId: 'INV-1005', amount: 110000, issuedDaysAgo: 60, paidDaysAgo: 33 }, // ~on time
            ],
        },
        {
            id: 'C-RKENT',
            name: 'R.K. Enterprises (wholesale)',
            segment: 'wholesale',
            creditLimit: 400000,
            agreedTermsDays: 45,
            invoices: [
                { invoiceId: 'INV-1050', amount: 220000, issuedDaysAgo: 88, paidDaysAgo: null }, // 43 days overdue
                { invoiceId: 'INV-1018', amount: 130000, issuedDaysAgo: 40, paidDaysAgo: null },
            ],
        },
        {
            id: 'C-LOCAL',
            name: 'Local Retail Credit Book',
            segment: 'retail-credit',
            creditLimit: 120000,
            agreedTermsDays: 15,
            invoices: [
                { invoiceId: 'INV-1061', amount: 42000, issuedDaysAgo: 12, paidDaysAgo: null },
                { invoiceId: 'INV-1039', amount: 38000, issuedDaysAgo: 33, paidDaysAgo: 18 },
            ],
        },
    ],

    seed: true,
};

export function getSeedProductById(id: string): SmeProduct | undefined {
    return SME_SEED_DATA.products.find((p) => p.id === id);
}
