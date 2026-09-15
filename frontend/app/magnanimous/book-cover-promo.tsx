const COVER='https://cdn.shopify.com/s/files/1/0736/7334/3018/files/the-holy-spirit-speaks-jessie-hardin-cover.jpg?v=1789498979';
const BOOK_URL='https://a.co/d/02rFwv8H';

export default function BookCoverPromo(){
 return <section className="mag-cover-promo" aria-label="Featured book cover">
  <a href={BOOK_URL} target="_blank" rel="noopener noreferrer" className="mag-cover-link">
   <img src={COVER} alt="The Holy Spirit Speaks by Jessie Hardin book cover" loading="eager"/>
  </a>
  <div className="mag-cover-copy">
   <small>FEATURED BOOK</small>
   <strong>THE HOLY SPIRIT SPEAKS</strong>
   <span>by Jessie Hardin</span>
   <a href={BOOK_URL} target="_blank" rel="noopener noreferrer">View on Amazon →</a>
  </div>
  <style>{`
   .mag-cover-promo{display:flex;align-items:center;justify-content:center;gap:18px;padding:16px 18px;border-bottom:1px solid rgba(255,215,120,.28);background:linear-gradient(90deg,#071526,#17243a 55%,#2b230f);font-family:Inter,system-ui,sans-serif;color:#fff}
   .mag-cover-link{display:block;width:84px;flex:0 0 84px;aspect-ratio:2/3;border-radius:8px;overflow:hidden;border:1px solid rgba(255,225,145,.62);box-shadow:0 10px 28px rgba(0,0,0,.35)}.mag-cover-link img{display:block;width:100%;height:100%;object-fit:cover}
   .mag-cover-copy{display:grid;gap:4px;min-width:0}.mag-cover-copy small{font-size:9px;letter-spacing:.18em;color:#ffe08a;font-weight:900}.mag-cover-copy strong{font-size:15px;line-height:1.2}.mag-cover-copy span{font-size:10px;color:#c8dce5}.mag-cover-copy a{margin-top:4px;color:#72e4ff;text-decoration:none;font-size:10px;font-weight:900}
   @media(max-width:680px){.mag-cover-promo{justify-content:flex-start;padding:12px 14px;gap:12px}.mag-cover-link{width:92px;flex-basis:92px}.mag-cover-copy strong{font-size:14px}.mag-cover-copy span,.mag-cover-copy a{font-size:10px}}
  `}</style>
 </section>;
}
