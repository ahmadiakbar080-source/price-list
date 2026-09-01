import { useEffect, useState } from 'react';
import { listSales } from '@/services/sales';
import type { Sale } from '@/types';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';

function formatMoney(value: number) {
  return value.toLocaleString('fa-IR') + ' تومان';
}


export function SalesPage() {

  const toast = useToast();
const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    void loadSales();
  }, []);


  async function loadSales() {

    try {

      setLoading(true);

      setSales(
        await listSales()
      );

    } catch {

      toast.error(
        'خطا در دریافت فروش‌ها'
      );

    } finally {

      setLoading(false);

    }
  }



  if (loading) {

    return (
      <div className="rounded-xl bg-white p-6 shadow">
        در حال دریافت فروش‌ها...
      </div>
    );

  }



  return (

    <div className="space-y-6">


      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          فروش‌ها
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          مشاهده فروش‌های ثبت شده و سود هر معامله
        </p>
      </div>



      <div className="overflow-hidden rounded-2xl bg-white shadow">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-slate-100">

              <tr>

                <th className="p-4 text-right">
                  مشتری
                </th>

                <th className="p-4 text-right">
                  مبلغ فروش
                </th>

                <th className="p-4 text-right">
                  تخفیف
                </th>

                <th className="p-4 text-right">
                  سود
                </th>

                <th className="p-4 text-right">
                  تاریخ
                </th>

                <th className="p-4 text-right">
  عملیات
</th>

              </tr>

            </thead>


            <tbody>

              {sales.map((sale)=>(

                <tr
                  key={sale.id}
                  className="border-b"
                >

                  <td className="p-4">

                    <div className="font-semibold">
                      {sale.customer_name}
                    </div>

                    {sale.customer_phone && (
                      <div className="text-xs text-slate-500">
                        {sale.customer_phone}
                      </div>
                    )}

                  </td>



                  <td className="p-4">
                    {formatMoney(sale.total)}
                  </td>


                  <td className="p-4">
                    {formatMoney(sale.discount)}
                  </td>


                  <td className="p-4 font-bold text-emerald-600">
                    {formatMoney(sale.total_profit)}
                  </td>


                  <td className="p-4 text-slate-500">
                    {new Date(
                      sale.created_at
                    ).toLocaleDateString('fa-IR')}
                  </td>

<td className="p-4">

  <button

    onClick={() =>
      navigate(`/admin/invoice/${sale.id}`)
    }

    className="rounded-lg bg-indigo-600 px-3 py-2 text-xs text-white hover:bg-indigo-700"

  >

    🧾 صدور فاکتور

  </button>

</td>

                </tr>

              ))}


              {!sales.length && (

                <tr>

                  <td
                    colSpan={6}
                    className="p-8 text-center text-slate-500"
                  >
                    هنوز فروشی ثبت نشده است
                  </td>

                </tr>

              )}

            </tbody>


          </table>

        </div>

      </div>


    </div>

  );
}