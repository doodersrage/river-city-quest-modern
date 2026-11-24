"use strict";
/* River City Quest 3D: what everyone in town says. Ported from the 2D game. Each function returns
   lines to say, or starts its own conversation and returns nothing. */
const EXTRA_NPCS=[];
const later3=(f)=>later.push({n:2,f});
const TALK3={
  archivist(n){
    if(!st.items.lantern){say([(st.name?st.name+'! Good, you came. ':'')+'Fog off the James, and the gas lamps dying block by block. Something woke under Church Hill.',
      'The old railroad tunnel caved in back in 1925. Four keystones hold its seal shut.',
      'Granite is in the Belle Isle quarry. Iron is in the Hollywood Cemetery pyramid. Brick is down in the cellar of the Poe Museum. Bronze is up in the Carillon.',
      'Take my lantern. You\'ll need the light.'],()=>{p.hold=70;p.holdIc='lantern';say(give('lantern').concat(['Press MENU any time for your items, journal and map.','Historical markers and the people of this city all have stories. Fill your journal with 8 and come see me.']));},n.who);return;}
    const k=nLore();
    if(k>=18&&!st.f.ar2){st.f.ar2=1;st.cap.balls=50;st.cap.powder=16;needSave=true;sfx('chest');return[k+' stories! You know this city better than most who live in it.','Take these bigger satchels. You can carry 50 baseballs and 16 powder kegs now.'];}
    if(k>=8&&!st.f.ar1){st.f.ar1=1;return[k+' stories in your journal already. The Library of Virginia thanks you.',...give('hc')];}
    const h=[];
    if(!st.got.granite)h.push('Start at the Belle Isle quarry. Go south out of the square and across the footbridge. The quarrymen kept blasting powder down there.');
    else if(!st.got.iron)h.push('Rubble blocks the pyramid door in Hollywood Cemetery, southwest of here. Your blasting powder will clear it.');
    else if(!st.got.brick)h.push('The Poe Museum is in Shockoe Bottom, east of here. Its cellar goes deeper than anyone admits.');
    else if(!st.got.bronze)h.push('One keystone is left, in the Carillon in Byrd Park. Its caretaker lost the key. Start by asking her.');
    else if(!st.f.won)h.push('All four keystones! The tunnel mouth is on Church Hill, north and east of here. Go steady.');
    else h.push('The lamps are lit and the fog is gone. Richmond owes you one.');
    if(!st.items.balls)h.push('There\'s a ballplayer up in Scott\'s Addition with a bucket of spare baseballs.');
    h.push(k<8?'Your journal holds '+k+' stories. Bring me 8 for a reward.':k<18?'Your journal holds '+k+' stories. Bring me 18 and I have something bigger.':'Your journal holds '+k+' stories. Few people know Richmond so well.');
    return h;},
  brewer(){p.hp=st.max;
    if(!st.items.bottle)return['Rough night? Ginger beer is on the house in Scott\'s Addition.',...give('bottle')];
    const was=st.bottle;st.bottle=1;needSave=true;return[was?'Hearts are topped off. Come back when that bottle runs dry.':'Filled your bottle back up, and your hearts too.'];},
  ballplayer(n){learn('diamond');
    if(!st.items.balls){say(['I was shagging flies by The Diamond and the fog ate half my bucket. Take what\'s left.'],()=>{p.hold=70;p.holdIc='ball';say(give('balls'),()=>offerChal(n,[]));},n.who);return;}
    if(st.ammo.balls<10){st.ammo.balls=10;needSave=true;return offerChal(n,['Running low? Here, take a few.']);}
    return offerChal(n,['The Flying Squirrels play over at The Diamond. Best seats in town are out on the grass.']);},
  racer(){return['This is the Libby Hill soapbox derby! Steepest street in Church Hill.','My car\'s still in the shop for this version of town. Come back later and we\'ll race.'];},
  musician(){
    if(st.trade=='melon'){const L=give('music');p.hold=70;p.holdIc='music';return['Is that a Carytown watermelon? The band hasn\'t eaten all day! Take this in trade.',...L];}
    if(st.trade=='music'||st.trade=='rivermap'||st.items.kayak)return['That melon hit the spot. Keep that sheet music safe.'];
    return['Those rental scooters have gone feral. Two good whacks stops one.','The band\'s starving, too. A cold watermelon would hit the spot.'];},
  vendor(n){learn('carytown');
    if(!st.trade&&!st.items.kayak&&!st.f.melon){st.f.melon=1;say(['Watermelon festival leftovers! I can\'t sell another one. Take it, somebody will want it.'],()=>{p.hold=70;p.holdIc='melon';say(give('melon'),()=>offerChal(n,[]));},n.who);return;}
    return offerChal(n,['Best melons in Virginia, right here on Cary Street.']);},
  caretaker(){learn('carillon');
    if(st.got.bronze)return['The bells are ringing again. Thank you.'];
    if(st.got.carkey)return['My key! The Carillon door is open to you. Something heavy is swinging up in the bell chamber.'];
    return['When the fog came, I ran for the river and dropped the Carillon key somewhere in Forest Hill Park, across the James.',
      st.items.kayak?'You have a kayak? Then paddle the whitewater south of Belle Isle. Forest Hill is west of Manchester.':'You\'d need a boat to get over there. The kayaker on Belle Isle might lend one, if you have something she wants.'];},
  ranger(){learn('foresthill');return['This was an amusement park once. Carousel, roller coaster, even a penny arcade in the Stone House.',
    st.got.carkey?'Hope that key gets the bells ringing again.':'Somebody dropped something shiny behind the rocks east of the Stone House. Those rocks look cracked to me.'];},
  painter(n){learn('manchester');
    if(!st.f.painter){st.f.painter=1;st.coins=Math.min(999,st.coins+30);needSave=true;sfx('chest');return offerChal(n,['You paddled over in this fog? Brave. Here, the mural fund can spare 30 coins.']);}
    return offerChal(n,['Murals all along these walls. Manchester\'s been painting itself for years.']);},
  chal(n){return offerChal(n,[]);},
  historian(){learn('ancarrow');
    if(st.f.bateau)return['The bateau is drying out by the ramp. Come see her launch some summer.'];
    const k=['oar','pole','tiller'].filter(q=>st.got[q]).length;
    if(k==3){st.f.bateau=1;learn('bateau');st.coins=Math.min(999,st.coins+50);needSave=true;sfx('fanfare');
      return['The oar, the pole and the tiller! She\'ll float again.','Before railroads, bateaux like this one carried tobacco down the James. You\'ve helped save a piece of that.','Take 50 coins for your trouble.',...give('hc')];}
    return['Before railroads, long flat-bottomed bateaux carried tobacco and flour down the James.','I\'m rebuilding one, but the river scattered the parts: an oar, a pole and a tiller.',
      k?'You\'ve found '+k+' of 3. Keep looking!':'Try Pony Pasture, west of Forest Hill Park. And look out on the island off this landing.'];},
  naturalist(){return['I\'m counting frogs for Maymont. They mostly come out when it rains, near the water.','The weather in this version of Richmond never quite turns to rain. Maybe someday.'];},
  folk(n){n.li=(n.li||0)+1;const c=folkContext();if(c&&n.li%2==0)return[c];return[n.lines[(n.li-1)%n.lines.length]];},
  docent(){return['The eggs in these cases were made for the Russian royal family.','Read the plaque on each case. A Virginian collector left them to the museum.'];},
  shop(){openShop('carytown');return null;},
  keeper(){learn('vampire');
    return['Folks say a pale thing crawled out of the tunnel collapse and ran here to hide in a tomb.','The truth is sadder. It\'s in your journal now if you want it.',
      st.f['dyn:ow:1,2:21,5']?'The pyramid\'s open now. The iron keystone is somewhere inside. Mind the ghosts.':'Rubble seals the pyramid door. Blasting powder from the Belle Isle quarry would clear it.'];},
  kayaker(){learn('tredegar');
    if(st.trade=='rivermap'){const L=give('kayak');p.hold=70;p.holdIc='kayak';return['A map of the old lines through the falls! I\'ve wanted one of these for years.','Here, take my spare kayak. Paddle the whitewater south of the island to reach Manchester.',...L];}
    if(st.items.kayak)return['Stay on the whitewater and you\'ll ride right across. Manchester\'s on the far bank.'];
    return['Tredegar Iron Works is just across the canal. They cast cannon there once.','The quarry door is in the rocks on the east side of the island.','Cracked rock hides more than you\'d think. Try powder on the rocks by the water.'];},
  runner(n){learn('k10');
    if(st.got.bib&&!st.items.shoes){say(['My race bib! I thought it was gone for good. Here, my spare running shoes. Fair trade.'],()=>{p.hold=70;p.holdIc='shoes';say(give('shoes'),()=>offerChal(n,[]));},n.who);return;}
    return offerChal(n,st.items.shoes?[]:['I dropped my race bib on a training run through Maymont. Find it and I\'ll trade you my spare running shoes.']);},
  henry(){learn('stjohns');return['"I know not what course others may take; but as for me, give me liberty or give me death!"','That\'s how Patrick Henry ended it, right in that church, in March of 1775.'];},
  teller(){learn('walker');return['Welcome to the St. Luke Penny Savings Bank.','Mrs. Walker started this bank in 1903 so people here could save and borrow when other banks turned them away.','Keep your coins handy, though. The Carytown shop takes them.'];},
  organist(){learn('byrd');sfx('organ');
    if(st.trade=='music'){const L=give('rivermap');p.hold=70;p.holdIc='map';return['This arrangement! I haven\'t seen it since I was a kid. You have to let me keep it.','Take this old river map in trade. It was tucked in the organ bench.',...L];}
    return['The Mighty Wurlitzer! I play her before the Saturday night show.'];},
  guide(){learn('capital1780');return['Welcome to the Capitol. The General Assembly still meets in this building.','Richmond has been Virginia\'s capital since 1780. Williamsburg was too easy for British ships to reach.'];},
  tennis(){return['Arthur Ashe learned on courts a lot like these.','The ball machine is busted right now. Come back when we get it fixed.'];},
  hoops(){return['Go Rams! The free-throw line is closed for refinishing.','Come back and shoot some another time.'];},
  racedir(){return['Welcome to the Action Track. Three-quarters of a mile of pure noise.','The next race isn\'t on the schedule yet. Check back.'];},
  sallybell(){learn('sallybell');return['Box lunches, made fresh every morning since the 1920s.','Sandwich, potato salad, a deviled egg, a cheese wafer and a cupcake, all tied up with string.'];},
  sciguide(n){n.li=(n.li||0)+1;return[['Before this was a museum, it was Broad Street Station. Thousands of travelers a day passed under this dome.','Look at the cases. Every exhibit is something you can poke, spin or climb.'],
    ['Our Dome theater shows the night sky. Out in the fog, it\'s the only place in town you can still see stars.','Have you seen the Sauer\'s sign across Broad? Its little bottle blinks all night.']][(n.li-1)%2];},
  bellhop(){if(!st.f.gator){st.f.gator=1;needSave=true;return['Welcome to the Jefferson! Mind the fountain.','Real alligators lived in these pools until 1948. Ever since the fog rolled in, guests swear one is back.','Between you and me? They\'re right.'];}
    return['Old Pompey, we call him. He seems happy. He doesn\'t eat guests.','Mostly he just likes the warm marble.'];},
  festival(){const m=new Date().getMonth();if(m==4||m==9){if(!st.f['fest'+new Date().getFullYear()+m]){st.f['fest'+new Date().getFullYear()+m]=1;st.coins=Math.min(999,st.coins+30);sfx('chest');needSave=true;
      return[m==9?'Welcome to the Richmond Folk Festival!':'Welcome to Dominion Riverrock!','Here, festival money. 30 coins. Go get a funnel cake.'];}return['Enjoy the festival!'];}
    return['Brown\'s Island is quiet today. Come back in May for Dominion Riverrock, or in October for the Richmond Folk Festival.','Either way, there\'s a present in it for you.'];}};
