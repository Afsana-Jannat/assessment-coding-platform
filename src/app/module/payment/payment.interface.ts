export interface ICreateStripePayment {
  recruiterUserId: string;
  assessmentId: string;
}

export interface IStripeWebhookEvent {
  type: string;
  data: {
    object: {
      id: string;
      payment_status?: string;
      amount_total?: number;
      currency?: string;
      metadata?: {
        paymentId?: string;
        assessmentId?: string;
        recruiterId?: string;
      };
      payment_intent?: string;
    };
  };
}

export interface ICreateBkashPayment {
  recruiterUserId: string;
  assessmentId: string;
}

export interface IBkashCreatePaymentResponse {
  paymentID: string;
  bkashURL: string;
  transactionStatus?: string;
  amount?: string;
  currency?: string;
  merchantInvoiceNumber?: string;
  statusCode?: string;
  statusMessage?: string;
  callbackURL?: string;
}

export interface IBkashExecutePaymentResponse {
  paymentID?: string;
  trxID?: string;
  transactionStatus?: string;
  amount?: string;
  currency?: string;
  merchantInvoiceNumber?: string;
  statusCode?: string;
  statusMessage?: string;
}

export interface IBkashQueryPaymentResponse {
  paymentID?: string;
  trxID?: string;
  transactionStatus?: string;
  amount?: string;
  currency?: string;
  merchantInvoiceNumber?: string;
  intent?: string;
  paymentExecuteTime?: string;
  statusCode?: string;
  statusMessage?: string;
}
