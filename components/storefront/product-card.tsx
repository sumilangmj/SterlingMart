import Image from "next/image";
import Link from "next/link";
import { FavoriteButton } from "@/components/storefront/favorite-button";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product, onQuickView }: { product: Product; onQuickView?: () => void }) {
  return (
    <article className="product-card" data-scroll-reveal="product">
      <div className="product-image-wrap">
        <Link className={`product-image product-image-${product.accent}`} href={`/products/${product.slug}`}>
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
          />
          <span className="product-category">{product.category}</span>
        </Link>
        <FavoriteButton productId={product._id} />
        {onQuickView && <button className="quick-view-button" type="button" onClick={onQuickView}>Quick view <span aria-hidden="true">↗</span></button>}
      </div>
      <div className="product-card-copy">
        <div>
          <h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3>
          <p>{product.material ?? product.description}</p>
        </div>
        <div className="product-card-price">
          <span className="product-price">{formatPrice(product.priceCents)}</span>
          {product.rating && <span className="product-rating" aria-label={`${product.rating} out of 5 stars`}>★ {product.rating}</span>}
        </div>
      </div>
    </article>
  );
}
