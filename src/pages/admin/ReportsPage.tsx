import { useEffect, useMemo, useState } from 'react';
import { listSales } from '@/services/sales';
import type { Sale } from '@/types';
import { useToast } from '@/hooks/useToast';


function money(value: number) {
  return value.toLocaleString('fa-IR') + ' تومان';
}


export function ReportsPage() {

  const toast = useToast();

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    void load();
  }, []);


  async function load() {

    try {

      setSales(
        await listSales()
      );

    } catch {

      toast.error(
        'خطا در دریافت گزارش'
      );

    } finally {

      setLoading(false);

    }
  }


  const stats = useMemo(() => {

    return {

      totalSales:
        sales.reduce(
          (sum, sale) =>
            sum + sale.total,
          0
        ),


      totalCost:
        sales.reduce(
          (sum, sale) =>
            sum + sale.total_cost,
          0
        ),


      totalProfit:
        sales.reduce(
          (sum, sale) =>
            sum + sale.total_profit,
          0
        ),


      count:
        sales.length,

    };

  }, [sales]);



  if (loading) {

    return (
      <div className="rounded-xl bg-white p-6 shadow">
        در حال آماده‌سازی گزارش...
      </div>
    );

  }



  return (

    <div className="space-y-6">


      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          گزارش سود و زیان
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          خلاصه عملکرد مالی فروش‌ها
        </p>
      </div>



      <div className="grid gap-4 md:grid-cols-4">


        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="text-sm text-slate-500">
            مجموع فروش
          </div>

          <div className="mt-2 text-xl font-bold text-indigo-600">
            {money(stats.totalSales)}
          </div>
        </div>



        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="text-sm text-slate-500">
            هزینه خرید
          </div>

          <div className="mt-2 text-xl font-bold text-slate-700">
            {money(stats.totalCost)}
          </div>
        </div>



        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="text-sm text-slate-500">
            سود خالص
          </div>

          <div className="mt-2 text-xl font-bold text-emerald-600">
            {money(stats.totalProfit)}
          </div>
        </div>



        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="text-sm text-slate-500">
            تعداد فروش
          </div>

          <div className="mt-2 text-xl font-bold">
            {stats.count.toLocaleString('fa-IR')}
          </div>
        </div>


      </div>



      <div className="rounded-2xl bg-white p-5 shadow">

        <h2 className="mb-4 font-bold">
          آخرین فروش‌ها
        </h2>


        <div className="space-y-3">

          {sales.slice(0, 10).map((sale)=>(

            <div
              key={sale.id}
              className="flex items-center justify-between border-b pb-3"
            >

              <div>
                <div className="font-semibold">
                  {sale.customer_name}
                </div>

                <div className="text-xs text-slate-500">
                  {new Date(
                    sale.created_at
                  ).toLocaleDateString('fa-IR')}
                </div>
              </div>


              <div className="text-left">

                <div>
                  {money(sale.total)}
                </div>

                <div className="text-sm font-bold text-emerald-600">
                  سود:
                  {' '}
                  {money(sale.total_profit)}
                </div>

              </div>

            </div>

          ))}


          {!sales.length && (
            <div className="text-center text-slate-500">
              هنوز فروشی ثبت نشده است
            </div>
          )}

        </div>

      </div>


    </div>

  );
}