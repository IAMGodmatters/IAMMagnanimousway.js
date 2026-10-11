const catalog: Record<string,{title:string;subtitle:string;symbol:string}> = {
  'solar-bank.svg': {title:'Solar Emergency Power Bank',subtitle:'Portable backup power',symbol:'POWER'},
  'solar-light.svg': {title:'Solar Camping & Garden Light',subtitle:'Outdoor rechargeable lighting',symbol:'LIGHT'},
  'earbuds.svg': {title:'Wireless Bluetooth Headset',subtitle:'Calls, music and everyday listening',symbol:'AUDIO'},
  'charging-cable.svg': {title:'3-in-1 Fast Charging Cable',subtitle:'Multi-device charging',symbol:'CHARGE'},
  'kitchen-chopper.svg': {title:'Multifunction Vegetable Cutter',subtitle:'Practical kitchen prep',symbol:'KITCHEN'},
  'home-organizer.svg': {title:'Laundry & Cleansing Organizer Set',subtitle:'Simple everyday organization',symbol:'HOME'},
  'hoodie.svg': {title:'Positive Message Unisex Hoodie',subtitle:'Comfort and encouragement',symbol:'WEAR'},
  'makeup-brushes.svg': {title:'Makeup Brush Set',subtitle:'Everyday beauty essentials',symbol:'BEAUTY'},
  'resistance-bands.svg': {title:'5-Level Resistance Band Set',subtitle:'Portable home fitness',symbol:'FIT'},
  'pet-feeder.svg': {title:'Automatic Pet Feeder',subtitle:'Helpful daily pet care',symbol:'PETS'},
  'baby-teether.svg': {title:'Baby Silicone Teether Accessories',subtitle:'Family-friendly baby essentials',symbol:'BABY'},
  'car-mount.svg': {title:'Car Phone Holder',subtitle:'Hands-free travel convenience',symbol:'AUTO'},
  'travel-cubes.svg': {title:'8-Piece Travel Packing Cubes',subtitle:'Organized travel made simple',symbol:'TRAVEL'},
  'desk-organizer.svg': {title:'Desktop Stackable Organizer',subtitle:'A cleaner workspace',symbol:'DESK'},
  'electric-screwdriver.svg': {title:'USB Electric Screwdriver Set',subtitle:'Compact repair helper',symbol:'TOOLS'},
  'magnetic-blocks.svg': {title:'Magnetic Building Blocks',subtitle:'Creative family play',symbol:'PLAY'},
  'holy-spirit-speaks.svg': {title:'THE HOLY SPIRIT SPEAKS',subtitle:'Faith, truth and testimony',symbol:'FAITH'},
};

export const dynamic='force-static';
export function generateStaticParams(){return Object.keys(catalog).map(name=>({name}))}

function esc(value:string){return value.replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]||ch))}

export async function GET(_request:Request,{params}:{params:Promise<{name:string}>}){
  const {name}=await params;
  const item=catalog[name]||{title:'Magnanimous Store Product',subtitle:'God Matters',symbol:'STORE'};
  const title=esc(item.title),subtitle=esc(item.subtitle),symbol=esc(item.symbol);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 560" role="img" aria-label="${title}">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#06152f"/><stop offset="0.55" stop-color="#0a3557"/><stop offset="1" stop-color="#0d5f72"/></linearGradient><radialGradient id="glow"><stop stop-color="#7df2ff" stop-opacity=".34"/><stop offset="1" stop-color="#7df2ff" stop-opacity="0"/></radialGradient></defs>
  <rect width="800" height="560" rx="36" fill="url(#bg)"/>
  <circle cx="625" cy="120" r="150" fill="url(#glow)"/>
  <circle cx="170" cy="420" r="180" fill="url(#glow)" opacity=".45"/>
  <rect x="210" y="92" width="380" height="258" rx="42" fill="#061d35" stroke="#74e9ff" stroke-width="5"/>
  <circle cx="400" cy="205" r="78" fill="#0d4761" stroke="#b9f7ff" stroke-width="5"/>
  <text x="400" y="218" text-anchor="middle" fill="#dffcff" font-family="Arial,Helvetica,sans-serif" font-size="27" font-weight="800" letter-spacing="2">${symbol}</text>
  <path d="M298 306h204" stroke="#78eaff" stroke-width="8" stroke-linecap="round" opacity=".75"/>
  <text x="400" y="425" text-anchor="middle" fill="#ffffff" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="800">${title}</text>
  <text x="400" y="472" text-anchor="middle" fill="#9cecff" font-family="Arial,Helvetica,sans-serif" font-size="20">${subtitle}</text>
  <text x="400" y="520" text-anchor="middle" fill="#ffd978" font-family="Arial,Helvetica,sans-serif" font-size="15" font-weight="700" letter-spacing="3">GOD MATTERS • I AM MAGNANIMOUS WAY™</text>
  </svg>`;
  return new Response(svg,{headers:{'content-type':'image/svg+xml; charset=utf-8','cache-control':'public, max-age=86400, stale-while-revalidate=604800'}});
}
