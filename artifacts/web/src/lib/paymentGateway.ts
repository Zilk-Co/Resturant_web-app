// Payment Gateway Configuration
// Replace these with your actual merchant credentials when ready

export const PAYMENT_CONFIG = {
  easypaisa: {
    merchantId: "", // Your EasyPaisa Merchant ID
    publicKey: "", // Your EasyPaisa Public Key
    privateKey: "", // Your EasyPaisa Private Key
    apiUrl: "https://sandbox.easypaisa.com.pk", // Sandbox URL - change to production when live
    returnURL: window.location.origin + "/payment/return",
  },
  jazzcash: {
    merchantId: "", // Your JazzCash Merchant ID
    password: "", // Your JazzCash Password
    integritySalt: "", // Your JazzCash Integrity Salt
    returnUrl: window.location.origin + "/payment/return",
    apiUrl: "https://sandbox.jazzcash.com.pk", // Sandbox URL - change to production when live
  },
};

export interface PaymentInitData {
  orderId: string;
  amount: number;
  phone: string;
  email?: string;
  description?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  orderId: string;
  amount: number;
  method: string;
  status: "completed" | "pending" | "failed";
  error?: string;
}

// EasyPaisa Payment
export async function initiateEasyPaisaPayment(data: PaymentInitData): Promise<PaymentResult> {
  if (!PAYMENT_CONFIG.easypaisa.merchantId) {
    return {
      success: false,
      orderId: data.orderId,
      amount: data.amount,
      method: "easypaisa",
      status: "failed",
      error: "EasyPaisa merchant account not configured. Please use Cash on Delivery.",
    };
  }

  try {
    // In production, this calls your backend which integrates with EasyPaisa API
    const response = await fetch("/api/payment/easypaisa/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success && result.paymentUrl) {
      // Redirect to EasyPaisa payment page
      window.location.href = result.paymentUrl;
      return {
        success: true,
        orderId: data.orderId,
        amount: data.amount,
        method: "easypaisa",
        status: "pending",
        transactionId: result.transactionId,
      };
    }

    return {
      success: false,
      orderId: data.orderId,
      amount: data.amount,
      method: "easypaisa",
      status: "failed",
      error: result.error || "Payment initiation failed",
    };
  } catch {
    return {
      success: false,
      orderId: data.orderId,
      amount: data.amount,
      method: "easypaisa",
      status: "failed",
      error: "Network error. Please try again.",
    };
  }
}

// JazzCash Payment
export async function initiateJazzCashPayment(data: PaymentInitData): Promise<PaymentResult> {
  if (!PAYMENT_CONFIG.jazzcash.merchantId) {
    return {
      success: false,
      orderId: data.orderId,
      amount: data.amount,
      method: "jazzcash",
      status: "failed",
      error: "JazzCash merchant account not configured. Please use Cash on Delivery.",
    };
  }

  try {
    // In production, this calls your backend which integrates with JazzCash API
    const response = await fetch("/api/payment/jazzcash/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success && result.paymentUrl) {
      // Redirect to JazzCash payment page
      window.location.href = result.paymentUrl;
      return {
        success: true,
        orderId: data.orderId,
        amount: data.amount,
        method: "jazzcash",
        status: "pending",
        transactionId: result.transactionId,
      };
    }

    return {
      success: false,
      orderId: data.orderId,
      amount: data.amount,
      method: "jazzcash",
      status: "failed",
      error: result.error || "Payment initiation failed",
    };
  } catch {
    return {
      success: false,
      orderId: data.orderId,
      amount: data.amount,
      method: "jazzcash",
      status: "failed",
      error: "Network error. Please try again.",
    };
  }
}

// Card Payment (Stripe-like or local card gateway)
export async function initiateCardPayment(data: PaymentInitData & { cardNumber: string; cardExpiry: string; cardCvv: string; cardName: string }): Promise<PaymentResult> {
  try {
    const response = await fetch("/api/payment/card/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    return {
      success: result.success,
      orderId: data.orderId,
      amount: data.amount,
      method: "card",
      status: result.success ? "completed" : "failed",
      transactionId: result.transactionId,
      error: result.error,
    };
  } catch {
    return {
      success: false,
      orderId: data.orderId,
      amount: data.amount,
      method: "card",
      status: "failed",
      error: "Network error. Please try again.",
    };
  }
}
