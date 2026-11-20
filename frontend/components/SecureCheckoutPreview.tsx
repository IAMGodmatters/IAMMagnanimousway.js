'use client';

import {useState} from 'react';

type SecureCheckoutPreviewProps = {
  planName?: string;
  priceLabel?: string;
};

export default function SecureCheckoutPreview({planName = 'Your selected plan', priceLabel = ''}: SecureCheckoutPreviewProps) {
  const [displayName, setDisplayName] = useState('MAGNANIMOUS MEMBER');
  const [showBack, setShowBack] = useState(false);
  const shownName = displayName.trim().toUpperCase().slice(0, 28) || 'YOUR NAME';

  return (
    <section className="securePreview" aria-labelledby="secure-preview-title" data-payment-preview-only="true">
      <div className="previewCopy">
        <div className="eyebrow"><span className="statusDot" /> SECURE PAYMENT EXPERIENCE</div>
        <h2 id="secure-preview-title">A checkout that feels as good as it looks.</h2>
        <p className="intro">A live 3D preview inspired by the smart-card design. Your selected plan stays with Magnanimous; sensitive payment details are entered through the secure hosted checkout managed by Magnanimous’s payment partner.</p>
        <div className="planSummary">
          <span>SELECTED PLAN</span>
          <strong>{planName}</strong>
          {priceLabel && <b>{priceLabel}</b>}
        </div>
        <label className="previewLabel" htmlFor="magnanimous-card-preview-name">Name shown on the card preview</label>
        <input
          id="magnanimous-card-preview-name"
          className="previewNameInput"
          type="text"
          value={displayName}
          maxLength={28}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Enter a display name"
          aria-describedby="preview-name-help"
        />
        <small id="preview-name-help" className="fieldHelp">Demo only. This text is not sent to the payment provider.</small>
        <div className="trustLine"><span aria-hidden="true">✓</span> No card number or security code is collected here.</div>
      </div>

      <div className="previewVisual">
        <div className="cardStage" data-face={showBack ? 'back' : 'front'}>
          <div className={'paymentCard' + (showBack ? ' isBack' : '')}>
            <div className="cardFace cardFront" aria-hidden={showBack}>
              <div className="cardTopline">
                <span className="brandMark">I AM <b>MAGNANIMOUS WAY™</b></span>
                <span className="previewTag">PREVIEW</span>
              </div>
              <div className="cardChip" aria-hidden="true"><i /><i /><i /><i /></div>
              <div className="cardNumber" aria-label="Masked card number">••••　••••　••••　••••</div>
              <div className="cardBottom">
                <div><small>CARDHOLDER</small><strong>{shownName}</strong></div>
                <div className="expiry"><small>EXPIRES</small><strong>MM / YY</strong></div>
              </div>
              <div className="cardGlow" />
            </div>
            <div className="cardFace cardBack" aria-hidden={!showBack}>
              <div className="magneticStripe" />
              <div className="signatureRow"><span>SECURE CHECKOUT PREVIEW</span><b>•••</b></div>
              <div className="backMessage">
                <span className="shield" aria-hidden="true">✓</span>
                <strong>Your payment details stay protected.</strong>
                <small>Card number, expiry and security code are entered on the secure hosted payment page.</small>
              </div>
              <div className="backBrand">I AM MAGNANIMOUS WAY™</div>
            </div>
          </div>
        </div>
        <button className="flipButton" type="button" onClick={() => setShowBack((current) => !current)} aria-pressed={showBack}>
          <span aria-hidden="true">↻</span> {showBack ? 'Show card front' : 'Flip card preview'}
        </button>
        <div className="secureProvider"><span className="lockIcon" aria-hidden="true">⌑</span><span><strong>Secure hosted payment</strong><small>Actual payment details are entered after you continue to checkout.</small></span></div>
      </div>

      <style jsx>{`
        .securePreview{max-width:1280px;margin:18px auto 20px;padding:clamp(18px,3vw,30px);display:grid;grid-template-columns:minmax(0,1fr) minmax(330px,.88fr);gap:clamp(22px,4vw,54px);align-items:center;position:relative;overflow:hidden;border:1px solid rgba(92,190,224,.32);border-radius:22px;background:radial-gradient(ellipse at 88% 16%,rgba(48,155,208,.18),transparent 38%),linear-gradient(128deg,#08131d 0%,#0b1421 55%,#101628 100%);box-shadow:0 18px 60px rgba(0,0,0,.24)}
        .securePreview:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 20%,rgba(255,255,255,.025) 48%,transparent 74%)}
        .previewCopy,.previewVisual{position:relative;z-index:1;min-width:0}
        .eyebrow{display:flex;align-items:center;gap:9px;color:#e4c477;font-size:9px;font-weight:900;letter-spacing:.17em}
        .statusDot{width:7px;height:7px;border-radius:50%;background:#6ce6c5;box-shadow:0 0 12px rgba(108,230,197,.75)}
        h2{max-width:570px;margin:13px 0 10px;color:#f5f8fc;font-size:clamp(27px,3.5vw,42px);line-height:1.04;letter-spacing:-.035em}
        .intro{max-width:590px;margin:0;color:#9eb1c1;font-size:12px;line-height:1.7}
        .planSummary{margin:18px 0 16px;padding:12px 14px;display:grid;grid-template-columns:1fr auto;gap:4px 12px;align-items:center;border:1px solid rgba(121,174,199,.22);border-radius:12px;background:rgba(4,11,18,.42)}
        .planSummary span{grid-column:1/-1;color:#9aaebc;font-size:8px;font-weight:900;letter-spacing:.15em}
        .planSummary strong{color:#f2f6f9;font-size:13px}
        .planSummary b{color:#f1d28a;font-size:12px;text-align:right}
        .previewLabel{display:block;margin-bottom:7px;color:#d9e4ec;font-size:10px;font-weight:800}
        .previewNameInput{width:100%;max-width:390px;padding:11px 13px;border:1px solid #38586c;border-radius:10px;outline:none;background:#050b12;color:#f5f8fc;font:600 12px system-ui;transition:border-color .18s,box-shadow .18s}
        .previewNameInput:focus{border-color:#58c9e9;box-shadow:0 0 0 3px rgba(88,201,233,.13)}
        .previewNameInput::placeholder{color:#718796}
        .fieldHelp{display:block;margin-top:6px;color:#778c9b;font-size:9px}
        .trustLine{display:flex;gap:8px;align-items:center;margin-top:16px;color:#91dbc7;font-size:10px}
        .trustLine span{display:inline-grid;place-items:center;width:17px;height:17px;border-radius:50%;background:rgba(100,219,186,.13);font-weight:900}
        .previewVisual{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:0}
        .cardStage{width:min(100%,390px);aspect-ratio:1.62;perspective:1100px;filter:drop-shadow(0 22px 25px rgba(0,0,0,.4))}
        .paymentCard{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .75s cubic-bezier(.2,.72,.22,1)}
        .paymentCard.isBack{transform:rotateY(180deg)}
        .cardFace{position:absolute;inset:0;overflow:hidden;border:1px solid rgba(241,217,151,.55);border-radius:18px;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:linear-gradient(132deg,#102d49 0%,#0c1b31 43%,#172b48 72%,#0c1a2b 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.16),inset 0 -1px 0 rgba(0,0,0,.4)}
        .cardFront{padding:clamp(15px,2vw,23px);display:flex;flex-direction:column;justify-content:space-between}
        .cardFront:after{content:"";position:absolute;inset:-40% -20%;pointer-events:none;background:linear-gradient(112deg,transparent 34%,rgba(255,255,255,.1) 46%,transparent 58%);transform:translateX(-28%);animation:cardShimmer 7s ease-in-out infinite}
        .cardTopline,.cardBottom{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
        .brandMark{color:#f2d795;font-size:clamp(8px,1vw,10px);font-weight:900;letter-spacing:.1em}
        .brandMark b{color:#f7f8fb}
        .previewTag{padding:5px 7px;border:1px solid rgba(242,215,149,.45);border-radius:5px;color:#f0d999;font-size:7px;font-weight:900;letter-spacing:.15em}
        .cardChip{position:relative;z-index:1;width:39px;height:29px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;overflow:hidden;border:1px solid #d7bc78;border-radius:7px;background:linear-gradient(135deg,#f0dca5,#a8894e)}
        .cardChip i{border:1px solid rgba(76,59,34,.35)}
        .cardNumber{position:relative;z-index:1;color:#f5f5f2;font-size:clamp(12px,1.5vw,17px);font-weight:700;letter-spacing:.13em;text-shadow:0 1px 2px rgba(0,0,0,.3)}
        .cardBottom{align-items:flex-end}
        .cardBottom div{display:grid;gap:5px;min-width:0}
        .cardBottom small{color:#a9bfd0;font-size:7px;font-weight:800;letter-spacing:.15em}
        .cardBottom strong{max-width:245px;overflow:hidden;color:#f1e4c2;font-size:clamp(8px,1vw,11px);letter-spacing:.08em;text-overflow:ellipsis;white-space:nowrap}
        .cardBottom .expiry{text-align:right}
        .cardGlow{position:absolute;right:-18%;bottom:-75%;width:75%;height:140%;border-radius:50%;background:rgba(60,175,216,.14);filter:blur(25px)}
        .cardBack{transform:rotateY(180deg);display:flex;flex-direction:column;padding:18px 0 12px;background:linear-gradient(135deg,#0b1729,#15253c 55%,#0b1729)}
        .magneticStripe{height:18%;margin-top:8%;background:linear-gradient(90deg,#090d13,#1e2631 50%,#090d13)}
        .signatureRow{display:flex;align-items:center;justify-content:flex-end;gap:10px;margin:11px 8% 0;color:#aab8c2;font-size:7px;letter-spacing:.12em}
        .signatureRow b{display:grid;place-items:center;width:45px;height:19px;border-radius:3px;background:#e6dfca;color:#243347;font-size:9px;letter-spacing:.1em}
        .backMessage{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:7px;padding:12px 9%;text-align:center}
        .shield{display:grid;place-items:center;width:27px;height:27px;border:1px solid rgba(100,224,193,.55);border-radius:50%;color:#84e6ce;font-weight:900}
        .backMessage strong{color:#f1e5c6;font-size:clamp(10px,1.2vw,13px)}
        .backMessage small{max-width:260px;color:#9eb3c2;font-size:clamp(7px,.9vw,9px);line-height:1.45}
        .backBrand{padding:0 8%;color:#d7bd83;font-size:7px;font-weight:900;letter-spacing:.15em}
        .flipButton{display:inline-flex;align-items:center;gap:8px;margin:15px 0 13px;padding:9px 14px;border:1px solid rgba(112,205,229,.42);border-radius:999px;background:rgba(8,25,39,.78);color:#c9ecf6;font-size:10px;font-weight:800;cursor:pointer;transition:background .18s,border-color .18s,transform .18s}
        .flipButton:hover{transform:translateY(-1px);border-color:#70d4ee;background:#102b3b}
        .flipButton:focus-visible{outline:2px solid #78dbf3;outline-offset:3px}
        .flipButton span{font-size:17px;line-height:10px}
        .secureProvider{width:min(100%,390px);display:flex;align-items:center;gap:10px;padding:11px 13px;border:1px solid rgba(117,168,190,.2);border-radius:12px;background:rgba(3,10,17,.48)}
        .lockIcon{display:grid;place-items:center;width:29px;height:29px;flex:0 0 29px;border-radius:9px;background:rgba(101,220,188,.12);color:#8de5cf;font-size:20px}
        .secureProvider span:last-child{display:grid;gap:3px}
        .secureProvider strong{color:#e7f3f8;font-size:10px}
        .secureProvider small{color:#8298a8;font-size:8px;line-height:1.4}
        @keyframes cardShimmer{0%,72%,100%{transform:translateX(-28%)}84%{transform:translateX(28%)}}
        @media(max-width:1120px){.securePreview{grid-template-columns:1fr;gap:20px}.previewVisual{width:100%}.cardStage{width:min(100%,390px)}.previewCopy h2{max-width:480px}}
        @media(prefers-reduced-motion:reduce){.paymentCard,.flipButton,.previewNameInput{transition:none}.cardFront:after{animation:none}}
      `}</style>
    </section>
  );
}
