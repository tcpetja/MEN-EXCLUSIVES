import { PRODUCTS } from "@/lib/products";

/** The catalogue as JSON. Used by `npm run render:stills`. */
export async function GET() {
  return Response.json(PRODUCTS.map(({ slug, name, line, price, suit }) => ({ slug, name, line, price, suit })));
}
