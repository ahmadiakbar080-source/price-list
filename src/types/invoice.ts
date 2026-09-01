export interface InvoiceItem {
  id: string;

  name: string;          // شرح کالا

  quantity: number;      // تعداد

  unitPrice: number;     // مبلغ واحد

  discount: number;      // تخفیف ردیف

  total: number;         // مبلغ کل ردیف
}



export interface InvoiceCustomer {

  customerNumber: string; // شماره مشتری 001،002...

  name: string;           // صورتحساب به نام

  phone: string;          // شماره تماس

  address: string;        // آدرس پروژه

}



export interface InvoiceSeller {

  shopName: string;

  logo?: string;

  phone?: string;

  address?: string;

}



export interface Invoice {

  id: string;


  invoiceNumber: string; // شماره فاکتور خودکار

  date: string;


  seller: InvoiceSeller;


  customer: InvoiceCustomer;



  items: InvoiceItem[];



  subtotal: number;       // جمع اقلام


  discount: number;       // تخفیف کل


  total: number;          // مبلغ نهایی



  amountInWords: string;  // مبلغ به حروف ریال



  description?: string;   // توضیحات


}