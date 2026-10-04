import json,re,os
BASE='/workspace'
stories=json.load(open(f'{BASE}/stories.json'))

ARC={
'Magical':[
('The First Rule','the magic reveals a rule nobody mentioned'),('The Hidden Guide','an unexpected guide appears with knowledge of the other side'),('The Broken Promise','a promise tied to the magic is broken and the cost arrives'),('The Place Between','a hidden place opens between the ordinary world and the impossible one'),('The Price of Wonder','using the magic saves someone but takes something precious'),('The Forgotten Name','an old name connects the mystery to the hero’s own past'),('The Door Closes','the safest way home disappears at the worst possible moment'),('The Choice of Two Worlds','two worlds demand opposite choices and only one can survive'),('The Light Returns','the final secret is faced and a new doorway opens for what comes next')],
'Majestic':[
('The Claim','the first challenge to the new claim arrives before the court can settle'),('The Divided Council','trusted leaders split over who should hold power'),('The Border Fire','danger reaches the edge of the kingdom and forces an alliance'),('The Hidden History','an old record reveals why the conflict truly began'),('The Broken Banner','a public defeat makes the kingdom doubt its own defenders'),('The Oath Renewed','the hero must choose duty without becoming what the enemy expects'),('The Siege','the enemy reaches the heart of the kingdom'),('The Last Council','friends, rivals, and citizens must decide together who they will follow'),('The Crown Earned','the final battle is won through sacrifice, truth, and a better kind of rule')],
'Drama':[
('The Conversation','the truth can no longer be avoided and someone finally speaks'),('The Old Wound','a memory explains why the relationship broke in the first place'),('The Wrong Choice','a well-meant decision makes the conflict worse'),('The Secret Kept','someone admits there has been another part of the story all along'),('The Empty Place','the family feels the cost of what has not been repaired'),('The Return','someone who left comes back before anyone is ready'),('The Apology','an apology is offered but forgiveness is not automatic'),('The Decision','everyone must decide what they are willing to change'),('The New Beginning','the family chooses what to carry forward and what to finally let go')],
'Action':[
('Run','the first escape only reveals a larger operation already in motion'),('The False Safehouse','the place meant to protect them has already been compromised'),('The Inside Man','evidence points to someone on the inside feeding the enemy information'),('Countermove','the team stops running long enough to set a trap of its own'),('Taken','one member of the team is captured and the mission becomes personal'),('Breakout','the rescue exposes the real objective behind the attacks'),('Zero Hour','the enemy starts the final phase before the team is ready'),('Last Route','only one dangerous path remains to reach the target in time'),('After Dawn','the final chase ends, the conspiracy breaks, and one surviving clue points forward')],
'Mystery':[
('The Second Clue','a second clue proves the first answer was too simple'),('The Witness','someone saw more than they admitted and is suddenly afraid to talk'),('The Hidden Room','a place that should not exist reveals evidence from another time'),('The Wrong Suspect','the strongest suspect has proof that turns the case in a new direction'),('The Personal Link','the mystery connects directly to the investigator’s own history'),('The Trap','following the next clue leads exactly where the unknown watcher wanted'),('The Missing Piece','one overlooked detail connects every clue so far'),('The Reveal','the truth appears at last, but one final contradiction remains'),('The Real Answer','the last contradiction is solved and the mystery changes what everyone believed')],
'Adventure':[
('The Next Marker','the first victory points toward a larger journey'),('The Hard Crossing','the team reaches an obstacle that cannot be solved by strength alone'),('The Stranger','helping someone along the way reveals an unexpected new clue'),('The Wrong Trail','a confident choice sends the group in the wrong direction'),('The Team Choice','the friends must decide whether the goal matters more than helping someone'),('The Hidden Route','a forgotten path opens because of an earlier act of kindness'),('The Rescue','the adventure becomes a rescue mission when someone is left behind'),('The Final Climb','the last obstacle tests everything the team has learned together'),('The Way Home','the group returns changed, bringing home something more valuable than the prize')]
}
GENERIC={'Magical':'the chosen traveler','Majestic':'the young defender','Drama':'the family','Action':'the lead operative','Mystery':'the investigator','Adventure':'the friends'}

EXPLICIT_LEADS={
11:'Kael',12:'the lead guardian',13:'the young envoy',14:'the stable boy',15:'the lead rider',16:'the Mountain King',17:'the young scout',18:'the hidden heir',19:'the bell keeper',20:'the palace servant',
22:'the stranded passengers',23:'the departing daughter',24:'the returning resident',25:'the café owner',26:'the four childhood friends',27:'the returning son',29:'the woman returning home',31:'the station survivor',32:'the city responder',34:'the courier',35:'the last-train passengers',36:'the blackout team',38:'the detective',39:'the courier',40:'the witness',41:'Olivia',42:'Nora',44:'the 3:17 target',45:'the elevator investigator',46:'the new tenant',48:'the message recipient',49:'the estate heir',50:'the returning traveler',51:'the three young explorers',52:'the four friends',54:'Mia and Theo',55:'the friends',56:'the backyard explorers',59:'the family',60:'the young builders'}

STOP={'At','Every','When','Then','Inside','Before','After','Under','Soon','One','Two','Three','Four','Five','Seven','The','This','That','Their','By','If','A','An'}

def lead(story):
    if story['id'] in EXPLICIT_LEADS: return EXPLICIT_LEADS[story['id']]
    text=' '.join(x['text'] for x in story['scenes'][:4])
    for token in re.findall(r"\b[A-Z][a-z]{2,12}(?:’s)?\b",text):
        clean=token.replace('’s','')
        if clean not in STOP and clean not in {'Room','Sunday','King','Station','Empire','Valley','City'}:
            return clean
    return GENERIC[story['category']]

def theme(story):
    words=[w.lower() for w in re.findall(r"[A-Za-z]+",story['title']) if w.lower() not in {'the','a','an','of','to','and','under','above','across','until','on','in','with','no','more','last'}]
    return words[-1] if words else 'secret'

def beats(story, epnum, desc, prev, hero):
    cat=story['category']; obj=theme(story)
    openers={
      'Magical':f"{hero} follows the consequence of the last discovery, but {prev} changes the rules again.",
      'Majestic':f"{hero} faces the consequence of the last decision as the realm learns that {prev}.",
      'Drama':f"{hero} tries to move forward, but {prev} forces another honest conversation.",
      'Action':f"{hero} has seconds to react when {prev} turns the escape into a new mission.",
      'Mystery':f"{hero} studies the evidence again after learning that {prev}, and one detail no longer fits.",
      'Adventure':f"{hero} follows the next marker after learning that {prev}, and the journey grows larger."
    }
    mid={
      'Magical':[f"A new sign linked to the {obj} appears where it should be impossible.","An ally explains one part of the magic but refuses to reveal the price of using it.","The group tries the safer path and discovers the magic has already anticipated their choice."],
      'Majestic':[f"A messenger brings proof that the struggle around the {obj} reaches beyond the palace.","The council divides over whether protection or truth should come first.","A rival offers help, but only if the hero accepts a condition that could change the kingdom."],
      'Drama':[f"A small object connected to the {obj} brings back a memory everyone interpreted differently.","Someone admits a truth that explains their behavior without excusing the hurt they caused.","The attempt to repair things almost works until another person arrives with information nobody expected."],
      'Action':[f"A signal connected to the {obj} exposes the next target before the team can regroup.","The team splits to protect civilians while tracking the source of the attack.","A secure message reveals that someone nearby has been watching every move."],
      'Mystery':[f"A mark connected to the {obj} matches evidence from a place nobody has searched.","A witness gives a truthful answer that creates an even harder question.","The investigator reconstructs the timeline and finds one impossible gap."],
      'Adventure':[f"A marker connected to the {obj} leads the group beyond the route they expected.","The group must solve a practical problem by combining different strengths instead of competing.","Helping a stranger costs time but reveals the clue they would otherwise have missed."]
    }
    close={
      'Magical':f"Just before the episode ends, the {obj} reacts to {hero} and reveals that {desc}.",
      'Majestic':f"At the final moment, the court receives undeniable proof that {desc}.",
      'Drama':f"As everyone thinks the conversation is over, one last admission reveals that {desc}.",
      'Action':f"The team reaches temporary safety, then a live signal proves that {desc}.",
      'Mystery':f"The clue finally makes sense, but the last image proves that {desc}.",
      'Adventure':f"The group reaches the marker they were seeking, only to discover that {desc}."
    }
    return [openers[cat],*mid[cat],close[cat]]

def production_details(story, episode, hero):
    cat=story['category']; obj=theme(story); n=episode['episode_number']
    speaker=hero if hero[:1].isupper() else hero[:1].upper()+hero[1:]
    partner={'Magical':'the guide','Majestic':'the trusted adviser','Drama':'the family member','Action':'the partner','Mystery':'the witness','Adventure':'the friend'}[cat]
    lines={
      'Magical':[f'{speaker}: "Tell me what is really happening. Why did this choose me?"',f'{partner.title()}: "If I tell you everything now, you will make the wrong choice."'],
      'Majestic':[f'{speaker}: "I will not save the kingdom by becoming the thing we fear."',f'{partner.title()}: "Then give them another reason to follow you."'],
      'Drama':[f'{speaker}: "I do not want another version of the truth. I want the truth."',f'{partner.title()}: "Then you need to hear the part I was afraid to say."'],
      'Action':[f'{speaker}: "We have one chance. When I move, stay with me."',f'{partner.title()}: "Too late. They already know where we are."'],
      'Mystery':[f'{speaker}: "This clue was left for us to find."',f'{partner.title()}: "No. It was left for you."'],
      'Adventure':[f'{speaker}: "We can reach the goal later. We help them first."',f'{partner.title()}: "Then we go together. Nobody gets left behind."']
    }[cat]
    camera=[
      'wide establishing shot that clearly places the characters in the scene',
      'medium two-shot with natural blocking and eye lines',
      'close-up on the lead during the emotional or dangerous reveal',
      'shot-reverse-shot during spoken dialogue with visible lip movement',
      'moving cliffhanger shot ending on the new threat, clue, or decision'
    ]
    sound={
      'Magical':['subtle magical hum','cloth and footsteps','environmental wind/forest or room tone','restrained wonder score'],
      'Majestic':['hall/valley ambience','armor or fabric movement','distant crowd/wind','restrained orchestral tension'],
      'Drama':['natural room tone','chairs/doors/phone/object handling','breath and quiet pauses','soft emotional underscore'],
      'Action':['footsteps and impacts','radio/phone or mechanical cues','traffic/tunnel/building ambience','percussive tension score'],
      'Mystery':['quiet room/hall ambience','door/elevator/object detail sounds','distant footsteps','minimal suspense pulse'],
      'Adventure':['outdoor/neighborhood ambience','footsteps and practical object sounds','birds/wind/water as appropriate','warm adventurous score']
    }[cat]
    return {'dialogue':lines,'camera_plan':camera,'sound_design':sound,'performance_note':f'Keep {hero} visually and vocally consistent with earlier episodes. Perform the scene naturally; do not read stage directions aloud.'}

def video_prompt(story,episode,hero):
    scene_text=' '.join(s['text'] for s in episode['scenes'])
    tone={'Magical':'cinematic fantasy drama','Majestic':'epic royal drama','Drama':'grounded emotional family drama','Action':'high-tension action thriller','Mystery':'moody mystery thriller','Adventure':'warm cinematic family adventure'}[story['category']]
    return (f"Vertical 9:16 {tone}, live-action television look, realistic human performers, consistent recurring cast led by {hero}. "
            f"Episode {episode['episode_number']} of {story['title']}. Natural acting, visible facial emotion, realistic hand/body movement, lip-synced spoken dialogue where appropriate, "
            f"shot-reverse-shot coverage, closeups for emotional beats, medium and wide establishing shots, subtle handheld/dolly camera motion, cinematic lighting, shallow depth of field, "
            f"production sound, room tone, footsteps and object sounds, restrained original score, no slideshow, no static-pan effect, no captions baked into source video, no logos. "
            f"Use natural spoken dialogue with visible lip sync: {' '.join(episode.get('dialogue',[]))} Sound design: {', '.join(episode.get('sound_design',[]))}. Story beats: {scene_text}")

series=[]
for story in stories:
    hero=lead(story)
    episodes=[]
    ep1={
      'episode_number':1,'title':'Episode 1 — The Beginning','scenes':story['scenes'],'voice':story.get('voice'),
      'status':'story_ready','video_status':'real_video_required','legacy_preview_available':True,
      'cliffhanger':story['scenes'][-1]['text'],
    }
    ep1.update(production_details(story,ep1,hero)); ep1['video_prompt']=video_prompt(story,ep1,hero); episodes.append(ep1)
    prev=story['scenes'][-1]['text'].rstrip('.!?').lower()
    for i,(title,desc) in enumerate(ARC[story['category']],start=2):
        sc=beats(story,i,desc,prev,hero)
        ep={'episode_number':i,'title':f"Episode {i} — {theme(story).title()}: {title}",'scenes':[{'text':x,'tag':story['scenes'][(j+i-2)%len(story['scenes'])]['tag']} for j,x in enumerate(sc)],'voice':story.get('voice'),'status':'story_ready','video_status':'real_video_required','legacy_preview_available':False,'cliffhanger':sc[-1]}
        ep.update(production_details(story,ep,hero)); ep['video_prompt']=video_prompt(story,ep,hero)
        episodes.append(ep); prev=desc
    series.append({'series_id':story['id'],'title':story['title'],'category':story['category'],'season':1,'episode_count':10,'lead':hero,'continuity_bible':f"Keep {hero} and all recurring characters visually consistent across all ten episodes. Preserve wardrobe logic, approximate age, hair, facial identity, locations, props and story continuity unless the script explicitly changes them.",'episodes':episodes})

out=f'{BASE}/series_manifest.json'
json.dump({'version':1,'series_count':len(series),'episodes_per_series':10,'total_episodes':sum(len(s['episodes']) for s in series),'production_target':'cinematic_live_action_vertical','series':series},open(out,'w'),indent=2,ensure_ascii=False)
print(out,os.path.getsize(out))
print('series',len(series),'episodes',sum(len(s['episodes']) for s in series))
for s in series:
    print(f"{s['series_id']:02d} {s['title']}: {s['episodes'][0]['title']} -> {s['episodes'][-1]['title']} | lead={s['lead']}")
