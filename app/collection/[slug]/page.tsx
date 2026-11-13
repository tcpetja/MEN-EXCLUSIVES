import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PurchasePanel } from "@/components/catalog/PurchasePanel";
import { ProductCard } from "@/components/catalog/ProductCard";
import { formatPrice } from "@/lib/format";
import { PRODUCTS, PRODUCT_IMAGE_SIZE, getLine, getProduct, productImage } from "@/lib/products";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/collection/[slug]">): Promise<Metadata> {
  const product = getProduct((await params).slug);
  if (!product) return {};
  return { title: product.name, description: product.blurb };
}

export default async function ProductPage({ params }: PageProps<"/collection/[slug]">) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const line = getLine(product.line);
  const { suit } = product;
  const related = PRODUCTS.filter((p) => p.line === product.line && p.slug !== product.slug);

  return (
    <div className="mx-auto max-w-[1440px] px-gutter pt-8 pb-24">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 text-body-sm text-ash">
          <li>
            <Link href="/collection" className="flex h-11 items-center hover:text-gold-hi">
              Collection
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/collection?line=${line.id}`} className="flex h-11 items-center hover:text-gold-hi">
              {line.name}
            </Link>
          </li>
        </ol>
      </nav>

      <div className="mt-2 grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="grid gap-4 sm:grid-cols-2 lg:self-start">
          <Image
            src={productImage(product.slug)}
            alt={`${product.name}, shown full length on a tailor’s form.`}
            {...PRODUCT_IMAGE_SIZE}
            sizes="(min-width: 1024px) 28vw, (min-width: 640px) 46vw, 92vw"
            priority
            className="h-auto w-full bg-basalt"
          />
          <Image
            src={productImage(product.slug, "detail")}
            alt={`Close view of the ${suit.lapel} lapel and chest of the ${product.name}.`}
            {...PRODUCT_IMAGE_SIZE}
            sizes="(min-width: 1024px) 28vw, (min-width: 640px) 46vw, 92vw"
            priority
            className="h-auto w-full bg-basalt"
          />
        </div>

        <div className="lg:sticky lg:top-[calc(var(--spacing-header)+2rem)] lg:self-start">
          <p className="type-label text-gold">{line.name}</p>
          <h1 className="type-display mt-2 text-display-md">{product.name}</h1>
          <p className="tabular mt-3 text-body-lg text-chalk">{formatPrice(product.price)}</p>
          <p className="mt-5 max-w-[52ch] text-body text-ash">{product.blurb}</p>

          <Suspense fallback={<p className="mt-8 text-body-sm text-ash">Loading sizes…</p>}>
            <PurchasePanel product={product} />
          </Suspense>

          <h2 className="type-display mt-10 border-t border-line pt-6 text-display-sm">Make &amp; Cloth</h2>
          <ul className="mt-3 grid gap-1.5 text-body-sm text-ash">
            {product.details.map((detail) => (
              <li key={detail} className="tabular">
                {detail}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-body-sm text-ash">
            Want a different lapel or cloth?{" "}
            <Link
              href={`/bespoke?cloth=${suit.cloth}&lapel=${suit.lapel}&buttons=${suit.buttons}&finish=${suit.buttonFinish}`}
              className="link"
            >
              Restyle this suit in 3D
            </Link>
            .
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-24 border-t border-line pt-12">
          <h2 id="related-heading" className="type-display text-display-md">
            More From the {line.name} Line
          </h2>
          <ul className="mt-10 grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
