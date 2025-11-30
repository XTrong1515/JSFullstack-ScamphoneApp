// VietQR API Configuration
export const VIETQR_CONFIG = {
  // API Endpoint
  endpoint: 'https://api.vietqr.io/v2/generate',
  
  // Authentication Headers
  headers: {
    'x-client-id': 'cc13ac33-b798-4a13-961b-2644b64bdb73',
    'x-api-key': '3fa7c991-3197-406b-b64d-3b91f91db062',
    'Content-Type': 'application/json'
  },
  
  // Bank Account Information (Demo)
  bankAccount: {
    acqId: '970422',        // MB Bank
    accountNo: '0333666999', // Account Number
    accountName: 'NGUYEN VAN A'
  }
};
