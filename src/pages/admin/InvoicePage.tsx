import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getInvoice } from '@/services/invoices';
import { getDraftSettings } from '@/services/settings';
import type { SettingsDraft } from '@/types';
import { numberToWords } from '@/utils/numberToWords';

function money(value: number) {
  return value.toLocaleString('fa-IR') + ' ریال';
}





export function InvoicePage() {

  const { id } = useParams();


  const [invoice, setInvoice] = useState<any>(null);
const [settings, setSettings] = useState<SettingsDraft | null>(null);
  const [loading, setLoading] = useState(true);



  useEffect(() => {

    async function loadInvoice() {

      if (!id) return;


      try {

        const data = await getInvoice(id);

        setInvoice(data);

        const settingsData = await getDraftSettings();

setSettings(settingsData);

      } catch (error) {

        console.error(error);


      } finally {

        setLoading(false);

      }

    }


    void loadInvoice();


  }, [id]);





  if (loading) {

    return (

      <div className="p-10 text-center">

        در حال دریافت فاکتور...

      </div>

    );

  }





  if (!invoice) {

    return (

      <div className="p-10 text-center">

        فاکتور پیدا نشد

      </div>

    );

  }





  const subtotal = invoice.items.reduce(

    (sum: number, item: any) =>

      sum + item.total,

    0

  );



  const finalAmount =

    subtotal - (invoice.discount || 0);




  return (

    <>

      <style>

        {`

        @page {

          size: A5 portrait;

          margin: 10mm;

        }


       @media print {

  body {
    margin: 0;
    padding: 0;
    background: white;
  }


  body * {
    visibility: hidden;
  }


  .invoice-print,
  .invoice-print * {
    visibility: visible;
  }


  .invoice-print {

    position: absolute;

    right: 0;
    top: 0;

    width: 148mm;
    min-height: 210mm;

    box-shadow: none !important;

    margin: 0;

    padding: 10mm;

  }


  table {

    page-break-inside: avoid;

  }


  tr {

    page-break-inside: avoid;

    page-break-after: auto;

  }


  .no-print {

    display: none !important;

  }

}

        `}

      </style>
            <div className="no-print mb-4 flex justify-end">

        <button

          onClick={() => window.print()}

          className="rounded-lg bg-indigo-600 px-5 py-2 text-white"

        >

          چاپ فاکتور

        </button>

      </div>



      <div

        dir="rtl"

        className="invoice-print mx-auto w-[148mm] min-h-[210mm] bg-white p-5 text-sm"

      >



        {/* Header */}

        <div className="border-b pb-4 text-center">


{settings?.showLogo && settings?.logoUrl && (
  <img
    src={settings.logoUrl}
    alt="logo"
    className="mx-auto mb-3 h-16 object-contain"
  />
)}

          <h1 className="text-xl font-bold">
  {settings?.invoiceStoreName || settings?.brandName || 'فروشگاه'}
</h1>


          <div className="mt-2">

            فاکتور فروش

          </div>

          {settings?.invoicePhone && (
  <div className="mt-1 text-xs">
    تلفن: {settings.invoicePhone}
  </div>
)}

{settings?.invoiceAddress && (
  <div className="mt-1 text-xs">
    آدرس: {settings.invoiceAddress}
  </div>
)}


        </div>





        {/* Invoice info */}

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border p-3">


          <div>

            شماره فاکتور:

            {' '}

            {invoice.invoice_number || '-'}

          </div>


          <div>

            تاریخ:

            {' '}

            {new Date(invoice.created_at).toLocaleDateString('fa-IR')}

          </div>


          <div>

            شماره مشتری:

            {' '}

            {invoice.customer_number || '-'}

          </div>


          <div>

            تماس:

            {' '}

            {invoice.customer_phone || '-'}

          </div>


        </div>





        {/* Customer */}

        <div className="mt-4 rounded-lg border p-3">


          <div className="mb-2 font-bold">

            صورتحساب:

          </div>


          <div>

            {invoice.customer_name || '-'}

          </div>



          <div className="mt-2">

            آدرس پروژه:

            {' '}

            {invoice.project_address || '-'}

          </div>


        </div>





        {/* Items */}


        <table className="mt-5 w-full border-collapse border text-center">


          <thead>


            <tr className="bg-slate-100">


              <th className="border p-2">

                ردیف

              </th>


              <th className="border p-2">

                شرح کالا

              </th>


              <th className="border p-2">

                تعداد

              </th>


              <th className="border p-2">

                مبلغ واحد

              </th>


              <th className="border p-2">

                تخفیف

              </th>


              <th className="border p-2">

                مبلغ کل

              </th>


            </tr>


          </thead>



          <tbody>


            {invoice.items.map(

              (item:any,index:number)=>(


                <tr key={item.id || index}>


                  <td className="border p-2">

                    {index + 1}

                  </td>


                  <td className="border p-2 text-right">

                    {item.name}

                  </td>


                  <td className="border p-2">

                    {item.quantity}

                  </td>


                  <td className="border p-2">

                    {money(item.price)}

                  </td>


                  <td className="border p-2">

                    {money(item.discount)}

                  </td>


                  <td className="border p-2">

                    {money(item.total)}

                  </td>


                </tr>


              )

            )}


          </tbody>


        </table>
                {/* Totals */}

        <div className="mt-5 mr-auto w-72 space-y-2 rounded-lg border p-3">


          <div className="flex justify-between">

            <span>
              جمع کل:
            </span>

            <span>
              {money(subtotal)}
            </span>

          </div>



          <div className="flex justify-between">

            <span>
              تخفیف:
            </span>

            <span>
              {money(invoice.discount || 0)}
            </span>

          </div>



          <div className="flex justify-between border-t pt-2 font-bold">

            <span>
              مبلغ نهایی:
            </span>


            <span>
              {money(finalAmount)}
            </span>

          </div>


        </div>





        {/* Amount words */}


        <div className="mt-4 rounded-lg border p-3">


          <div className="font-bold">

            مبلغ به حروف:

          </div>


          <div className="mt-2">

            {numberToWords(finalAmount)} ریال

          </div>


        </div>





        {/* Description */}


        <div className="mt-4 min-h-20 rounded-lg border p-3">


          <div className="font-bold">

            توضیحات:

          </div>


          <div className="mt-2">

            {invoice.description || '-'}

          </div>


        </div>



<div className="mt-6 text-center text-xs text-slate-600">

  {settings?.invoiceFooterText || 'با تشکر از خرید شما'}

</div>

        {/* Signature */}


        <div className="mt-10 flex justify-between text-sm">


          <div>

            مهر و امضا فروشنده

          </div>


          <div>

            امضا مشتری

          </div>


        </div>



      </div>


    </>

  );

}