const STORE_URL='https://gh9171-jy.myshopify.com';

const products=[
 {name:'Christian Scripture Ring',image:'https://file.zendrop.com/products/5b/69/dc6c0d8f4cb3b10ea1f676816308_import.webp',type:'Faith Jewelry'},
 {name:'Christian Cross Necklace',image:'https://file.zendrop.com/products/c2/55/946375624119950d1496f601387d_import.webp',type:'Faith Jewelry'},
 {name:'Prayer Hands Pendant Necklace',image:'https://file.zendrop.com/products/06/72/3f1830314fc686e6a8f4d8ed7f9b_import.webp',type:'Faith Jewelry'}
];

export default function Shop(){
 return <main className="shop">
  <header>
   <a className="brand" href="/"><span>♛</span><div><b>GOD MATTERS</b><small>I AM MAGNANIMOUS WAY™</small></div></a>
   <nav><a href="/">Home</a><a className="active" href="/shop">Shop</a><a href="/bible-study">Bible Study</a><a href="/support">Ministry & Support</a></nav>
  </header>

  <section className="hero">
   <small>GOD MATTERS MARKETPLACE</small>
   <h1>Faith-centered goods.<br/><span>One ministry marketplace.</span></h1>
   <p>Shop Christian gifts, faith jewelry, print-on-demand ministry designs and more as the God Matters marketplace grows.</p>
   <div className="actions"><a className="primary" href={STORE_URL} target="_blank" rel="noopener noreferrer">Shop God Matters →</a><a href="#featured">View Featured Products</a></div>
  </section>

  <section id="featured" className="featured">
   <div className="title"><small>FEATURED NOW</small><h2>Christian Jewelry</h2><p>These products are connected to supplier fulfillment through the God Matters Shopify store.</p></div>
   <div className="grid">{products.map(p=><article key={p.name}><div className="image"><img src={p.image} alt={p.name}/></div><small>{p.type}</small><h3>{p.name}</h3><a href={STORE_URL} target="_blank" rel="noopener noreferrer">Open in God Matters Store →</a></article>)}</div>
  </section>

  <section className="categories">
   <small>COMING INTO THE MARKETPLACE</small><div className="catgrid"><div><b>✝</b><span>Faith Apparel</span></div><div><b>▤</b><span>Prayer Journals</span></div><div><b>◇</b><span>Bible Study Tools</span></div><div><b>♛</b><span>Christian Gifts</span></div><div><b>⌂</b><span>Faith Home</span></div><div><b>♡</b><span>Family & Ministry</span></div></div>
  </section>

  <section className="mission"><small>MINISTRY + MARKETPLACE</small><h2>ONE GOD • ONE PEOPLE • A BRIGHTER TOMORROW</h2><p>God Matters brings ministry, useful faith-centered products and original I AM MAGNANIMOUS WAY™ designs together in one place.</p><a href={STORE_URL} target="_blank" rel="noopener noreferrer">Enter the Shop →</a></section>

  <footer><a href="/">♛ I AM MAGNANIMOUS WAY™</a><span>God Matters Marketplace</span></footer>

  <style>{`
   *{box-sizing:border-box}html{scroll-behavior:smooth}.shop{min-height:100vh;background:#031129;color:#edfaff;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 78% 8%,rgba(32,177,255,.18),transparent 30%),linear-gradient(180deg,#03132f,#020b1e 82%)}
   header{height:82px;padding:0 5vw;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1c82b5;background:rgba(2,15,38,.96);position:sticky;top:0;z-index:10}.brand{display:flex;gap:12px;align-items:center;color:#fff;text-decoration:none}.brand>span{font-size:34px;color:#ffd36e}.brand div{display:grid}.brand b{font-size:19px;letter-spacing:.04em}.brand small{font-size:9px;color:#67ddff;letter-spacing:.11em}nav{display:flex;gap:20px}nav a{color:#b5d8e8;text-decoration:none;font-size:12px;font-weight:800}nav a:hover,nav .active{color:#64e8ff}
   .hero{min-height:520px;padding:100px 8vw 80px;display:flex;flex-direction:column;justify-content:center;border-bottom:1px solid #1e638d;background:radial-gradient(circle at 72% 45%,rgba(60,204,255,.18),transparent 27%)}.hero>small,.featured .title>small,.categories>small,.mission>small{font-size:10px;letter-spacing:.22em;color:#68e7ff;font-weight:900}.hero h1{font-size:clamp(48px,7vw,86px);line-height:.92;letter-spacing:-.045em;margin:14px 0 24px;max-width:940px}.hero h1 span{background:linear-gradient(90deg,#7af5ff,#5bc9ff,#c09aff);-webkit-background-clip:text;color:transparent}.hero p{max-width:700px;font-size:17px;line-height:1.65;color:#c7e2ed}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}.actions a,.mission a{padding:13px 18px;border:1px solid #48d8ff;border-radius:10px;color:#effcff;text-decoration:none;font-size:12px;font-weight:900;background:#071d3c}.actions .primary,.mission a{background:linear-gradient(90deg,#49ece6,#7be4ff);color:#041322;border:0}
   .featured{padding:70px 7vw}.featured .title{max-width:720px}.featured h2,.mission h2{font-size:38px;margin:8px 0 10px}.featured .title p,.mission p{color:#a8c8d9;line-height:1.6}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:34px}.grid article{border:1px solid #1e6e99;border-radius:16px;padding:14px;background:linear-gradient(145deg,#071a37,#052648);box-shadow:0 18px 50px rgba(0,0,0,.2)}.image{height:310px;border-radius:12px;overflow:hidden;background:#07111f;display:grid;place-items:center}.image img{width:100%;height:100%;object-fit:cover}.grid article>small{display:block;color:#69dfff;font-size:9px;letter-spacing:.14em;margin-top:14px}.grid h3{font-size:18px;margin:7px 0 16px}.grid article>a{color:#83e9ff;font-size:11px;font-weight:900;text-decoration:none}
   .categories{padding:40px 7vw 75px}.catgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px}.catgrid div{border:1px solid #1a5276;background:#061831;border-radius:12px;padding:24px;display:flex;align-items:center;gap:14px}.catgrid b{font-size:24px;color:#65e5ff}.catgrid span{font-weight:850}
   .mission{margin:10px 7vw 70px;padding:48px;border:1px solid #28648a;border-radius:18px;background:linear-gradient(130deg,#071a37,#0b2b4d);text-align:center}.mission h2{font-size:clamp(26px,4vw,48px)}.mission p{max-width:760px;margin:0 auto 24px}footer{border-top:1px solid #1b5374;padding:25px 7vw 40px;display:flex;justify-content:space-between;color:#8eafc0;font-size:11px}footer a{color:#d9f6ff;text-decoration:none;font-weight:900}
   @media(max-width:850px){header{height:auto;padding:14px 18px;align-items:flex-start;gap:12px}.brand b{font-size:15px}.brand small{font-size:7px}nav{gap:10px;overflow:auto;max-width:52vw;padding-top:8px}nav a{font-size:10px;white-space:nowrap}.hero{padding:70px 22px}.hero p{font-size:14px}.featured,.categories{padding-left:22px;padding-right:22px}.grid{grid-template-columns:1fr}.image{height:360px}.catgrid{grid-template-columns:1fr 1fr}.mission{margin-left:22px;margin-right:22px;padding:34px 20px}footer{padding-left:22px;padding-right:22px;gap:20px}.featured h2{font-size:30px}}
  `}</style>
 </main>
}
