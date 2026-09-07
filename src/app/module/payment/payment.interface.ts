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
