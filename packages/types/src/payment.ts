export interface PaymentTransactionPayload {
  orderId: string;
  orderNumber: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
}

export interface PaymentTransactionResponse {
  token: string;
  redirectUrl: string;
}

export interface MidtransWebhookBody {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  gross_amount: string;
  fraud_status?: string;
  settlement_time?: string;
}

export interface IPaymentService {
  createTransaction(payload: PaymentTransactionPayload): Promise<PaymentTransactionResponse>;
  verifySignature(notification: MidtransWebhookBody): boolean;
  parseStatus(notification: MidtransWebhookBody): {
    isSuccess: boolean;
    isPending: boolean;
    isFailed: boolean;
    paymentMethod: string;
  };
}
