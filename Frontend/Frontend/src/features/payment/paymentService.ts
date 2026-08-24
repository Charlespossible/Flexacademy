import { api } from '@/lib/axios';
import type { ApiSuccess } from '@/types';

export interface CheckoutResult {
  checkoutLink: string;
  orderReference: string;
  planId: string;
  /** Echoed back so the client can confirm what is about to be charged. */
  amountKobo: number;
}

export interface VerifyResult {
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

export const paymentService = {
  /**
   * The server prices the plan from its own config — only the plan id is sent,
   * never an amount, so a tampered request cannot change what is charged.
   */
  async initiateCheckout(planId: string): Promise<CheckoutResult> {
    const res = await api.post<ApiSuccess<CheckoutResult>>('/payments/checkout', { planId });
    return res.data.data;
  },

  async verifyPayment(reference: string): Promise<VerifyResult> {
    const res = await api.get<ApiSuccess<VerifyResult>>(`/payments/verify/${reference}`);
    return res.data.data;
  },
};
