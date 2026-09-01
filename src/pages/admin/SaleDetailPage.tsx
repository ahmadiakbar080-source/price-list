import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSale } from '@/services/sales';
import { useToast } from '@/hooks/useToast';
import type { Sale } from '@/types';


function money(value: number) {
  return value.toLocaleString('fa-IR') + ' تومان';
}


export function SaleDetailPage() {

  const { id } = useParams();

  const toast = useToast();

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);



  useEffect(() => {

    if (id) {
      void loadSale(id);
    }

  }, [id]);



  async function loadSale(saleId: string) {

    try {

      setSale(
        await getSale(saleId)
      );

    } catch {

      toast.error(
        'خطا در دریافت جزئیات فروش'
      );

    } finally {

      setLoading(false);

    }
  }



  if (loading) {

    return (
      <div className="rounded-xl bg-white p-6 shadow">
        در حال دریافت اطلاعات...
      </div>
    );

  }



  if (!sale) {

    return (
      <div className="rounded-xl bg-white p-6 shadow">
        فروش پیدا نشد
      </div>
    );

  }



  return (

    <div className="space-y-6">


      <h1 className="text-2xl font-bold text-slate-800">
        جزئیات فروش
      </h1>



      <div className="rounded-2xl bg-white p-5 shadow space-y-3">

        <h2 className="font-bold">
          اطلاعات مشتری
        </h2>


        <div>
          نام:
          {' '}
          {sale.customer_name}
        </div>


        <div>
          شماره:
          {' '}
          {sale.customer_phone || '-'}
        </div>


        <div>
          آدرس پروژه:
          {' '}
          {sale.project_address || '-'}
        </div>


        <div>
          تاریخ:
          {' '}
          {new Date(
            sale.created_at
          ).toLocaleDateString('fa-IR')}
        </div>


      </div>




      <div className="rounded-2xl bg-white p-5 shadow">

        <h2 className="mb-4 font-bold">
          خلاصه مالی
        </h2>


        <div className="space-y-2">

          <div>
            مبلغ فروش:
            {' '}
            {money(sale.total)}
          </div>


          <div>
            تخفیف:
            {' '}
            {money(sale.discount)}
          </div>


          <div>
            هزینه خرید:
            {' '}
            {money(sale.total_cost)}
          </div>


          <div className="font-bold text-emerald-600">
            سود:
            {' '}
            {money(sale.total_profit)}
          </div>

        </div>

      </div>




      <div className="rounded-2xl bg-white p-5 shadow">

        <h2 className="mb-4 font-bold">
          کالاهای فروش
        </h2>


        <div className="text-slate-500">
          جزئیات اقلام فروش در مرحله اتصال آیتم‌ها اضافه می‌شود.
        </div>


      </div>


    </div>

  );

}