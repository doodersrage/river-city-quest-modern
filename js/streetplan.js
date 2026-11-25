"use strict";
/* River City Quest Modern: the real streets around each landmark. Each district with a plan is laid out by hand
   after the actual streets that bound its landmark, in their real order and with their real names, with the
   real neighbors placed along them and a plaque for each. Distances are compressed: a map is about one real
   city block across, so a street here stands for the street there, not a survey of it.
   Coordinates are tiles on the enlarged 64 by 44 map; the original map sits at 16..47 by 11..32. */
const STREETPLAN={};
(function(){const town=f=>{f.town=true;return f;};
  // Capitol Square: the fenced square is bounded by Ninth, Broad, Governor and Bank streets
  STREETPLAN['ow:2,1']=town(a=>{
    a.street('E Broad St',1,6,62,9,{trees:1});a.street('N 9th St',12,1,14,42);a.street('Governor St',49,10,51,42);a.street('Bank St',12,34,51,35);a.street('E Main St',1,40,62,41);a.street('E Grace St',1,16,11,17);
    a.name('N 10th St',29,1,34,10);a.name('S 10th St',29,33,34,43);a.name('E Franklin St',1,19,15,24);a.name('E Franklin St',48,19,63,24);a.name('Capitol Square',16,11,47,32);
    a.landmark('cityhall',36,1,10,4,'!oldcityhall');a.plaque('oldcityhall','Old City Hall','Gray granite, pointed arches and a clock tower, finished in 1894. It faces the Capitol across Broad Street.',47,5);
    a.landmark('temple',4,11,6,4,'!stpauls');a.plaque('stpauls',"St. Paul's Episcopal Church",'Built in 1845, a Greek Revival church with a tall columned porch, just across Ninth Street from Capitol Square.',10,15);
    a.plaque('libva','Library of Virginia','The state library and archives, on the north side of Broad Street.',20,5);
    a.plaque('morson',"Morson's Row",'Three bow-fronted town houses built in 1853 as rentals. They are the last of the houses that once ringed Capitol Square.',52,14);
    a.plaque('customs','The Old Custom House','Begun before the Civil War and one of the few buildings downtown to come through the 1865 evacuation fire. It grew into the federal courthouse on Main Street.',40,36);
    a.lot(54,26,61,31);a.fill(53,28,53,29,'p');});
  // Shockoe Bottom: Main Street Station stands on East Main at 15th, with the market two blocks east on 17th
  STREETPLAN['ow:3,1']=town(a=>{
    a.street('E Franklin St',1,6,62,8);a.street('E Cary St',1,36,62,38);a.street('N 14th St',9,1,11,42);a.street('N 17th St',50,1,52,42);a.street('N 18th St',58,9,60,35);
    a.name('N 15th St',29,1,34,10);a.name('S 15th St',29,33,34,43);a.name('E Main St',1,19,63,24);
    a.fill(54,10,56,18,'s',5,'t');a.plaque('market17','17th Street Market','Farmers have sold here, between Main and Franklin on 17th Street, since the 1700s. It is one of the oldest public market sites in the country.',55,18);
    a.plaque('tobaccorow','Tobacco Row','The long brick warehouses and factories south and east of here cured, packed and shipped tobacco. Most are apartments now.',40,39);
    a.lot(2,26,7,31);});
  // Church Hill: St. John's fills the block between Broad and Grace, 24th and 25th
  STREETPLAN['ow:3,0']=town(a=>{
    a.street('E Broad St',1,6,62,8,{trees:1});a.street('E Grace St',1,35,62,37,{trees:1});a.street('N 24th St',10,1,12,42);a.street('N 25th St',51,1,53,42);
    a.name("St. John's Churchyard",16,11,47,32);a.name('E Franklin St',1,19,9,24);a.name('E Franklin St',54,19,63,24);
    a.fill(14,10,49,10,'.',7,'T');a.fill(14,33,49,33,'.',7,'T');a.fill(14,11,15,32,'.',6,'T');a.fill(48,11,49,32,'.',6,'T');
    a.fill(2,3,8,3,'.',3,'T');a.fill(14,3,28,3,'.',3,'T');a.fill(35,3,49,3,'.',3,'T');a.fill(55,3,62,3,'.',3,'T');a.fill(2,40,8,40,'.',3,'T');a.fill(14,40,28,40,'.',3,'T');a.fill(35,40,49,40,'.',3,'T');
    a.fill(55,26,62,34,'.',6,'T');a.fill(55,39,62,42,'.',6,'T');a.plaque('libbyhill','Libby Hill Park','From this hill the bend of the James looked to William Byrd II like the Thames seen from Richmond Hill in England. The view gave the city its name.',54,28);
    a.fill(2,12,8,17,'.',4,'T');});
  // Carytown: the Byrd is on West Cary between Sheppard and Colonial, a block west of the Boulevard
  STREETPLAN['ow:0,1']=town(a=>{
    a.street('S Arthur Ashe Blvd',57,1,61,42,{median:1});a.street('Ellwood Ave',1,6,62,8);a.street('S Colonial Ave',50,9,52,42);a.street('S Belmont Ave',9,1,11,42);a.street('Idlewood Ave',1,39,62,40);
    a.name('W Cary St',1,19,63,24);a.name('S Sheppard St',29,1,35,10);a.name('S Sheppard St',29,33,34,43);
    a.lot(36,34,48,37);a.plaque('byrddeck','Parking behind the Byrd','The public parking deck behind the theatre, reached from Colonial Avenue.',49,35);
    a.lot(1,26,7,31);a.plaque('carycourt','Cary Court','Cary Court Park and Shop opened in 1938. It was Richmond\'s first shopping center built around a parking lot.',8,26);});
  // The Fan: Monument Avenue with its grass median, Grace Street to the north and Park Avenue to the south
  STREETPLAN['ow:1,1']=town(a=>{
    a.street('N Meadow St',9,1,11,42);a.street('N Lombardy St',51,1,53,42);a.street('W Grace St',1,4,62,5,{trees:1});a.street('Park Ave',1,38,62,39,{trees:1});
    a.name('Monument Ave',1,19,63,24);a.name('N Allen Ave',29,1,34,43);
    // behind every row of houses, back gardens and a cobbled alley
    for(const [x0,x1] of [[1,7],[13,28],[35,49],[55,62]]){a.fill(x0,8,x1,8,'.',3,'T');a.fill(x0,9,x1,9,'p');a.fill(x0,35,x1,35,'p');a.fill(x0,36,x1,36,'.',3,'T');}
    a.name('alley',1,9,62,9);a.name('alley',1,35,62,35);
    a.plaque('stuartcircle','Stuart Circle','Monument Avenue begins here at Lombardy Street and runs west, a boulevard of grass medians, old trees and grand houses.',55,19);});
  // Jackson Ward: the Hippodrome is on Second Street, "the Deuce", between Clay and Leigh
  STREETPLAN['ow:2,0']=town(a=>{
    a.street('E Leigh St',1,6,62,8,{trees:1});a.street('E Marshall St',1,36,62,38);a.street('N 1st St',10,1,12,42);a.street('N 3rd St',51,1,53,42);
    a.name('E Clay St',1,19,63,24);a.name('N 2nd St',29,1,34,43);
    a.fill(2,1,8,4,'s',6,'t');a.put(5,3,'Y');a.plaque('bojangles','Bill "Bojangles" Robinson','The statue of the dancer went up in 1973 where Leigh Street meets Adams. He paid for a traffic light at this corner after a child was hurt crossing.',6,5);
    a.plaque('walker','Maggie L. Walker House','At 110 1/2 East Leigh Street, on Quality Row, lived the first woman in America to charter a bank. The house is a National Historic Site.',22,9);
    a.plaque('eggleston','The Eggleston Hotel','At Second and Leigh stood Miller\'s Hotel, later the Eggleston, where the musicians who played the Hippodrome stayed.',35,9);});
})();
