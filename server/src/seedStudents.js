const fs = require('fs');
const path = require('path');
const bcrypt = require('../node_modules/bcryptjs');

const rawStudents = `
24CC001	722824134001	ADITHYAN R	9842265532	adithyan.r2024cce@sece.ac.in
24CC002	722824134002	AISHWARYA A	6380287625	aishwarya.a2024cce@sece.ac.in
24CC003	722824134003	AISHWARYA S	9345604915	aishwarya.s2024cce@sece.ac.in
24CC004	722824134004	AKASH VIVIAN S	8110002925	akashvivian.s2024cce@sece.ac.in
24CC005	722824134005	ANGELIN SHARMELL E	9080816704	angelinsharmell.e2024cce@sece.ac.in
24CC006	722824134006	ASHWATH KRISHNAA P V	9360645456	ashwathkrishnaa.pv2024cce@sece.ac.in
24CC006	722824134006	ASHWATH KRISHNAA P V	9360645466	ashwathkrishnaa.pv2024cce@sece.ac.in
24CC007	722824134007	BHARATH KUMAR K	9344164779	bharathkumar.k2024cce@sece.ac.in
24CC008	722824134008	BOOPANA M	8148016372	boopana.m2024cce@sece.ac.in
24CC009	722824134009	DARSHAN A R	8807715828	darshan.ar2024cce@sece.ac.in
24CC010	722824134010	DEEPIGA R S	7812896197	deepiga.rs2024cce@sece.ac.in
24CC011	722824134011	DEEPTHIKA B	7824929263	deepthika.b2024cce@sece.ac.in
24CC012	722824134012	DHARSHINI K	8056630304	dharshini.k2024cce@sece.ac.in
24CC013	722824134013	DHEEPAN CHAKRAVARTHI S	9994188618	dheepanchakravathi.s2024cce@sece.ac.in
24CC014	722824134014	DHEVAVARSHANA D K	6369738724	dhevavardhana.dk2024cce@sece.ac.in
24CC015	722824134015	DINESH S	9342591558	dinesh.s2024cce@sece.ac.in
24CC016	722824134016	FESTO ERICK MAPUNDA	8754958060	festoerickmapunda2024cce@sece.ac.in
24CC017	722824134017	GAYATHRI DEVI K	9865779903	gayathridevi.k2024cce@sece.ac.in
24CC018	722824134018	GOKULNAATH N	8668115823	gokulnaath.n2024cce@sece.ac.in
24CC019	722824134019	HARINARAYAN S	7010678030	harinarayan.s2024cce@sece.ac.in
24CC020	722824134020	HARINI R	8870245668	harini.r2024cce@sece.ac.in
24CC021	722824134021	HARSHITHA V	6383409429	harshitha.v2024cce@sece.ac.in
24CC022	722824134022	INIYA C	8838885300	iniya.c2024cce@sece.ac.in
24CC023	722824134023	JEBARSON E	9342334787	jebarson.e2024cce@sece.ac.in
24CC024	722824134024	KABIL MUNISHWAR	6380612089	kabilmunishwar.2024cce@sece.ac.in
24CC025	722824134025	KAVINILAVU R	9363622164	kavinilavu.r2024cce@sece.ac.in
24CC026	722824134026	KINGSTAN J	9342003360	kingstan.j2024cce@sece.ac.in
24CC027	722824134027	LATHIKASHREE S	9994874096	lathikashree.s2024cce@sece.ac.in
24CC028	722824134028	MATHIMOZHI J	9361334291	mathimozhi.j2024cce@sece.ac.in
24CC029	722824134029	MEI HARISH GOKUL S	7871736516	meiharishgokul.s2024cce@sece.ac.in
24CC030	722824134030	MOHAMED JESEEM	9361096903	mohamedjeseem.2024cce@sece.ac.in
24CC031	722824134031	MONIKA SREE D	8438940506	monikasree.d2024cce@sece.ac.in
24CC032	722824134032	NEHA S	9025307530	Neha.s2024cce@sece.ac.in
24CC033	722824134033	NETHRA HARINI K	6374505856	nethraharini.k2024cce@sece.ac.in
24CC034	722824134034	NITHIN M	9487772210	nithin.m2024cce@sece.ac.in
24CC035	722824134035	NITIN M	9445574741	nitin.m2024cce@sece.ac.in
24CC036	722824134036	NIVETHINI R V	9894350010	nivethini.rv2024cce@sece.ac.in
24CC037	722824134037	PRAGATHI S	9080650953	pragathi.s2024cce@sece.ac.in
24CC038	722824134038	PRANAV A	7845668546	pranav.a2024cce@sece.ac.in
24CC039	722824134039	PRANAW SOMESH R	7418709944	pranawsomesh.r2024cce@sece.ac.in
24CC040	722824134040	PRATHEKSHA S	9843744878	pratheksha.s2024cce@sece.ac.in
24CC041	722824134041	PRIYADHARSHNI S	6380362405	priyadharshini.s2024cce@sece.ac.in
24CC042	722824134042	PRIYANKA T M	9080469100	priyanka.tm2024cce@sece.ac.in
24CC043	722824134043	RITHANYA K	7358821254	rithanya.k2024cce@sece.ac.in
24CC044	722824134044	SABARIKARTHIKA S	9003573415	sabarikarthika.s2024cce@sece.ac.in
24CC045	722824134045	SADHANA V	9345869382	sadhana.v2024cce@sece.ac.in
24CC046	722824134046	SAKTHI KAMALAM G	9042032611	sakthikamalam.g2024cce@sece.ac.in
24CC047	722824134047	SAMVARTHINI T	9629933495	samvarthini.t2024cce@sece.in
24CC048	722824134048	SARATHI B	9342528370	sarathi.b2024cce@sece.ac.in
24CC049	722824134049	SATHURMITHA S S	7904395270	sathurmitha.ss2024cce@sece.ac.in
24CC050	722824134050	SHANTHINI P	8526753012	shanthini.p2024cce@sece.ac.in
24CC051	722824134051	SHRUTHILAYA N S	8072924796	shruthilaya.ns2024cce@sece.ac.in
24CC052	722824134052	SRI VIGNESH S	9566920232	srivignesh.s2024cce@sece.ac.in
24CC053	722824134053	SRINITHI S S	7358811899	srinithi.ss2024cce@sece.ac.in
24CC054	722824134054	SUDHIR D	8807657733	sudhir.d2024cce@sece.ac.in
24CC055	722824134055	SUGIRTHAN S	9384986755	sugirthan.s2024cce@sece.ac.in
24CC056	722824134056	SURUTHI V	9345896195	suruthi.v2024cce@sece.ac.in
24CC057	722824134057	SWATHI B K	6381772232	swathi.bk2024cce@sece.ac.in
24CC058	722824134058	TANYASRI G R	9994282233	tanyasri.gr2024cce@sece.ac.in
24CC059	722824134059	VARUNKUMAR S N	9965778080	varunkumar.sn2024cce@sece.ac.in
24CC060	722824134060	VASANTHA KUMAR M	9025457406	vasanthakumar.m2024cce@sece.ac.in
24CC061	722824134061	VISHAL S R	9994258299	vishal.sr2024cce@sece.ac.in
24CC062	722824134062	VISWESH BALAJI V S	7708952580	visweshbalaji.vs2024cce@sece.ac.in
24CC063	722824134063	YOHITHA B	9344052016	yohitha.b2024cce@sece.ac.in
24CC064	722824134064	YOSICA P	9003207958	yosica.p2024cce@sece.ac.in
24CC501	722824134501	DHATCHAN K R	7418880171	dhatchan.kr2023cce@sece.ac.in
24CC301	722824134301	DHINESH KUMAR S	7695851991	dhineshkumar.s2024lcce@sece.ac.in
`;

const femaleNames = new Set([
  'AISHWARYA A', 'AISHWARYA S', 'ANGELIN SHARMELL E', 'DEEPIGA R S', 'DEEPTHIKA B', 'DHARSHINI K',
  'DHEVAVARSHANA D K', 'GAYATHRI DEVI K', 'HARINI R', 'HARSHITHA V', 'INIYA C', 'KAVINILAVU R',
  'LATHIKASHREE S', 'MATHIMOZHI J', 'MONIKA SREE D', 'NEHA S', 'NETHRA HARINI K', 'NIVETHINI R V',
  'PRAGATHI S', 'PRATHEKSHA S', 'PRIYADHARSHNI S', 'PRIYANKA T M', 'RITHANYA K', 'SABARIKARTHIKA S',
  'SADHANA V', 'SAKTHI KAMALAM G', 'SAMVARTHINI T', 'SATHURMITHA S S', 'SHANTHINI P', 'SHRUTHILAYA N S',
  'SRINITHI S S', 'SURUTHI V', 'SWATHI B K', 'TANYASRI G R', 'YOHITHA B', 'YOSICA P'
]);

function toTitleCase(str) {
  return str.split(' ').map(w => {
    if (w.length <= 2 && !['in', 'of', 'at'].includes(w.toLowerCase())) return w.toUpperCase();
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
}

const lines = rawStudents.trim().split('\n').filter(Boolean);
console.log(`Parsing ${lines.length} student records...`);

const dbPath = path.join(__dirname, '../data/campushealth_db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Retain doctor and admin users
const existingNonStudents = (db.users || []).filter(u => u.role !== 'STUDENT');

const newUsers = [...existingNonStudents];
const newProfiles = [];

for (const line of lines) {
  const parts = line.trim().split(/\t+|\s{2,}/);
  if (parts.length < 5) {
    console.warn('Skipping line (unexpected format):', line);
    continue;
  }

  const [shortId, regNo, rawName, phone, email] = parts;
  const last4 = phone.trim().slice(-4);
  const plainPassword = `sece@${last4}`;
  const hashedPassword = bcrypt.hashSync(plainPassword, 10);
  const formattedName = toTitleCase(rawName.trim());
  const gender = femaleNames.has(rawName.trim()) ? 'Female' : 'Male';
  const cleanEmail = email.trim().toLowerCase();

  const userDoc = {
    _id: `user_${shortId.trim()}`,
    id: `user_${shortId.trim()}`,
    name: formattedName,
    email: cleanEmail,
    password: hashedPassword,
    role: 'STUDENT',
    studentId: shortId.trim(),
    registerNumber: regNo.trim(),
    department: 'Computer and Communication Engineering (CCE)',
    createdAt: new Date().toISOString()
  };

  const profileDoc = {
    _id: `prof_${shortId.trim()}`,
    id: `prof_${shortId.trim()}`,
    studentId: shortId.trim(),
    registerNumber: regNo.trim(),
    name: formattedName,
    email: cleanEmail,
    phone: phone.trim(),
    department: 'Computer and Communication Engineering (CCE)',
    year: '1st Year',
    ugOrPg: 'UG',
    accommodation: 'Day Scholar',
    gender: gender,
    age: 19,
    dob: '2006-05-15',
    bloodGroup: '',
    emergencyContact: {
      name: 'Parent / Guardian',
      relation: 'Parent',
      phone: phone.trim()
    },
    medicalCentreContact: '+91-44-2257-0000',
    criticalAllergies: [],
    criticalConditions: [],
    criticalMedications: [],
    heightCm: 168,
    weightKg: 62,
    bmi: 22.0,
    lastUpdated: new Date().toISOString(),
    profileComplete: true
  };

  newUsers.push(userDoc);
  newProfiles.push(profileDoc);
}

db.users = newUsers;
db.profiles = newProfiles;

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log(`✅ Success! Seeded ${newProfiles.length} students into ${dbPath}`);
console.log(`Total users in DB: ${db.users.length} (including ${existingNonStudents.length} staff)`);
