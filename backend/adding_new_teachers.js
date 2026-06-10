const mysql = require('mysql2/promise');
require('dotenv').config();
const argv = require('minimist')(process.argv.slice(2));

const dbConfig = {
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
};

// subject rules
const subjectRules = [
  ['history','History'], ['social studies','History'],
  ['art','Art'], ['visual art','Art'], ['theatre','Art'], ['photography','Art'],
  ['spanish','World Languages'], ['french','World Languages'], ['mandarin','World Languages'],
  ['classics','World Languages'], ['latin','World Languages'],
  ['english','English'],
  ['math','Math'],
  ['computer science','Computer Science'], ['technology','Computer Science'], ['engineering','Computer Science'],
  ['chemistry','Science'], ['biology','Science'], ['physics','Science'], ['science','Science'],
  ['music','Music'], ['band','Music'], ['orchestra','Music'],
];

// detect subject
function detectSubject(title = '') {
  const t = title.toLowerCase();
  for (const [k,v] of subjectRules) if (t.includes(k)) return v;
  return 'Other';
}

// detect Chair
function isChair(title='') {
  return title.toLowerCase().includes('chair');
}

// normalize name string -> [first,last]
function parseName(fullName = '') {
  if (!fullName) return ['', ''];
  if (fullName.includes(',')) {
    const [last, first] = fullName.split(',').map(x => x.trim());
    return [first || '', last || ''];
  }
  const parts = fullName.split(/\s+/);
  const last = parts.pop();
  const first = parts.join(' ');
  return [first, last];
}

// sanitize email
function normalizeEmail(e='') { return (e||'').trim().toLowerCase(); }

// build departments string
function buildDepartments(division, title) {
  const subject = detectSubject(title);
  const chairTag = isChair(title) ? 'Chair' : null;
  const parts = [division && division.trim(), subject, chairTag, title && title.trim()]
    .filter(Boolean);
  return Array.from(new Set(parts)).join(',');
}

// ---- PASTE TAB-SEP EXCEL BLOCK BELOW ----
const excelPaste = `
Abraham-McLaughlin, Soly	smclaughlin@episcopalacademy.org	Middle School	CTL and MS Administrative Assistant
Aldridge, Kris	Aldridge@episcopalacademy.org	Upper School	US Teacher
Bailey, Jerome	jbailey@episcopalacademy.org	Middle School	MS History Teacher
Barr, Anne	Abarr@episcopalacademy.org	Upper School	US Teacher
Berberian, Joshua	jberberian@episcopalacademy.org	Upper School	Director of Institutional Research 
Bilbao, Erin	ebilbao@episcopalacademy.org	Upper School	6-12 Modern Languages Department Chair and US Spanish Teacher
Binstock, John	jbinstock@episcopalacademy.org	Upper School	MS/US Woodworking and Design Teacher
Bosio, Stephen	sbosio@episcopalacademy.org	Upper School	US/MS Teacher
Brotschul, Amy	abrotschul@episcopalacademy.org	Upper School	US French Teacher and Community Service Coordinator
Bryant, Charles	Bryant@episcopalacademy.org	Upper School	US Teacher
Burnett, Lee	lburnett@episcopalacademy.org	Upper School	MS Classics Teacher 
Cerenzia, Christina	ccerenzia@episcopalacademy.org	Upper School	Senior Associate Director of College Counseling
Clay, Daniel	dclay@episcopalacademy.org	Upper School	6-12 Theatre Department Chair and Teacher
Cloud, Caridad	cacloud@episcopalacademy.org	Upper School	US Spanish Teacher
Colyer, Katalin	kcolyer@episcopalacademy.org	Upper School	Stone Family Science Department Chair
Cossel, Cheryl	ccossel@episcopalacademy.org	Upper School	US Chemistry Teacher
Crowley, Shannon	scrowley@episcopalacademy.org	Upper School	US Computer Science Teacher
Curry, MacKenzie	mcurry@episcopalacademy.org	Upper School	LS Assistant Teacher
Dankanich, Ryan	rdankanich@episcopalacademy.org	Upper School	MS/US Music Teacher
Davis, Matthew	mdavis@episcopalacademy.org	Upper School	US Teacher
Deirmengian, Cristina	cdeirmengian@episcopalacademy.org	Upper School	US Teacher
Doherty, Niall	NDoherty@episcopalacademy.org	Middle School	MS Spanish Teacher
Dragwa, Claire	cdragwa@episcopalacademy.org	Middle School	MS/US French Teacher
Dupont, Heather	hdupont@episcopalacademy.org	Middle School	6-12 English Department Chair and Teacher
Edwards, Kelly	KEdwards@episcopalacademy.org	Upper School	Academic Dean
Erikson, Ellen	eerikson@episcopalacademy.org	Upper School	US Photography Teacher
Erwin, James	jerwin@episcopalacademy.org	Upper School	MS and US Music Teacher
Farrell, James	Farrell@episcopalacademy.org	Upper School	Associate Director of Athletics and US Teacher
Finegan, James	JFinegan@episcopalacademy.org	Middle School	MS/US Music Teacher
Finnical, Lauren	LFinnical@episcopalacademy.org	Middle School	8th Grade Form Dean and MS Science Teacher 
Fraggos, Andrew	afraggos@episcopalacademy.org	Middle School	MS History Teacher
Friend, Keenan	kfriend@episcopalacademy.org	Upper School	US Math Teacher
Fu, Shaofang	sfu@episcopalacademy.org	Middle School	MS/US Mandarin Teacher
Furey, Christele	CFurey@episcopalacademy.org	Upper School	US Teacher
Goebeler, Thomas	TGoebeler@episcopalacademy.org	Upper School	US Teacher
Goens, John	Goens@episcopalacademy.org	Middle School	MS English Teacher
Golden, Lauren	lgolden@episcopalacademy.org	Middle School	MS Spanish Teacher
Grayberg, Daniel	dgrayberg@episcopalacademy.org	Middle School	Technical Director and Theater Manager
Grieco, Lara	lgrieco@episcopalacademy.org	Upper School	Senior Associate Director of College Counseling
Guzman, Catalina	cguzman@episcopalacademy.org	Upper School	Executive Director of College Counseling
Harding, Lorie	lharding@episcopalacademy.org	Upper School	The Anthony W. Ridgway Librarian's Chair and Director of Libraries
Hardison, Anneliese	ahardison@episcopalacademy.org	Middle School	MS Music Teacher
Harris, Ivy	iharris@episcopalacademy.org	Middle School	Middle School Learning Specialist
Hay, Sheli	shay@episcopalacademy.org	Middle School	MS Librarian
Henderson, Lawrence	lhenderson@episcopalacademy.org	Middle School	MS History Teacher
Herman, Anthony	therman@episcopalacademy.org	Upper School	US English Teacher
Hill, Jonathan	jhill@episcopalacademy.org	Upper School	US Computer Science Teacher
Howlin, Roberta	Howlin@episcopalacademy.org	Middle School	MS History Teacher
Hutchison, Hilary	HHutchison@episcopalacademy.org	Upper School	US Teacher
Jennings, James	jjennings@episcopalacademy.org	Upper School	US Math Teacher
Johnson, Jade	jjohnson@episcopalacademy.org	Upper School	Senior Associate Director of College Counseling
Jones, Jennifer	jjones@episcopalacademy.org	Upper School	US Teacher
Kelly, John	JKelly@episcopalacademy.org	Upper School	US Form Dean (2025) and US Teacher
Kerwin, Stephen	skerwin@episcopalacademy.org	Middle School	7th Grade Form Dean and MS Science Teacher
Klein, Ryan	rklein@episcopalacademy.org	Upper School	US Form Dean (2027) and US Teacher
Konopka, Mary Sarah	Konopka@episcopalacademy.org	Upper School	US Teacher 
Kurz, Alyson	akurz@episcopalacademy.org	Upper School	US Learning Specialist
Kuzemka, Damon	DKuzemka@episcopalacademy.org	Upper School	US Teacher
Leighton, Amanda	aleighton@episcopalacademy.org	Upper School	US Science Teacher
Letts, Michael	letts@episcopalacademy.org	Upper School	Head of Upper School
Lew, Linda	Lew@episcopalacademy.org	Middle School	MS Technology Coordinator
Lim, Susie	slim@episcopalacademy.org	Upper School	US Science Teacher
Limaye, Grace	glimaye@episcopalacademy.org	Upper School	Science Teacher
Lorenson, George	glorenson@episcopalacademy.org	Upper School	US Science Teacher
Luff, Mark	Luff@episcopalacademy.org	Middle School	MS English Teacher
Maier, Mary	mmaier@episcopalacademy.org	Upper School	Senior Associate Director of College Counseling
Martin, Elizabeth	lmartin@episcopalacademy.org	Upper School	LTS US Learning Specialist
Martin, Nyazia	nmartin@episcopalacademy.org	Middle School	MS Associate Teacher
Mathisen, Edward	emathisen@episcopalacademy.org	Upper School	US Teacher
McAnally, Charles	cmcanally@episcopalacademy.org	Middle School	MS History Teacher
McCreary, Christopher	cmccreary@episcopalacademy.org	Upper School	US Teacher
McDermott, Anna	McDermot@episcopalacademy.org	Upper School	US Teacher and Academic Coach
McGill, Margaret	mmcgill@episcopalacademy.org	Middle School	MS English Teacher
McGoldrick, Carrie	cmcgoldrick@episcopalacademy.org	Middle School	MS Math Teacher
McNulty, Michael	mmcnulty@episcopalacademy.org	Upper School	US Teacher
Memmo, Matthew	mmemmo@episcopalacademy.org	Upper School	6-12 Computer Science and Engineering Chair and Teacher
Mercante, David	dmercante@episcopalacademy.org	Upper School	US Teacher
Montgomery, Meaghan	mmontgomery@episcopalacademy.org	Middle School	MS Spanish Teacher
Morris, Stephen	Morris@episcopalacademy.org	Upper School	MS/US Math Teacher
Motley, Tracy	tmotley@episcopalacademy.org	Upper School	US Math Teacher
Mullan, Laura	lmullan@episcopalacademy.org	Middle School	MS Science Teacher
Mundy, Eric	emundy@episcopalacademy.org	Upper School	US Teacher 
Muraoka, Trey	tmuraoka@episcopalacademy.org	Middle School	MS Classics Teacher
Murray, Tanuja	tmurray@episcopalacademy.org	Upper School	US Form Dean (2028) and US Teacher 
Newcomb, Matthew	mnewcomb@episcopalacademy.org	Middle School	Assistant Head of Middle School
Newman, William	wnewman@episcopalacademy.org	Upper School	US English Teacher
Newton, Andrew	anewton@episcopalacademy.org	Upper School	US Teacher
Ni, Kaiyao	kni@episcopalacademy.org	Upper School	US Manadarin Teacher
Nicholson, Alice	anicholson@episcopalacademy.org	Middle School	MS Classics Teacher
Nielsen, Caroline	cnielsen@episcopalacademy.org	Upper School	US Science Teacher
O'Connor, Ashley	aoconnor@episcopalacademy.org	Upper School	Interim 6-12 Mathematics Department Chair 
Palmisano, Michael	mpalmisano@episcopalacademy.org	Middle School	MS Chaplain
Parsons, Robert	dparsons@episcopalacademy.org	Upper School	US Teacher 
Reeve, Lauren	lreeve@episcopalacademy.org	Upper School	US Administrative Assistant
Reil, Julie	jreil@episcopalacademy.org	Middle School	MS French Teacher
Rheam, Christy	CRheam@episcopalacademy.org	Upper School	US Teacher
Richards, Zachary	ZRichards@episcopalacademy.org	Upper School	US Form Dean (2026) and US Teacher
Rohr, Grace	grohr@episcopalacademy.org	Upper School	US Science Teacher
Rosenthal, Rebecca	rrosenthal@episcopalacademy.org	Middle School	MS/US Classics Teacher
Row, Christopher	CRow@episcopalacademy.org	Upper School	US Teacher
Rudolph, Pamela	prudolph@episcopalacademy.org	Upper School	US Spanish Teacher
Ruggiero, Melissa	mruggiero@episcopalacademy.org	Middle School	MS Math Teacher
Safford, Anna	asafford@episcopalacademy.org	Upper School	US English Teacher
Santangelo, Lauren	lsantangelo@episcopalacademy.org	Middle School	MS Math Teacher
Saraco, Cara	csaraco@episcopalacademy.org	Upper School	US English Teacher
Schooley, Oya	oschooley@episcopalacademy.org	Upper School	Senior Associate Director of College Counseling
Schuh, Steven	sschuh@episcopalacademy.org	Upper School	6-12 History Department Chair and Teacher
Schultz, Allison	ASchultz@episcopalacademy.org	Middle School	MS Math Teacher and Coordinator, Teaching and Learning
Selfridge, Emily	eselfridge@episcopalacademy.org	Middle School	MS Science Teacher
Sheehan, Michael	msheehan@episcopalacademy.org	Upper School	K-12 Religion Department Chair & Teacher
Shimrock, Andrew	ashimrock@episcopalacademy.org	Upper School	US Teacher
Sigel, David	dsigel@episcopalacademy.org	Upper School	PreK-12 Visual Art Department Chair and Teacher
Silberman, Holly	hsilberman@episcopalacademy.org	Middle School	MS English Teacher
Simmonds, Charles	csimmonds@episcopalacademy.org	Middle School	MS Math Teacher 
Slayton, Christopher	cslayton@episcopalacademy.org	Middle School	Long-Term Substitute MS Math Teacher
Smith, Ronald	rvsmith@episcopalacademy.org	Upper School	US Science Teacher
Stetina, Mark	mstetina@episcopalacademy.org	Middle School	US/MS History Teacher
Straub, Kiley	kstraub@episcopalacademy.org	Middle School	MS Math Teacher
Subacus, Melanie	msubacus@episcopalacademy.org	Middle School	6-12 Classics Department Chair
Sweeney, Celeste	CSweeney@episcopalacademy.org	Middle School	6th Grade Form Dean and MS Science Teacher
Tate, Ayinde	atate@episcopalacademy.org	Upper School	Director of Diversity and Inclusion
Tomkowich, Gina	GTomkowich@episcopalacademy.org	Middle School	MS Teacher and MS Dance Head Coach
Tucci, Emily	etucci@episcopalacademy.org	Middle School	MS Art Teacher
Viscusi, Jacob	jviscusi@episcopalacademy.org	Upper School	US Math Teacher
Whalen, Michael	mwhalen@episcopalacademy.org	Upper School	US Teacher
Willis, Samuel	swillis@episcopalacademy.org	Upper School	US English Teacher
Workman, Julia	jworkman@episcopalacademy.org	Upper School	US English Teacher
Wright, Jerold	jwright@episcopalacademy.org	Upper School	US Teacher
Yaros, Mireya	Yaros@episcopalacademy.org	Upper School	US Teacher
Yu, Andrea	ayu@episcopalacademy.org	Upper School	US Librarian
`.trim();
// ----------------------------------------

if (!excelPaste) {
  console.error('paste your tab-separated block into excelPaste variable and re-run.');
  process.exit(1);
}

// parse rows
const rows = excelPaste.split(/\r?\n/).map(r => r.trim()).filter(Boolean);
const parsed = rows.map(line => {
  let cols = line.split('\t');
  while (cols.length < 4) cols.push('');
  const [nameRaw, emailRaw, divisionRaw, titleRaw] = cols.map(c => c.trim());
  const [first_name, last_name] = parseName(nameRaw);
  const email = normalizeEmail(emailRaw);
  const departments = buildDepartments(divisionRaw, titleRaw);
  return { first_name, last_name, email, role:'teacher', departments, raw:{nameRaw, divisionRaw, titleRaw} };
});

// preview first 10
console.log('Parsed entries preview (first 10):');
console.table(parsed.slice(0,10).map(p => ({first:p.first_name,last:p.last_name,email:p.email,departments:p.departments})));

const APPLY = !!argv.apply; // run with --apply to actually write DB
(async function main(){
  if (!APPLY) {
    console.log('\nDRY RUN: no DB writes. To apply changes run: node populate_backup.js --apply\n');
    return;
  }

  const conn = await mysql.createConnection(dbConfig);
  try {
    await conn.beginTransaction();

    // upsert logic: update by email, insert if not exists
    for (const p of parsed) {
      if (!p.email) continue;
      const [updateResult] = await conn.execute(
        `UPDATE Users SET first_name=?, last_name=?, role=?, departments=? WHERE email=?`,
        [p.first_name, p.last_name, p.role, p.departments, p.email]
      );
      if (updateResult.affectedRows === 0) {
        await conn.execute(
          `INSERT INTO Users (first_name,last_name,email,role,departments) VALUES (?,?,?,?,?)`,
          [p.first_name, p.last_name, p.email, p.role, p.departments]
        );
      }
    }

    await conn.commit();
    console.log('All teachers populated into Users table.');
  } catch (err) {
    await conn.rollback();
    console.error('ERROR: rolled back. ', err);
  } finally {
    await conn.end();
  }
})();