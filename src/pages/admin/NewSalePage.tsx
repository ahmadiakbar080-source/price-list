import { useEffect, useMemo, useState } from 'react';
import { listProducts } from '@/services/products';
import { createSale } from '@/services/sales';
import type { Product } from '@/types';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';


type CartItem = {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
};


export function NewSalePage() {

  const toast = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [discount, setDiscount] = useState(0);

  const [loading, setLoading] = useState(false);


  useEffect(() => {
    void loadProducts();
  }, []);


  async function loadProducts() {
    try {
      setProducts(await listProducts());
    } catch {
      toast.error('خطا در دریافت محصولات');
    }
  }


  function addProduct(product: Product) {

    const exists = cart.find(
      x => x.product_id === product.id
    );

    if (exists) {

      setCart(cart.map(item =>
        item.product_id === product.id
          ? {
              ...item,
              quantity: item.quantity + 1
            }
          : item
      ));

      return;
    }


    setCart([
      ...cart,
      {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        stock: product.stock_quantity,
      }
    ]);
  }


  function changeQuantity(
    id: string,
    value: number
  ) {

    setCart(cart.map(item =>
      item.product_id === id
        ? {
            ...item,
            quantity: Math.max(1, value)
          }
        : item
    ));
  }


  function removeItem(id: string) {

    setCart(
      cart.filter(
        item => item.product_id !== id
      )
    );
  }


  const subtotal = useMemo(() =>
    cart.reduce(
      (sum,item)=>
        sum + item.price * item.quantity,
      0
    ),
    [cart]
  );


  const total = Math.max(
    0,
    subtotal - discount
  );


  async function submitSale() {

    if (!customerName.trim()) {
      toast.error('نام مشتری الزامی است');
      return;
    }


    if (!cart.length) {
      toast.error('محصولی انتخاب نشده');
      return;
    }


    try {

      setLoading(true);


      await createSale({

        customer_name:
          customerName,

        customer_phone:
          phone,

        project_address:
          address,

        discount,

        items:
          cart.map(item=>({
            product_id:
              item.product_id,

            quantity:
              item.quantity
          }))
      });


      toast.success(
        'فروش با موفقیت ثبت شد'
      );


      setCart([]);
      setCustomerName('');
      setPhone('');
      setAddress('');
      setDiscount(0);

      await loadProducts();


    } catch(e:any){

      toast.error(
        e.message || 'خطا در ثبت فروش'
      );

    } finally {

      setLoading(false);

    }

  }



  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-slate-800">
        ثبت فروش جدید
      </h1>


      <div className="grid gap-4 rounded-2xl bg-white p-5 shadow">

        <input
          className="rounded-lg border p-3"
          placeholder="نام مشتری"
          value={customerName}
          onChange={e=>setCustomerName(e.target.value)}
        />


        <input
          className="rounded-lg border p-3"
          placeholder="شماره تماس"
          value={phone}
          onChange={e=>setPhone(e.target.value)}
        />


        <textarea
          className="rounded-lg border p-3"
          placeholder="آدرس پروژه"
          value={address}
          onChange={e=>setAddress(e.target.value)}
        />

      </div>



      <div className="rounded-2xl bg-white p-5 shadow">

        <h2 className="mb-4 font-bold">
          انتخاب محصول
        </h2>


        <div className="grid gap-3 md:grid-cols-3">

          {products.map(product=>(

            <button
              key={product.id}
              onClick={()=>addProduct(product)}
              className="rounded-xl border p-4 text-right hover:bg-slate-50"
            >

              <div className="font-bold">
                {product.name}
              </div>


              <div className="text-sm text-slate-500">
                موجودی:
                {' '}
                {product.stock_quantity}
              </div>


              <div className="text-indigo-600">
                {product.price.toLocaleString()}
                {' '}
                تومان
              </div>


            </button>

          ))}

        </div>

      </div>




      <div className="rounded-2xl bg-white p-5 shadow">

        <h2 className="mb-4 font-bold">
          سبد فروش
        </h2>


        {cart.map(item=>(

          <div
            key={item.product_id}
            className="mb-3 flex items-center justify-between border-b pb-3"
          >

            <div>
              <b>{item.name}</b>
              <div className="text-sm text-slate-500">
                {item.price.toLocaleString()} تومان
              </div>
            </div>


            <input
              type="number"
              min="1"
              className="w-20 rounded border p-2"
              value={item.quantity}
              onChange={e=>
                changeQuantity(
                  item.product_id,
                  Number(e.target.value)
                )
              }
            />


            <button
              className="text-red-600"
              onClick={()=>
                removeItem(item.product_id)
              }
            >
              حذف
            </button>


          </div>

        ))}


        <div className="mt-4 space-y-2">

          <div>
            جمع:
            {' '}
            {subtotal.toLocaleString()}
            {' '}
            تومان
          </div>


          <input
            className="rounded border p-2"
            type="number"
            placeholder="تخفیف"
            value={discount}
            onChange={e=>
              setDiscount(
                Number(e.target.value)
              )
            }
          />


          <div className="font-bold">
            مبلغ نهایی:
            {' '}
            {total.toLocaleString()}
            {' '}
            تومان
          </div>


        </div>


      </div>



      <Button
        disabled={loading}
        onClick={()=>void submitSale()}
      >
        {loading
          ? 'در حال ثبت...'
          : 'ثبت فروش'}
      </Button>


    </div>
  );
}