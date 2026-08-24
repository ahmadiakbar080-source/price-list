import { onRequest as __api_products_ts_onRequest } from "D:\\price-list\\functions\\api\\products.ts"

export const routes = [
    {
      routePath: "/api/products",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_products_ts_onRequest],
    },
  ]