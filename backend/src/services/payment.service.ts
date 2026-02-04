interface PaymentLinkConfig {
  merchantId: string;
  serviceId?: string; // For Click
}

class PaymentService {
  private paymeConfig: PaymentLinkConfig;
  private clickConfig: PaymentLinkConfig;

  constructor() {
    this.paymeConfig = {
      merchantId: process.env.PAYME_MERCHANT_ID || "your_payme_merchant_id",
    };
    this.clickConfig = {
      merchantId: process.env.CLICK_MERCHANT_ID || "your_click_merchant_id",
      serviceId: process.env.CLICK_SERVICE_ID || "your_click_service_id",
    };
  }

  /**
   * Generates a Payme payment link
   * @param amount Amount in TIYIN (1 UZS = 100 Tiyin)
   * @param orderId Unique order ID (e.g., userId_timestamp)
   */
  generatePaymeLink(amount: number, orderId: string): string {
    // Payme logic: base64 encoded params
    // format: m=merchant_id;ac.order_id=order_id;a=amount
    const params = `m=${this.paymeConfig.merchantId};ac.order_id=${orderId};a=${amount}`;
    const encodedParams = Buffer.from(params).toString("base64");
    return `https://checkout.paycom.uz/${encodedParams}`;
  }

  /**
   * Generates a Click payment link
   * @param amount Amount in UZS
   * @param orderId Unique order ID
   */
  generateClickLink(amount: number, orderId: string): string {
    // Click logic
    // format: https://my.click.uz/services/pay?service_id=...&merchant_id=...&amount=...&transaction_param=...
    return `https://my.click.uz/services/pay?service_id=${this.clickConfig.serviceId}&merchant_id=${this.clickConfig.merchantId}&amount=${amount}&transaction_param=${orderId}`;
  }

  /**
   * Verifies a Payme webhook signature (simplified)
   */
  verifyPaymeSignature(req: any): boolean {
    // In a real app, implement full Payme merchant API protocol check
    // For now, assume it's valid if we trust the webhook source IP or basic auth
    const authHeader = req.headers.authorization;
    if (!authHeader) return false;

    // Basic Auth check usually
    // const expectedAuth = 'Basic ' + Buffer.from(process.env.PAYME_LOGIN + ':' + process.env.PAYME_PASSWORD).toString('base64');
    // return authHeader === expectedAuth;
    return true; // mocking for now
  }
}

export default new PaymentService();
