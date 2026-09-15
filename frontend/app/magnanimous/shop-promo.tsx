export default function ShopPromo(){
 return <aside className="mag-shop-promo" aria-label="God Matters shop and featured book">
  <div className="mag-shop-promo-copy">
   <span>FEATURED • GOD MATTERS SHOP</span>
   <strong>Support the mission while you use Magnanimous AI.</strong>
   <small>Shop faith-centered products or purchase Jessie Hardin&apos;s book directly from Amazon.</small>
  </div>
  <div className="mag-shop-promo-actions">
   <a className="mag-shop-button" href="/shop">🛍 Shop God Matters</a>
   <a className="mag-book-button" href="https://a.co/d/02rFwv8H" target="_blank" rel="noopener noreferrer">📖 THE HOLY SPIRIT SPEAKS — Jessie Hardin</a>
  </div>
  <style>{`
   .mag-shop-promo{position:relative;z-index:60;width:100%;display:flex;align-items:center;justify-content:center;gap:22px;padding:12px 18px;border-bottom:1px solid rgba(255,214,112,.4);background:linear-gradient(90deg,#261805,#513811 42%,#12364a 100%);box-shadow:0 10px 30px rgba(0,0,0,.28);font-family:Inter,system-ui,sans-serif;color:#fff}
   .mag-shop-promo-copy{display:grid;gap:2px;max-width:620px}.mag-shop-promo-copy span{font-size:9px;letter-spacing:.18em;font-weight:950;color:#ffe08a}.mag-shop-promo-copy strong{font-size:15px;line-height:1.25}.mag-shop-promo-copy small{font-size:10px;line-height:1.4;color:#d9e9ef}
   .mag-shop-promo-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.mag-shop-promo-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:9px 12px;border-radius:10px;text-decoration:none;font-size:10px;font-weight:950;letter-spacing:.02em;white-space:nowrap;transition:transform .16s ease,box-shadow .16s ease}.mag-shop-promo-actions a:hover{transform:translateY(-1px)}.mag-shop-button{background:#fff1b7;color:#171005;box-shadow:0 5px 18px rgba(255,219,112,.22)}.mag-book-button{border:1px solid rgba(110,224,255,.55);background:#071b2b;color:#eafcff;box-shadow:0 5px 18px rgba(74,201,240,.16)}
   @media(max-width:850px){.mag-shop-promo{align-items:flex-start;justify-content:flex-start;flex-direction:column;gap:9px;padding:11px 14px}.mag-shop-promo-copy strong{font-size:13px}.mag-shop-promo-copy small{font-size:9px}.mag-shop-promo-actions{width:100%}.mag-shop-promo-actions a{flex:1 1 220px;white-space:normal;text-align:center}}
  `}</style>
 </aside>;
}
