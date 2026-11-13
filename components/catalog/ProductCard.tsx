import Image from "next/image";
import Link from "next/link";
import { getCloth } from "@/components/suit/config";
import { formatPrice } from "@/lib/format";
import { PRODUCT_IMAGE_SIZE, getLine, productImage, type Product } from "@/lib/products";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return (
    <Link href={`/collection/${product.slug}`} className="group block">
      <div className="overflow-hidden bg-basalt">
        <Image
          src={productImage(product.slug)}
          alt={`${product.name} on a tailor’s form.`}
          {...PRODUCT_IMAGE_SIZE}
          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 92vw"
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className="h-auto w-full transition-transform duration-[420ms] ease-cut group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="type-label text-gold">{getLine(product.line).name}</p>
          <h3 className="type-display mt-1 text-display-sm text-chalk group-hover:text-gold-hi">
            {product.name}
          </h3>
          <p className="mt-1 text-body-sm text-ash">{getCloth(product.suit.cloth).name}</p>
        </div>
        <p className="tabular pt-5 text-body text-chalk">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product, i) => (
        <li key={product.slug}>
          <ProductCard product={product} priority={i < 3} />
        </li>
      ))}
    </ul>
  );
}
