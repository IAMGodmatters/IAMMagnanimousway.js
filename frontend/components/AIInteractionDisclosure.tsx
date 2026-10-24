// Shared first-exposure notice for Magnanimous conversational AI surfaces.
// This is a visible disclosure, not a declaration of complete legal compliance.
type Props = { mode?: 'chat' | 'voice'; compact?: boolean };

export default function AIInteractionDisclosure({mode='chat',compact=false}:Props){
  const description=mode==='voice'
    ? 'This specialist is an AI system, not a human representative. Speech and replies may be generated or altered by AI.'
    : 'You are interacting with Magnanimous AI, not a human. Replies are AI-generated; verify important facts before relying on or publishing them.';
  return (
    <div role="note" aria-label="AI interaction disclosure" data-ai-interaction-disclosure="true"
      style={{
        display:'flex',alignItems:'flex-start',gap:10,flexWrap:'wrap',
        border:'1px solid rgba(203,165,82,.33)',borderRadius:12,
        background:'rgba(10,24,42,.74)',color:'#e5e9f1',
        padding:compact?'9px 12px':'12px 15px',margin:'8px 0',
        font:'500 12px/1.55 system-ui, sans-serif'
      }}>
      <strong style={{color:'#efce81',letterSpacing:'.07em',whiteSpace:'nowrap',fontSize:11}}>MAGNANIMOUS AI · DISCLOSURE</strong>
      <span>{description}</span>
    </div>
  );
}
